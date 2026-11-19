import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product images. Shopify/WordPress CDNs only until images are moved to our own storage.
  images: {
    // Note: new URL("https://host/**") only allows links WITHOUT a "?..." part.
    remotePatterns: [
      new URL("https://res.cloudinary.com/**"),
      // Shopify image links always end in "?v=<version>", so `search` is left out to allow it.
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" },
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
