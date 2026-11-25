import "server-only";
import { headers } from "next/headers";

// The site's public address, used for absolute links (sitemap.xml, robots.txt).
// Set NEXT_PUBLIC_SITE_URL (e.g. "https://www.wmart.co.in") once the real domain is live.
// Until then it uses the address the request came in on – Vercel's own "production URL"
// variable can name a *.vercel.app domain that isn't actually serving this site.
export async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
