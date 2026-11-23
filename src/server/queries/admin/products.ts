import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import { LOW_STOCK_THRESHOLD, lowStockWhere, needsRestockWhere, outOfStockWhere } from "@/lib/inventory";
import { adminProductWhere, type ProductStatusFilter } from "@/lib/admin-product-filter";

export interface AdminProductListParams {
  q?: string;
  brand?: string;
  category?: string;
  status?: ProductStatusFilter;
  sort?: "newest" | "oldest" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc" | "title-asc";
  page?: number;
  pageSize?: number;
}

export async function getAdminProducts(params: AdminProductListParams = {}) {
  await requireAdmin();

  const {
    q,
    brand,
    category,
    status = "all",
    sort = "newest",
    page = 1,
    pageSize = 15,
  } = params;

  const where = adminProductWhere({ q, brand, category, status });

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "stock-asc":
      orderBy = { stock: "asc" };
      break;
    case "stock-desc":
      orderBy = { stock: "desc" };
      break;
    case "title-asc":
      orderBy = { title: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [totalCount, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: {
          select: { id: true, url: true, alt: true },
          orderBy: { position: "asc" },
          take: 1,
        },
        partNumbers: { select: { id: true, code: true } },
        _count: { select: { compatibleWith: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    products,
    totalCount,
    totalPages,
    currentPage: safePage,
    pageSize,
  };
}

export async function getAdminProductFilterOptions() {
  await requireAdmin();

  const [brands, categories, totalCount, activeCount, outOfStockCount, lowStockCount] = await Promise.all([
    db.brand.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: outOfStockWhere }),
    db.product.count({ where: lowStockWhere }),
  ]);

  return {
    brands,
    categories,
    stats: {
      total: totalCount,
      active: activeCount,
      outOfStock: outOfStockCount,
      lowStock: lowStockCount,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    },
  };
}

export async function getAdminProductById(id: string) {
  await requireAdmin();

  return db.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { position: "asc" } },
      partNumbers: { orderBy: { code: "asc" } },
      compatibleWith: { orderBy: { name: "asc" } },
    },
  });
}

export async function getAdminDashboardSummary() {
  await requireAdmin();

  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockCount,
    totalBrands,
    totalCategories,
    recentProducts,
    lowStockProducts,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: outOfStockWhere }),
    db.product.count({ where: lowStockWhere }),
    db.brand.count(),
    db.category.count(),
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    db.product.findMany({
      where: needsRestockWhere,
      orderBy: [{ stock: "asc" }, { title: "asc" }],
      take: 8,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  return {
    metrics: {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockCount,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      totalBrands,
      totalCategories,
    },
    recentProducts,
    lowStockProducts,
  };
}



