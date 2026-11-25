import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/lib/site-url";

// robots.txt – lets search engines crawl the shop, keeps them out of private and
// one-person pages (admin, account, cart, checkout, orders) and internal search results.
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection(); // per request, so the sitemap link uses the domain being visited
  const base = await siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/order/", "/login", "/forgot-password", "/reset-password", "/search"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
