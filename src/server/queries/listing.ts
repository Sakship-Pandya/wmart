import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Product listing for the shop, category, brand and search pages:
// filters (category, brand, price), sorting, products per page and pagination –
// the same options as the old wmart.co.in shop pages. Everything is done in the database.

export const SORTS = {
  default: "Default sorting",
  latest: "Sort by latest",
  "price-asc": "Sort by price: low to high",
  "price-desc": "Sort by price: high to low",
  discount: "Sort by biggest discount",
} as const;
export type SortKey = keyof typeof SORTS;

export const PER_PAGE_OPTIONS = [9, 12, 18, 24] as const;
export const DEFAULT_PER_PAGE = 12;

/** Options read from the URL, e.g. ?brand=dell&brand=hp&min=500&max=3000&sort=price-asc&page=2 */
export type ListingParams = {
  /** Fixed by the page (e.g. the category of /c/laptop-batteries) – not changeable by filters. */
  scope: { categorySlug?: string; brandSlug?: string; q?: string };
  categories: string[];
  brands: string[];
  min?: number; // rupees
  max?: number; // rupees
  inStock: boolean;
  sort: SortKey;
  perPage: number;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean).slice(0, 20);
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

export function parseListingParams(sp: SearchParams, scope: ListingParams["scope"]): ListingParams {
  const sortRaw = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  const perPage = num(sp.per_page);
  return {
    scope,
    categories: scope.categorySlug ? [] : list(sp.category),
    brands: scope.brandSlug ? [] : list(sp.brand),
    min: num(sp.min),
    max: num(sp.max),
    inStock: sp.in_stock === "1",
    sort: sortRaw && sortRaw in SORTS ? (sortRaw as SortKey) : "default",
    perPage: perPage && (PER_PAGE_OPTIONS as readonly number[]).includes(perPage) ? perPage : DEFAULT_PER_PAGE,
    page: Math.max(1, num(sp.page) ?? 1),
  };
}

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
} as const satisfies Prisma.ProductSelect;

/** The fixed part of the page (category / brand / search words). Facet counts use only this. */
function scopeWhere(scope: ListingParams["scope"]): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (scope.categorySlug) where.category = { slug: scope.categorySlug };
  if (scope.brandSlug) where.brand = { slug: scope.brandSlug };
  const q = scope.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { partNumbers: { some: { code: { contains: q, mode: "insensitive" } } } },
      { compatibleWith: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  return where;
}

function filterWhere(p: ListingParams): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [scopeWhere(p.scope)];
  if (p.categories.length) and.push({ category: { slug: { in: p.categories } } });
  if (p.brands.length) and.push({ brand: { slug: { in: p.brands } } });
  if (p.min !== undefined || p.max !== undefined) {
    and.push({ price: { ...(p.min !== undefined && { gte: p.min * 100 }), ...(p.max !== undefined && { lte: p.max * 100 }) } });
  }
  if (p.inStock) and.push({ stock: { gt: 0 } });
  return { AND: and };
}

function orderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "latest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    default:
      // In stock first, then newest.
      return [{ stock: "desc" }, { createdAt: "desc" }];
  }
}

export type ListingResult = Awaited<ReturnType<typeof getListing>>;
export type ListingProduct = ListingResult["items"][number];

export async function getListing(p: ListingParams) {
  await connection();
  const where = filterWhere(p);
  const base = scopeWhere(p.scope);

  const [total, priceRange, categoryFacets, brandFacets] = await Promise.all([
    db.product.count({ where }),
    db.product.aggregate({ where: base, _min: { price: true }, _max: { price: true } }),
    p.scope.categorySlug
      ? Promise.resolve([])
      : db.category.findMany({
          where: { products: { some: base } },
          select: { name: true, slug: true, _count: { select: { products: { where: base } } } },
          orderBy: { name: "asc" },
        }),
    p.scope.brandSlug
      ? Promise.resolve([])
      : db.brand.findMany({
          where: { products: { some: base } },
          select: { name: true, slug: true, _count: { select: { products: { where: base } } } },
          orderBy: { name: "asc" },
        }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / p.perPage));
  const page = Math.min(p.page, pageCount);

  let items;
  if (p.sort === "discount") {
    // Discount = (mrp - price) / mrp, which Prisma can't sort by directly:
    // fetch the matching ids with their prices, sort in memory, then load just this page.
    const all = await db.product.findMany({ where, select: { id: true, mrp: true, price: true } });
    const pct = (r: { mrp: number; price: number }) => (r.mrp > r.price ? (r.mrp - r.price) / r.mrp : 0);
    const ids = all
      .sort((a, b) => pct(b) - pct(a))
      .slice((page - 1) * p.perPage, page * p.perPage)
      .map((r) => r.id);
    const rows = await db.product.findMany({ where: { id: { in: ids } }, select: cardSelect });
    items = ids.map((id) => rows.find((r) => r.id === id)!).filter(Boolean);
  } else {
    items = await db.product.findMany({
      where,
      select: cardSelect,
      orderBy: orderBy(p.sort),
      skip: (page - 1) * p.perPage,
      take: p.perPage,
    });
  }

  return {
    items,
    total,
    page,
    pageCount,
    perPage: p.perPage,
    priceBounds: {
      min: Math.floor((priceRange._min.price ?? 0) / 100),
      max: Math.ceil((priceRange._max.price ?? 0) / 100),
    },
    facets: {
      categories: categoryFacets.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products })),
      brands: brandFacets.map((b) => ({ name: b.name, slug: b.slug, count: b._count.products })),
    },
  };
}
