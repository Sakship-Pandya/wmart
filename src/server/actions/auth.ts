"use server";

import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

// Customer login / register / lost password.
// The forms and checks are done; the account storage is not yet:
// TODO (needs a Customer table + sessions in the schema):
// - login: look up the customer by username or email, compare the password hash
//   (e.g. argon2/bcrypt), create a session cookie (30 days when "Remember me" is ticked),
//   then redirect("/account").
// - register: refuse duplicate emails, hash the password, create the customer, sign in.
// - forgot password: email a one-time reset link; always show the same message
//   so nobody can find out which emails have accounts.

const NOT_CONNECTED =
  "Customer accounts are not connected yet, so you can't sign in on the new site for now.";

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username") ?? "",
    password: formData.get("password") ?? "",
    rememberMe: formData.get("rememberMe") === "on",
  });
  const values = { username: String(formData.get("username") ?? "") };
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  return { status: "error", message: NOT_CONNECTED, values };
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  // Hidden "anti-spam" field (same trick as the old site): people never see it, bots fill it in.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: "Thanks! Check your email to continue." };
  }
  const parsed = registerSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  return { status: "error", message: NOT_CONNECTED, values };
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ username: formData.get("username") ?? "" });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { username: String(formData.get("username") ?? "") },
    };
  }
  // Same answer whether or not the account exists.
  return {
    status: "success",
    message:
      "If an account matches what you entered, we'll email you a link to reset your password. (Emails are not connected yet.)",
  };
}
