import { connection } from "next/server";
import { db } from "@/lib/db";

// Read-only product queries used by the store pages (owned by the store-UI developer).
// Writes (create/update/delete) live in src/server/actions/admin/ (admin developer).
// The shop / category / brand / search lists live in ./listing.ts.
// connection() makes a query run on each request instead of being frozen at build time.

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  mrp: true,
  price: true,
  stock: true,
  isOriginal: true,
  description: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
} as const;

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { position: "asc" } },
      partNumbers: { orderBy: { code: "asc" } },
      compatibleWith: { orderBy: { name: "asc" } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function getBrandBySlug(slug: string) {
  return db.brand.findUnique({ where: { slug } });
}

/** "You may also like": other products from the same category, same brand first. */
export async function listRelatedProducts(product: { id: string; categoryId: string; brandId: string }, take = 8) {
  const rows = await db.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    select: { ...cardSelect, brandId: true },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take: take * 3,
  });
  return rows.sort((a, b) => Number(b.brandId === product.brandId) - Number(a.brandId === product.brandId)).slice(0, take);
}

/**
 * Categories / brands that actually have products, with how many – used for the home page
 * and the header menu, so they always match whatever the admin import created.
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

/** Biggest discounts (MRP vs price) – the home page "On sale" tab. Empty when nothing is discounted. */
export async function listBestDeals(take = 8) {
  await connection();
  const rows = await db.product.findMany({ where: { isActive: true, stock: { gt: 0 } }, select: { id: true, mrp: true, price: true } });
  const ids = rows
    .filter((r) => r.mrp > r.price)
    .sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp)
    .slice(0, take)
    .map((r) => r.id);
  if (ids.length === 0) return [];
  const items = await db.product.findMany({ where: { id: { in: ids } }, select: cardSelect });
  return ids.map((id) => items.find((p) => p.id === id)!).filter(Boolean);
}

export type HeroDealSlide = {
  category: { name: string; slug: string };
  maxDiscount: number; // percent
  onSale: number; // in-stock products with a discount
  fromPrice: number; // paise, cheapest in-stock product in the category
  brands: string[]; // brands with discounted products, most first
  product: { title: string; slug: string; price: number; mrp: number; image: string | null };
};

/**
 * Home page carousel: one slide per category that has discounted, in-stock products,
 * with its biggest real discount (MRP vs price) and that product. Coupons are not used
 * here because they can't be applied at checkout yet.
 */
export async function listHeroDealSlides(take = 4): Promise<HeroDealSlide[]> {
  await connection();
  const rows = await db.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    select: {
      title: true,
      slug: true,
      price: true,
      mrp: true,
      brand: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });

  const pct = (p: { mrp: number; price: number }) => (p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0);
  const byCategory = new Map<string, typeof rows>();
  for (const r of rows) byCategory.set(r.category.slug, [...(byCategory.get(r.category.slug) ?? []), r]);

  const slides: HeroDealSlide[] = [];
  for (const items of byCategory.values()) {
    const discounted = items.filter((p) => p.mrp > p.price);
    if (discounted.length === 0) continue;
    // Best deal with a photo if possible, otherwise the best deal.
    const sorted = [...discounted].sort((a, b) => pct(b) - pct(a));
    const best = sorted.find((p) => p.images[0]) ?? sorted[0];
    const brandCounts = new Map<string, number>();
    for (const p of discounted) brandCounts.set(p.brand.name, (brandCounts.get(p.brand.name) ?? 0) + 1);
    slides.push({
      category: items[0].category,
      maxDiscount: Math.floor(pct(sorted[0]) * 100),
      onSale: discounted.length,
      fromPrice: Math.min(...items.map((p) => p.price)),
      brands: [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n),
      product: { title: best.title, slug: best.slug, price: best.price, mrp: best.mrp, image: best.images[0]?.url ?? null },
    });
  }
  // Categories with the most products on sale first.
  return slides.sort((a, b) => b.onSale - a.onSale).slice(0, take);
}

/** Top products of one category – used for the home page category rows. */
export async function listProductsInCategory(categorySlug: string, take = 8) {
  await connection();
  return db.product.findMany({
    where: { isActive: true, category: { slug: categorySlug } },
    select: cardSelect,
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/** Live search suggestions in the header (title, part number or laptop model). */
export async function quickSearch(query: string, take = 6) {
  const q = query.trim();
  if (q.length < 2) return [];
  return db.product.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { partNumbers: { some: { code: { contains: q, mode: "insensitive" } } } },
        { compatibleWith: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    },
    select: { slug: true, title: true, price: true, brand: { select: { name: true } }, images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 } },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take,
  });
}
