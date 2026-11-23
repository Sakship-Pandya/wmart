// Stock alert rules shared by the dashboard, products list, sidebar badge and CSV export.
import type { Prisma } from "@/generated/prisma/client";

/** A product with this many units or fewer (but more than 0) is "low stock". Set LOW_STOCK_THRESHOLD in .env to change it. */
export const LOW_STOCK_THRESHOLD = (() => {
  const n = Number.parseInt(process.env.LOW_STOCK_THRESHOLD ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 5;
})();

/** Active products that are running low (1 to LOW_STOCK_THRESHOLD units). Hidden products are ignored. */
export const lowStockWhere: Prisma.ProductWhereInput = {
  isActive: true,
  stock: { gt: 0, lte: LOW_STOCK_THRESHOLD },
};

/** Active products customers can't buy right now. */
export const outOfStockWhere: Prisma.ProductWhereInput = {
  isActive: true,
  stock: { lte: 0 },
};

/** Low stock or out of stock: everything that needs restocking. */
export const needsRestockWhere: Prisma.ProductWhereInput = {
  isActive: true,
  stock: { lte: LOW_STOCK_THRESHOLD },
};
