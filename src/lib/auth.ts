import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "wmart_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Signing key for admin sessions. In production AUTH_SECRET must be set (no fixed fallback,
// otherwise anyone who reads this code could forge an admin login). A separate key is derived
// for admins so admin and customer session cookies can never be swapped.
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production.");
    return "wmart-dev-only-admin-session-key";
  }
  return crypto.createHmac("sha256", secret).update("admin-session-v1").digest("hex");
}

/** Throws if admin sessions can't be signed. Call before checking a password. */
export function assertAdminSessionConfigured() {
  getAuthSecret();
}

function sign(payload: string): string {
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/** Admins currently listed in ADMIN_EMAILS (an admin removed from the list loses access straight away). */
function isListedAdmin(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

export interface AdminSession {
  email: string;
  expiresAt: number;
}

/**
 * Creates and sets a signed admin session cookie.
 */
export async function createAdminSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const data = JSON.stringify({ email, expiresAt });
  const encoded = Buffer.from(data).toString("base64url");
  const signature = sign(encoded);
  const token = `${encoded}.${signature}`;

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Validates the current admin session cookie.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let expectedSignature: string;
  try {
    expectedSignature = sign(encoded);
  } catch {
    return null; // AUTH_SECRET missing in production: treat as signed out instead of crashing the page
  }
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const session = JSON.parse(json) as AdminSession;
    if (session.expiresAt < Date.now() || !isListedAdmin(session.email)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Clears the admin session cookie.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Call at the top of every admin page, layout, or server action.
 * If no valid session exists, redirects immediately to /admin/login.
 */
export async function requireAdmin(): Promise<AdminSession> {
  await connection();
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
