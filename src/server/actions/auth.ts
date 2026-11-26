"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "@/lib/password";
import { assertSessionConfigured, createCustomerSession, destroyCustomerSession, safeNext, TAB_COOKIE } from "@/lib/customer-session";
import { clearAttempts, tooManyAttempts } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type AuthFormState,
} from "@/lib/validation/auth";
import { emailConfigured, sendEmail } from "@/lib/email";
import { passwordReset } from "@/lib/email-templates";
import { createResetToken, customerForResetToken, RESET_VALID_MINUTES } from "@/lib/password-reset";
import { siteUrl } from "@/lib/site-url";

// Customer login / register / logout / lost password.

const WRONG_LOGIN = "Incorrect email address or password.";

/**
 * Signing in or out changes what every page shows (header, My account, checkout). Drop the
 * browser's cached pages so nothing fetched before the change is reused – e.g. a "My account"
 * link prefetched while signed out, which would still send the customer to the login page.
 */
function forgetCachedPages() {
  revalidatePath("/", "layout");
}

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
  forgetCachedPages();
  redirect(safeNext(formData.get("next"), "/"));
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
  forgetCachedPages();
  redirect(safeNext(formData.get("next"), "/"));
}

/**
 * Called by TabSessionGuard when a page opens with a "this tab only" login and no other WMart tab
 * answers – i.e. the customer closed every tab without ticking "Remember me".
 */
export async function endTabSession(): Promise<void> {
  if (!(await cookies()).get(TAB_COOKIE)) return; // only "this tab only" logins end this way
  await destroyCustomerSession();
  forgetCachedPages();
}

export async function logout(): Promise<void> {
  await destroyCustomerSession();
  forgetCachedPages();
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
  const email = parsed.data.email;
  // 3 links per email and 10 per connection every 15 minutes – stops the form being used to spam inboxes.
  const limited = tooManyAttempts(`reset:email:${email}`, 3) || tooManyAttempts(`reset:ip:${await clientIp()}`, 10);
  if (!limited) {
    const customer = await db.customer.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, firstName: true, displayName: true },
    });
    if (customer) {
      const url = `${await siteUrl()}/reset-password?token=${encodeURIComponent(createResetToken(customer))}`;
      const name = customer.displayName || customer.firstName || customer.email.split("@")[0];
      await sendEmail(passwordReset(name, customer.email, url, RESET_VALID_MINUTES));
    }
  }
  // Always the same answer, so nobody can find out which emails have accounts.
  return {
    status: "success",
    message: emailConfigured()
      ? "If an account matches this email, we've sent you a link to reset your password. Check your inbox (and spam folder)."
      : "If an account matches this email, we'll send you a link to reset your password. (Reset emails are not connected yet – contact us on WhatsApp if you're locked out.)",
  };
}

/** Sets a new password from a reset link, then signs the customer in. */
export async function resetPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  assertSessionConfigured();
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token") ?? "",
    password: formData.get("password") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const customer = await customerForResetToken(parsed.data.token);
  if (!customer) {
    return { status: "error", message: "This reset link has expired or was already used. Please ask for a new one." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await db.customer.update({ where: { id: customer.id }, data: { passwordHash } });
  // The new password hash also signs out every other device and makes this link unusable.
  await createCustomerSession({ id: customer.id, passwordHash }, false);
  forgetCachedPages();
  redirect("/account");
}
