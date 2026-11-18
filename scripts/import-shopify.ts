// Import products from the Shopify product export CSV (admin developer).
// Run: npx tsx scripts/import-shopify.ts ./data/shopify-products.csv
//
// TODO:
// 1. Parse the CSV. Shopify puts one row per variant/image; group rows by "Handle".
// 2. Map columns: Title, Body (HTML), Vendor -> Brand, Type/Tags -> Category,
//    Variant Price -> price (x100 for paise), Variant Compare At Price -> mrp,
//    Variant SKU / tags -> PartNumber, Variant Inventory Qty -> stock, Image Src -> images.
// 3. Upsert by slug (= Handle) so the script can be run again safely.
// 4. Save the old URL (/products/<handle>) in oldUrls for 301 redirects.
export {};
