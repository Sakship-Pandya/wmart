import { z } from "zod";

// Validation rules for the store's non-login forms (contact, order lookup, account details, checkout).
// Shared by the client forms and the server actions.

export { type AuthFormState as FormState, initialAuthState as initialFormState } from "./auth";

/** 10-digit Indian mobile number, optionally written with +91 / 0 / spaces. */
export const indianMobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."));

export const pincode = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode.");

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email address.").trim(),
  phone: z.union([z.literal(""), indianMobile]),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(2000),
});

export const orderLookupSchema = z.object({
  orderNumber: z.string().trim().min(3, "Enter your order number."),
  contact: z.string().trim().min(5, "Enter the email or mobile number used for the order."),
});

export const accountDetailsSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name."),
    lastName: z.string().trim().min(1, "Enter your last name."),
    displayName: z.string().trim().min(1, "Enter a display name."),
    email: z.email("Enter a valid email address.").trim(),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    const changing = v.newPassword !== "" || v.confirmPassword !== "";
    if (!changing) return;
    if (v.currentPassword === "")
      ctx.addIssue({ code: "custom", path: ["currentPassword"], message: "Enter your current password." });
    if (v.newPassword.length < 8)
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Use at least 8 characters." });
    if (v.newPassword !== v.confirmPassword)
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  });

export const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
] as const;

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the full name."),
  phone: indianMobile,
  line1: z.string().trim().min(3, "Enter the house number and street."),
  line2: z.string().trim().max(200),
  city: z.string().trim().min(2, "Enter the town or city."),
  state: z.enum(indianStates, "Choose a state."),
  pincode,
});

export const checkoutSchema = z
  .object({
    email: z.email("Enter a valid email address.").trim(),
    shipping: addressSchema,
    billingSameAsShipping: z.boolean(),
    billing: addressSchema.partial(),
    notes: z.string().trim().max(500),
    paymentMethod: z.enum(["payu", "cod"], "Choose a payment method."),
  })
  .superRefine((v, ctx) => {
    if (v.billingSameAsShipping) return;
    const parsed = addressSchema.safeParse(v.billing);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ code: "custom", path: ["billing", ...issue.path], message: issue.message });
      }
    }
  });
