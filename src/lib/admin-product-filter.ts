// One definition of the admin products filter, used by the products list, the
// "apply to all filtered products" bulk actions and the CSV export, so they always
// act on exactly the products the admin is looking at.
import type { Prisma } from "@/generated/prisma/client";
import { lowStockWhere, needsRestockWhere } from "@/lib/inventory";

export const PRODUCT_STATUS_FILTERS = [
  "all",
  "active",
  "inactive",
  "out-of-stock",
  "in-stock",
  "low-stock",
  "needs-restock",
] as const;
export type ProductStatusFilter = (typeof PRODUCT_STATUS_FILTERS)[number];

export interface AdminProductFilter {
  q?: string;
  brand?: string;
  category?: string;
  status?: ProductStatusFilter | string;
}

export function adminProductWhere(filter: AdminProductFilter = {}): Prisma.ProductWhereInput {
  const { brand, category, status = "all" } = filter;
  const q = filter.q?.trim();
  return {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { partNumbers: { some: { code: { contains: q, mode: "insensitive" } } } },
            { compatibleWith: { some: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(brand ? { brand: { slug: brand } } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(status === "out-of-stock" ? { stock: { lte: 0 } } : {}),
    ...(status === "in-stock" ? { stock: { gt: 0 } } : {}),
    ...(status === "low-stock" ? lowStockWhere : {}),
    ...(status === "needs-restock" ? needsRestockWhere : {}),
  };
}
