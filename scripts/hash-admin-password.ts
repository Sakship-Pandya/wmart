// Creates the value for ADMIN_PASSWORD_HASH, so the real admin password is never stored.
// Run:  npx tsx scripts/hash-admin-password.ts "<your long admin password>"
//
// Paste the printed line into .env exactly as printed. Every "$" in the hash is written
// as "\$" because Next.js treats "$name" inside .env values as a variable to insert –
// even inside single quotes – which would cut the hash short and block every login.
// On a hosting dashboard (Render, Vercel…) you can paste the same value; the login
// check accepts it with or without the backslashes.
// Same format as src/lib/password.ts: scrypt$N$r$p$salt$hash
import crypto from "node:crypto";

const UNICODE_FORM = "NFKC"; // same as src/lib/password.ts
const input = process.argv[2];
if (!input || input.length < 12) {
  console.error("Give a password of at least 12 characters, in quotes, after the script name.");
  process.exit(1);
}
const N = 16384, r = 8, p = 1;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(input.normalize(UNICODE_FORM), salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
const value = ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join("$");
console.log(`ADMIN_PASSWORD_HASH=${value.replace(/\$/g, "\\$")}`);
