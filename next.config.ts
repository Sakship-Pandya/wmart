import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product images. Shopify/WordPress CDNs only until images are moved to our own storage.
  images: {
    remotePatterns: [
      new URL("https://res.cloudinary.com/**"),
      new URL("https://cdn.shopify.com/**"),
      new URL("https://www.wmart.co.in/wp-content/uploads/**"),
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
