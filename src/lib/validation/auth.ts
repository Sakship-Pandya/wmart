import { z } from "zod";

// Customer login / register rules – shared by the forms and the server actions.

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username or email address."),
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean(),
});

export const registerSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128, "Use 128 characters or fewer."),
});

export const forgotPasswordSchema = z.object({
  username: z.string().trim().min(1, "Enter your username or email address."),
});

/** What a form shows after it is submitted. Passwords are never sent back. */
export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  /** Values to put back in the form after an error (never the password). */
  values?: Record<string, string>;
};

export const initialAuthState: AuthFormState = { status: "idle" };
