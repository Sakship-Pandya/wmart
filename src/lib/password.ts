import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";

// Customer password hashing with scrypt (built into Node – no extra package).
// Stored format: "scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>", so the cost can be raised later
// without breaking existing passwords.

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
// Unicode form applied before hashing, so the same password typed on different keyboards matches.
const UNICODE_FORM = "NFKC";
const normalized = (text: string) => text.normalize(UNICODE_FORM);

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(normalized(password), salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(normalized(password), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// A real hash of a random password, checked when the email doesn't exist,
// so a wrong email takes as long as a wrong password (no way to probe which emails have accounts).
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(crypto.randomBytes(16).toString("hex"));
  await verifyPassword(password, await dummyHash);
  return false;
}
