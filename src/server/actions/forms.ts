"use server";

import { redirect } from "next/navigation";
import {
  accountDetailsSchema,
  addressSchema,
  contactSchema,
  orderLookupSchema,
  type FormState,
} from "@/lib/validation/forms";
import { fieldErrorsFrom, text } from "@/lib/validation/errors";
import { db } from "@/lib/db";
import { createCustomerSession, getCurrentCustomer } from "@/lib/customer-session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";

// Server actions for the contact form, order lookup, account details and saved addresses.
// Contact emails and order lookup are still TODOs.

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  // Hidden anti-spam field: people never see it, bots fill it in.
  if (text(formData, "website") !== "") return { status: "success", message: "Thanks! We'll get back to you soon." };

  const values = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    message: text(formData, "message"),
  };
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  // TODO: email the message to support@wmart.co.in (e.g. with Resend) and send the customer a copy.
  return {
    status: "error",
    message: "Sending messages isn't connected yet. Please contact us on WhatsApp or by phone for now.",
    values,
  };
}

export async function lookupOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { orderNumber: text(formData, "orderNumber"), contact: text(formData, "contact") };
  const parsed = orderLookupSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  // TODO: find the order by number + email/phone and show its status and Delhivery AWB.
  return {
    status: "error",
    message: "Order lookup isn't connected yet. If you have your Delhivery tracking number (AWB), use the box above.",
    values,
  };
}

export async function updateAccountDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    displayName: text(formData, "displayName"),
    email: text(formData, "email"),
  };
  const parsed = accountDetailsSchema.safeParse({
    ...values,
    currentPassword: text(formData, "currentPassword"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const session = await getCurrentCustomer();
  if (!session) return { status: "error", message: "Your session has ended. Please log in again.", values };
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const current = await db.customer.findUnique({ where: { id: session.id }, select: { email: true, passwordHash: true } });
  if (!current) return { status: "error", message: "Your session has ended. Please log in again.", values };

  // Changing the email or the password needs the current password (protects a device left logged in).
  const changingPassword = data.newPassword !== "";
  const changingEmail = email !== current.email;
  if (changingPassword || changingEmail) {
    if (!data.currentPassword) {
      return { status: "error", fieldErrors: { currentPassword: ["Enter your current password to change your email or password."] }, values };
    }
    if (tooManyAttempts(`details:${session.id}`, 10)) {
      return { status: "error", message: "Too many attempts. Please wait 15 minutes and try again.", values };
    }
    if (!current.passwordHash || !(await verifyPassword(data.currentPassword, current.passwordHash))) {
      return { status: "error", fieldErrors: { currentPassword: ["Your current password is incorrect."] }, values };
    }
  }
  if (changingEmail && (await db.customer.findUnique({ where: { email }, select: { id: true } }))) {
    return { status: "error", fieldErrors: { email: ["Another account already uses this email address."] }, values };
  }

  const updated = await db.customer.update({
    where: { id: session.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName,
      email,
      ...(changingPassword ? { passwordHash: await hashPassword(data.newPassword) } : {}),
    },
    select: { id: true, passwordHash: true },
  });
  // A new password signs out every other device; keep this one signed in.
  if (changingPassword) await createCustomerSession(updated, true);

  return {
    status: "success",
    message: changingPassword ? "Account details and password changed successfully." : "Account details changed successfully.",
    values: { ...values, email },
  };
}

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const type = text(formData, "type") === "billing" ? "BILLING" : "SHIPPING";
  const prefix = type === "BILLING" ? "billing" : "shipping";
  const fields = ["fullName", "phone", "line1", "line2", "city", "state", "pincode"] as const;
  const values = Object.fromEntries(fields.map((f) => [`${prefix}.${f}`, text(formData, `${prefix}.${f}`)]));
  const parsed = addressSchema.safeParse(Object.fromEntries(fields.map((f) => [f, text(formData, `${prefix}.${f}`)])));
  if (!parsed.success) {
    const errors = Object.fromEntries(Object.entries(fieldErrorsFrom(parsed.error)).map(([k, v]) => [`${prefix}.${k}`, v]));
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: errors, values };
  }

  const session = await getCurrentCustomer();
  if (!session) return { status: "error", message: "Your session has ended. Please log in again.", values };
  const data = { ...parsed.data, line2: parsed.data.line2 || null };
  await db.address.upsert({
    where: { customerId_type: { customerId: session.id, type } },
    create: { customerId: session.id, type, ...data },
    update: data,
  });
  redirect("/account/addresses?saved=1");
}
