// Download every product image from the old Shopify / WordPress CDNs and re-upload it
// to our own storage (Cloudinary or Cloudflare R2), then update ProductImage.url.
// Must run BEFORE the old stores are closed — their image URLs stop working after that.
// Run: npx tsx scripts/download-images.ts
export {};
