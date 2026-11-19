import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(2, "Product title must be at least 2 characters"),
  slug: z.string().optional().default(""),
  description: z.string().optional().default(""),
  brandId: z.string().min(1, "Please select a brand"),
  categoryId: z.string().min(1, "Please select a category"),
  mrp: z.number().min(0, "MRP cannot be negative"), // in ₹
  price: z.number().min(0, "Selling price cannot be negative"), // in ₹
  hsnCode: z.string().optional().default(""),
  gstRate: z.number().default(18),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  isOriginal: z.boolean().default(false),
  isActive: z.boolean().default(true),
  partNumbers: z.array(z.string()).default([]),
  compatibleWith: z.array(z.string()).default([]),
  images: z
    .array(
      z.object({
        url: z.string().url("Must be a valid URL"),
        alt: z.string().optional(),
      })
    )
    .default([]),
  specs: z.record(z.string(), z.string()).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export function generateSlug(text: string): string {
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars
    .replace(/[\s_-]+/g, "-") // replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, ""); // trim leading and trailing hyphens

  return cleaned || "product";
}
