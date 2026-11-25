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
import { headers } from "next/headers";
import { grantOrderAccess } from "@/lib/order-access";
import { parseOrderNumber } from "@/lib/orders";
import { sendEmail, supportEmail } from "@/lib/email";
import { contactCopy, contactToSupport } from "@/lib/email-templates";

// Server actions for the contact form, order lookup, account details and saved addresses.
// Contact messages are emailed through Resend (lib/email.ts) when it is configured.

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

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (tooManyAttempts(`contact:ip:${ip}`, 5, 60 * 60 * 1000)) {
    return { status: "error", message: "You've sent several messages already. Please wait a while, or reach us on WhatsApp.", values };
  }
  const message = parsed.data;
  const result = await sendEmail(contactToSupport(message, supportEmail()));
  if (!result.sent) {
    return {
      status: "error",
      message:
        result.reason === "not-configured"
          ? "Sending messages isn't connected yet. Please contact us on WhatsApp or by phone for now."
          : "Sorry, your message couldn't be sent just now. Please try again, or reach us on WhatsApp.",
      values,
    };
  }
  await sendEmail(contactCopy(message)); // the customer's copy is a nice-to-have; ignore failures
  return { status: "success", message: "Thanks! Your message has been sent – we'll reply within one working day." };
}

export async function lookupOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { orderNumber: text(formData, "orderNumber"), contact: text(formData, "contact") };
  const parsed = orderLookupSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  // Slow down guessing: 10 tries per order number and 30 per IP address every 15 minutes.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const number = parseOrderNumber(parsed.data.orderNumber);
  if (tooManyAttempts(`lookup:order:${number ?? parsed.data.orderNumber}`, 10) || tooManyAttempts(`lookup:ip:${ip}`, 30)) {
    return { status: "error", message: "Too many attempts. Please wait 15 minutes and try again.", values };
  }

  // The order number alone is not enough: the email or mobile used for the order must match.
  // Same message whether the number or the contact is wrong, so orders can't be probed.
  const notFound: FormState = {
    status: "error",
    message: "We couldn't find an order with that number and email / mobile. Please check both and try again.",
    values,
  };
  if (number === null) return notFound;
  const order = await db.order.findUnique({ where: { orderNumber: number }, select: { id: true, email: true, phone: true } });
  if (!order) return notFound;

  const contact = parsed.data.contact.trim();
  const digits = contact.replace(/\D/g, "").slice(-10);
  const matches = contact.includes("@")
    ? contact.toLowerCase() === order.email.toLowerCase()
    : digits.length === 10 && digits === order.phone.replace(/\D/g, "").slice(-10);
  if (!matches) return notFound;

  await grantOrderAccess(order.id);
  redirect(`/order/${order.id}`);
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
