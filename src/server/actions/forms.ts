"use server";

import {
  accountDetailsSchema,
  contactSchema,
  orderLookupSchema,
  type FormState,
} from "@/lib/validation/forms";
import { fieldErrorsFrom, text } from "@/lib/validation/errors";

// Server actions for the contact form, order lookup and account details.
// Each one validates the input; the parts that need email sending or customer/order tables are TODOs.

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

  // TODO: requires customer login – update the signed-in customer, checking currentPassword before changing it.
  return { status: "error", message: "Customer accounts are not connected yet, so changes can't be saved.", values };
}
