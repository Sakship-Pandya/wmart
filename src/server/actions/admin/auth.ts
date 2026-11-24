"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { assertAdminSessionConfigured, createAdminSession, destroyAdminSession } from "@/lib/auth";
import { verifyAgainstDummy, verifyPassword } from "@/lib/password";
import { clearAttempts, tooManyAttempts } from "@/lib/rate-limit";

// Admin sign-in. Access needs BOTH settings in .env – there are no built-in defaults:
//   ADMIN_EMAILS         comma-separated list of admin email addresses
//   ADMIN_PASSWORD_HASH  (recommended) made with: npx tsx scripts/hash-admin-password.ts "..."
//                        paste the printed line as-is (each "$" written as "\$", see the script)
//   or ADMIN_PASSWORD    the password itself (at least 12 characters in production)

const WRONG = "Incorrect email or password.";
const NOT_CONFIGURED = "Admin sign-in is not set up on this server. Add ADMIN_EMAILS and ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) to .env.";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Checks the password against ADMIN_PASSWORD_HASH, or else ADMIN_PASSWORD (compared in constant time). */
async function checkAdminPassword(password: string): Promise<boolean | "not-configured"> {
  // In .env the hash is written with "\$" (Next.js would otherwise expand "$..." as variables);
  // .env loading turns those back into "$". Values pasted into a hosting dashboard are not
  // expanded, so remove any "\" left before "$" – the hash works written either way.
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim().replace(/\\\$/g, "$");
  if (hash) return verifyPassword(password, hash);

  const plain = process.env.ADMIN_PASSWORD ?? "";
  if (!plain || (process.env.NODE_ENV === "production" && plain.length < 12)) return "not-configured";
  // Compare fixed-length digests so the check takes the same time whatever was typed.
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(plain).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function loginAdminAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  try {
    assertAdminSessionConfigured();
  } catch {
    return { error: "Admin sign-in is not set up on this server: AUTH_SECRET is missing from .env." };
  }
  const allowed = adminEmails();
  if (allowed.length === 0) return { error: NOT_CONFIGURED };

  // Slow down password guessing: 5 tries per email and 20 per IP address every 15 minutes.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (tooManyAttempts(`admin:email:${email}`, 5) || tooManyAttempts(`admin:ip:${ip}`, 20)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  // Same message for an unknown email or a wrong password, so admin emails can't be discovered.
  if (!allowed.includes(email)) {
    await verifyAgainstDummy(password);
    return { error: WRONG };
  }
  const ok = await checkAdminPassword(password);
  if (ok === "not-configured") return { error: NOT_CONFIGURED };
  if (!ok) return { error: WRONG };

  clearAttempts(`admin:email:${email}`);
  await createAdminSession(email);
  redirect("/admin");
}

export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
