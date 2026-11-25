import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";
import { policies } from "@/content/policies";

// sitemap.xml – every public page search engines should index: the main pages, policies,
// and every category, brand and active product that has products.
// Read from the database on request (connection()), so newly imported products show up
// without a redeploy. A single sitemap holds up to 50,000 URLs; if the catalogue ever grows
// past that, split it with generateSitemaps().
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const active = { isActive: true };

  const [products, categories, brands] = await Promise.all([
    db.product.findMany({ where: active, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    db.category.findMany({ where: { products: { some: active } }, select: { slug: true } }),
    db.brand.findMany({ where: { products: { some: active } }, select: { slug: true } }),
  ]);

  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/track-order`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...policies.map((p) => ({ url: `${base}/pages/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];

  return [
    ...pages,
    ...categories.map((c) => ({ url: `${base}/c/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...brands.map((b) => ({ url: `${base}/brand/${b.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
