// Import products from the WooCommerce product export CSV (admin developer).
// Run: npx tsx scripts/import-woocommerce.ts ./data/woocommerce-products.csv
//
// TODO:
// 1. Parse the CSV (columns: Name, Description, Regular price, Sale price, Stock, Categories, Images, SKU).
// 2. Match against products already imported from Shopify by part number / SKU and skip duplicates.
// 3. Save the old URL (/product/<slug>/) in oldUrls for 301 redirects.
export {};
