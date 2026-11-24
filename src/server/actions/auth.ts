"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "@/lib/password";
import { assertSessionConfigured, createCustomerSession, destroyCustomerSession, safeNext } from "@/lib/customer-session";
import { clearAttempts, tooManyAttempts } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

// Customer login / register / logout / lost password.

const WRONG_LOGIN = "Incorrect email address or password.";

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  assertSessionConfigured();
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    rememberMe: formData.get("rememberMe") === "on",
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { email, password, rememberMe } = parsed.data;

  // Slow down password guessing: max 10 tries per email and 30 per IP address every 15 minutes.
  const ip = await clientIp();
  if (tooManyAttempts(`login:email:${email}`) || tooManyAttempts(`login:ip:${ip}`, 30)) {
    return { status: "error", message: "Too many attempts. Please wait 15 minutes and try again.", values };
  }

  const customer = await db.customer.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  const ok = customer?.passwordHash ? await verifyPassword(password, customer.passwordHash) : await verifyAgainstDummy(password);
  if (!customer || !ok) return { status: "error", message: WRONG_LOGIN, values };

  clearAttempts(`login:email:${email}`);
  await createCustomerSession(customer, rememberMe);
  redirect(safeNext(formData.get("next")));
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  assertSessionConfigured(); // fail before creating an account that could not be signed in
  // Hidden "anti-spam" field (same trick as the old site): people never see it, bots fill it in.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: "Thanks! Check your email to continue." };
  }
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = registerSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { email, password } = parsed.data;

  if (tooManyAttempts(`register:ip:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { status: "error", message: "Too many new accounts from this connection. Please try again later.", values };
  }

  // An email that already has orders (guest checkout) or an account can't be taken over by
  // registering again – there is no email verification yet, so we can't prove it's the same person.
  const existing = await db.customer.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      status: "error",
      fieldErrors: { email: ["An account already exists for this email address. Please log in instead."] },
      values,
    };
  }

  const customer = await db.customer.create({
    data: { email, passwordHash: await hashPassword(password), displayName: email.split("@")[0] },
    select: { id: true, passwordHash: true },
  });
  await createCustomerSession(customer, true);
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroyCustomerSession();
  redirect("/");
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { email: String(formData.get("email") ?? "") },
    };
  }
  // TODO: email a one-time reset link (needs an email service and a reset-token table).
  // Always the same answer, so nobody can find out which emails have accounts.
  return {
    status: "success",
    message:
      "If an account matches this email, we'll send you a link to reset your password. (Reset emails are not connected yet – contact us on WhatsApp if you're locked out.)",
  };
}
