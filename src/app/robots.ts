import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// robots.txt – lets search engines crawl the shop, keeps them out of private and
// one-person pages (admin, account, cart, checkout, orders) and internal search results.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/order/", "/login", "/forgot-password", "/search"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
