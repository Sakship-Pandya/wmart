import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export interface AdminProductListParams {
  q?: string;
  brand?: string;
  category?: string;
  status?: "all" | "active" | "inactive" | "out-of-stock" | "in-stock";
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

  const trimmedQuery = q?.trim();

  const where: Prisma.ProductWhereInput = {
    ...(trimmedQuery
      ? {
          OR: [
            { title: { contains: trimmedQuery, mode: "insensitive" } },
            { slug: { contains: trimmedQuery, mode: "insensitive" } },
            { partNumbers: { some: { code: { contains: trimmedQuery, mode: "insensitive" } } } },
            { compatibleWith: { some: { name: { contains: trimmedQuery, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(brand ? { brand: { slug: brand } } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(status === "out-of-stock" ? { stock: { lte: 0 } } : {}),
    ...(status === "in-stock" ? { stock: { gt: 0 } } : {}),
  };

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

  const [brands, categories, totalCount, activeCount, outOfStockCount] = await Promise.all([
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
    db.product.count({ where: { stock: { lte: 0 } } }),
  ]);

  return {
    brands,
    categories,
    stats: {
      total: totalCount,
      active: activeCount,
      outOfStock: outOfStockCount,
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
    totalBrands,
    totalCategories,
    recentProducts,
    lowStockProducts,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { stock: { lte: 0 } } }),
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
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 5,
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
      totalBrands,
      totalCategories,
    },
    recentProducts,
    lowStockProducts,
  };
}



