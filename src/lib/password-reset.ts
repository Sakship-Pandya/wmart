import "server-only";
import crypto from "node:crypto";
import { db } from "@/lib/db";

// Password reset links without a database table: the token is signed with AUTH_SECRET and holds
// the customer id, an expiry and a fingerprint of the current password hash. Once the password
// changes the fingerprint no longer matches, so every link works only once (and old links die).

export const RESET_VALID_MINUTES = 60;

function signingKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production.");
    return "wmart-dev-only-password-reset-key";
  }
  // Separate derived key, so a reset token can never be used as a session cookie or vice versa.
  return crypto.createHmac("sha256", secret).update("password-reset-v1").digest("hex");
}

const sign = (payload: string) => crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");
const fingerprint = (passwordHash: string | null) =>
  crypto.createHash("sha256").update(`reset:${passwordHash ?? ""}`).digest("base64url").slice(0, 16);

type Payload = { cid: string; exp: number; pf: string };

export function createResetToken(customer: { id: string; passwordHash: string | null }): string {
  const payload: Payload = { cid: customer.id, exp: Date.now() + RESET_VALID_MINUTES * 60_000, pf: fingerprint(customer.passwordHash) };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** The customer a reset token belongs to, or null if it is forged, expired or already used. */
export async function customerForResetToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Payload;
  } catch {
    return null;
  }
  if (typeof payload.cid !== "string" || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  const customer = await db.customer.findUnique({
    where: { id: payload.cid },
    select: { id: true, email: true, passwordHash: true, firstName: true, displayName: true },
  });
  if (!customer || fingerprint(customer.passwordHash) !== payload.pf) return null;
  return customer;
}
