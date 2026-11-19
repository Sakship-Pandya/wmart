import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "wmart_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "wmart-dev-auth-secret-change-in-production-2026";
}

function sign(payload: string): string {
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
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

  const expectedSignature = sign(encoded);
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const session = JSON.parse(json) as AdminSession;
    if (session.expiresAt < Date.now()) {
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
