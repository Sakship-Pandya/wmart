import { connection } from "next/server";
import { db } from "@/lib/db";

// Read-only product queries used by the store pages (owned by the store-UI developer).
// Writes (create/update/delete) live in src/server/actions/admin/ (admin developer).

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  mrp: true,
  price: true,
  stock: true,
  isOriginal: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
} as const;

export type ProductCardData = Awaited<ReturnType<typeof listProductsByCategory>>[number];

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { position: "asc" } },
      partNumbers: true,
      compatibleWith: true,
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function getBrandBySlug(slug: string) {
  return db.brand.findUnique({ where: { slug } });
}

export async function listProductsByCategory(categorySlug: string, take = 24) {
  return db.product.findMany({
    where: { category: { slug: categorySlug }, isActive: true },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listProductsByBrand(brandSlug: string, take = 24) {
  return db.product.findMany({
    where: { brand: { slug: brandSlug }, isActive: true },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
}

/**
 * Categories / brands that actually have products, with how many – used for the home page
 * and the header menu, so they always match whatever the admin import created.
 * connection() makes these run on each request instead of being frozen at build time.
 */
export async function listCategoriesWithProducts(take = 12) {
  await connection();
  const rows = await db.category.findMany({
    where: { products: { some: { isActive: true } } },
    select: { name: true, slug: true, _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { products: { _count: "desc" } },
    take,
  });
  return rows.map((r) => ({ name: r.name, slug: r.slug, count: r._count.products }));
}

export async function listBrandsWithProducts(take = 16) {
  await connection();
  const rows = await db.brand.findMany({
    where: { products: { some: { isActive: true } } },
    select: { name: true, slug: true, _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { products: { _count: "desc" } },
    take,
  });
  return rows.map((r) => ({ name: r.name, slug: r.slug, count: r._count.products }));
}

export async function listLatestProducts(take = 8) {
  await connection();
  return db.product.findMany({
    where: { isActive: true },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Search by title, part number ("HS04", "MR90Y") or laptop model ("Inspiron 3521"). */
export async function searchProducts(query: string, take = 48) {
  const q = query.trim();
  if (!q) return [];
  return db.product.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { partNumbers: { some: { code: { contains: q, mode: "insensitive" } } } },
        { compatibleWith: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    },
    select: cardSelect,
    take,
  });
}
