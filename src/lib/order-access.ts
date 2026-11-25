import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// Lets a browser view /order/[id] for orders it placed (or found with Track order),
// without an account. The cookie holds a signed list of order ids, so it can't be
// edited to open someone else's order. Signed-in customers can always see their own orders.

const COOKIE = "wmart_order_access";
const MAX_ORDERS = 20;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function signingKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production.");
    return "wmart-dev-only-order-access-key";
  }
  // Own derived key, so these tokens can't be swapped with login sessions.
  return crypto.createHmac("sha256", secret).update("order-access-v1").digest("hex");
}

const sign = (payload: string) => crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");

function readIds(token: string | undefined): string[] {
  if (!token) return [];
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return [];
  const expected = sign(encoded);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return [];
  try {
    const ids = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string").slice(0, MAX_ORDERS) : [];
  } catch {
    return [];
  }
}

/** Remembers that this browser may view `orderId`. Only call from a Server Action or Route Handler. */
export async function grantOrderAccess(orderId: string) {
  const store = await cookies();
  const ids = [orderId, ...readIds(store.get(COOKIE)?.value).filter((id) => id !== orderId)].slice(0, MAX_ORDERS);
  const encoded = Buffer.from(JSON.stringify(ids)).toString("base64url");
  store.set(COOKIE, `${encoded}.${sign(encoded)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** True when this browser placed (or looked up) `orderId`. */
export async function hasOrderAccess(orderId: string): Promise<boolean> {
  return readIds((await cookies()).get(COOKIE)?.value).includes(orderId);
}
