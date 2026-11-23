import { z } from "zod";

// Coupon form values. Money fields are in ₹ in the form and converted to paise in the server action.
export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(30, "Code must be at most 30 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, - and _")
      .transform((s) => s.toUpperCase()),
    type: z.enum(["PERCENT", "FLAT"]),
    value: z.number().positive("Discount must be more than 0"), // percent, or ₹ for FLAT
    minOrderValue: z.number().min(0).nullable(), // ₹
    maxDiscount: z.number().min(0).nullable(), // ₹, PERCENT only
    startsAt: z.date().nullable(),
    expiresAt: z.date().nullable(),
    usageLimit: z.number().int().min(1).nullable(),
    perCustomerLimit: z.number().int().min(1).nullable(),
    isActive: z.boolean(),
  })
  .refine((c) => c.type !== "PERCENT" || (c.value >= 1 && c.value <= 100 && Number.isInteger(c.value)), {
    message: "Percentage must be a whole number from 1 to 100",
    path: ["value"],
  })
  .refine((c) => !c.startsAt || !c.expiresAt || c.expiresAt > c.startsAt, {
    message: "Expiry must be after the start date",
    path: ["expiresAt"],
  });

export type CouponFormValues = z.input<typeof couponSchema>;
