import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";

// Customer login session: a signed, httpOnly cookie holding the customer id and an expiry.
// Separate from the admin session (different cookie, different signing key).
// The cookie also carries a fingerprint of the password hash, so changing the password
// signs out every other device.

const COOKIE = "wmart_customer";
/** Readable marker for "log out when the last tab closes" (see TabSessionGuard). */
export const TAB_COOKIE = "wmart_tab_session";
const REMEMBER_SECONDS = 60 * 60 * 24 * 30; // "Remember me": 30 days
const SESSION_SECONDS = 60 * 60 * 24; // otherwise: until the browser closes, at most 1 day

function signingKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production.");
    return "wmart-dev-only-customer-session-key";
  }
  // Derive a customer-only key so admin and customer tokens can never be swapped.
  return crypto.createHmac("sha256", secret).update("customer-session-v1").digest("hex");
}

/** Throws if sessions can't be signed (no AUTH_SECRET in production). Call before changing anything. */
export function assertSessionConfigured() {
  signingKey();
}

const sign = (payload: string) => crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");
const fingerprint = (passwordHash: string | null) =>
  crypto.createHash("sha256").update(passwordHash ?? "").digest("base64url").slice(0, 16);

type Payload = { cid: string; exp: number; pf: string };

export async function createCustomerSession(customer: { id: string; passwordHash: string | null }, remember: boolean) {
  const seconds = remember ? REMEMBER_SECONDS : SESSION_SECONDS;
  const payload: Payload = { cid: customer.id, exp: Date.now() + seconds * 1000, pf: fingerprint(customer.passwordHash) };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(COOKIE, `${encoded}.${sign(encoded)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // No maxAge without "Remember me": the browser drops the cookie when it closes.
    ...(remember ? { maxAge: seconds } : {}),
  });
  // Without "Remember me" the session should also end when the customer closes their last
  // WMart tab. Browsers keep session cookies until the whole browser closes, so a small client
  // check (TabSessionGuard) does it; this readable cookie tells it to. "new" = claimed by the tab
  // that just logged in. It holds no secret – the real session is the httpOnly cookie above.
  const store = await cookies();
  if (remember) store.delete(TAB_COOKIE);
  else store.set(TAB_COOKIE, "new", { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
}

export async function destroyCustomerSession() {
  const store = await cookies();
  store.delete(COOKIE);
  store.delete(TAB_COOKIE);
}

function readToken(token: string | undefined): Payload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Payload;
    return typeof p.cid === "string" && typeof p.exp === "number" && p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

export type CurrentCustomer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
};

/** The signed-in customer, or null. Loaded once per request. */
export const getCurrentCustomer = cache(async (): Promise<CurrentCustomer | null> => {
  await connection();
  const payload = readToken((await cookies()).get(COOKIE)?.value);
  if (!payload) return null;
  const customer = await db.customer.findUnique({
    where: { id: payload.cid },
    select: { id: true, email: true, firstName: true, lastName: true, displayName: true, phone: true, passwordHash: true },
  });
  // Deleted customer, or the password was changed since this cookie was made.
  if (!customer || !customer.passwordHash || fingerprint(customer.passwordHash) !== payload.pf) return null;
  const { passwordHash: _omit, ...rest } = customer;
  void _omit;
  return rest;
});

/** For My account pages: the signed-in customer, or a redirect to the login page. */
export async function requireCustomer(next = "/account"): Promise<CurrentCustomer> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return customer;
}

/** A friendly name for greetings. */
export function customerName(c: Pick<CurrentCustomer, "displayName" | "firstName" | "email">) {
  return c.displayName || c.firstName || c.email.split("@")[0];
}

/** Only allow redirects back into this site (e.g. "/checkout"), never to another website. */
/**
 * Where to send the customer right after logging in / registering: `next` if it is a page on
 * this site, else `fallback`. Logging in from "My account" lands on the home page (as requested);
 * other pages such as /checkout are returned to.
 */
export function safeNext(next: unknown, fallback = "/"): string {
  const target = sameSitePath(next);
  if (!target || target === "/account") return fallback;
  return target;
}

/** `next` if it is a path on this site (not "//evil.com" or "/\evil.com"), otherwise null. */
export function sameSitePath(next: unknown): string | null {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
}
