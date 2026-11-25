// The site's public address, used for absolute links (sitemap.xml, robots.txt).
// Set NEXT_PUBLIC_SITE_URL (e.g. "https://www.wmart.co.in") once the real domain is live.
// On Vercel it falls back to the production domain Vercel provides; locally to localhost.
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
