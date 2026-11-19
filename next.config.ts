import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product images. Shopify/WordPress CDNs only until images are moved to our own storage.
  // Object form (not `new URL(...)`): a URL object sets `search` to "", which rejects
  // any query string, and Shopify image URLs always end in "?v=<timestamp>".
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      // Only wmartstore.in's own Shopify files, not every Shopify store.
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/1/0824/9052/3878/**" },
      { protocol: "https", hostname: "www.wmart.co.in", pathname: "/wp-content/uploads/**" },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
