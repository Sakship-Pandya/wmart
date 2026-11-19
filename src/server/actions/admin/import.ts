"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseCSV } from "@/lib/csv-parser";
import { generateSlug } from "@/lib/validations/product";

export interface ImportResult {
  success: boolean;
  totalParsed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  formatDetected: "Shopify" | "WooCommerce" | "Standard" | "Unknown";
  errors: string[];
}

export async function importProductsCsvAction(csvContent: string): Promise<ImportResult> {
  await requireAdmin();

  const records = parseCSV(csvContent);

  if (records.length === 0) {
    return {
      success: false,
      totalParsed: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      formatDetected: "Unknown",
      errors: ["No valid CSV data or headers found in file."],
    };
  }

  // Detect format
  const first = records[0];
  let format: "Shopify" | "WooCommerce" | "Standard" = "Standard";

  if ("Handle" in first && ("Variant Price" in first || "Title" in first)) {
    format = "Shopify";
  } else if ("Name" in first && ("Regular price" in first || "Sale price" in first || "SKU" in first)) {
    format = "WooCommerce";
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  if (format === "Shopify") {
    // Group Shopify rows by Handle (variants and extra images for same product)
    const grouped = new Map<string, typeof records>();
    for (const r of records) {
      const handle = r["Handle"]?.trim();
      if (!handle) continue;
      const list = grouped.get(handle) ?? [];
      list.push(r);
      grouped.set(handle, list);
    }

    for (const [handle, rows] of grouped.entries()) {
      try {
        const primaryRow = rows[0];
        const title = primaryRow["Title"]?.trim() || handle;
        const description = primaryRow["Body (HTML)"] || "";
        const vendorName = primaryRow["Vendor"]?.trim() || "Generic";
        const categoryName = primaryRow["Type"]?.trim() || "Laptop Accessories";
        const priceNum = parseFloat(primaryRow["Variant Price"] || "0");
        const mrpNum = parseFloat(primaryRow["Variant Compare At Price"] || primaryRow["Variant Price"] || "0");
        const stockNum = parseInt(primaryRow["Variant Inventory Qty"] || "0", 10);

        const priceInPaise = Math.round(priceNum * 100);
        const mrpInPaise = Math.max(priceInPaise, Math.round(mrpNum * 100));

        // Part numbers from SKU and tags
        const partNumbersSet = new Set<string>();
        rows.forEach((r) => {
          const sku = r["Variant SKU"]?.trim();
          if (sku) partNumbersSet.add(sku);
        });

        // Collect images
        const imageUrlsSet = new Set<string>();
        rows.forEach((r) => {
          const img = r["Image Src"]?.trim();
          if (img && img.startsWith("http")) imageUrlsSet.add(img);
        });

        const slug = generateSlug(handle);
        const brandSlug = generateSlug(vendorName);
        const categorySlug = generateSlug(categoryName);

        // Upsert Brand
        const brand = await db.brand.upsert({
          where: { slug: brandSlug },
          update: {},
          create: { name: vendorName, slug: brandSlug },
        });

        // Upsert Category
        const category = await db.category.upsert({
          where: { slug: categorySlug },
          update: {},
          create: { name: categoryName, slug: categorySlug },
        });

        const existing = await db.product.findUnique({
          where: { slug },
          select: { id: true, oldUrls: true },
        });

        const oldUrl = `/products/${handle}`;

        if (existing) {
          // Update product
          await db.$transaction(async (tx) => {
            await tx.partNumber.deleteMany({ where: { productId: existing.id } });
            await tx.productImage.deleteMany({ where: { productId: existing.id } });

            await tx.product.update({
              where: { id: existing.id },
              data: {
                title,
                description: description || null,
                brandId: brand.id,
                categoryId: category.id,
                price: priceInPaise,
                mrp: mrpInPaise,
                stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
                isActive: true,
                oldUrls: existing.oldUrls.includes(oldUrl) ? existing.oldUrls : [...existing.oldUrls, oldUrl],
                partNumbers: {
                  create: Array.from(partNumbersSet).map((code) => ({ code })),
                },
                images: {
                  create: Array.from(imageUrlsSet).map((url, i) => ({ url, position: i })),
                },
              },
            });
          });
          updatedCount++;
        } else {
          // Create new product
          await db.product.create({
            data: {
              title,
              slug,
              description: description || null,
              brandId: brand.id,
              categoryId: category.id,
              price: priceInPaise,
              mrp: mrpInPaise,
              stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
              isActive: true,
              oldUrls: [oldUrl],
              partNumbers: {
                create: Array.from(partNumbersSet).map((code) => ({ code })),
              },
              images: {
                create: Array.from(imageUrlsSet).map((url, i) => ({ url, position: i })),
              },
            },
          });
          createdCount++;
        }
      } catch (err: unknown) {
        errors.push(`Error on Shopify product "${handle}": ${err instanceof Error ? err.message : String(err)}`);
        skippedCount++;
      }
    }
  } else if (format === "WooCommerce") {
    // WooCommerce format
    for (const row of records) {
      const name = row["Name"]?.trim();
      if (!name) {
        skippedCount++;
        continue;
      }

      try {
        const slug = generateSlug(row["Slug"] || name);
        const description = row["Description"] || row["Short description"] || "";
        const rawCategory = row["Categories"]?.split(">")[0]?.trim() || "Laptop Accessories";
        const vendorName = row["Brand"] || row["Vendor"] || "Generic";

        const priceNum = parseFloat(row["Sale price"] || row["Regular price"] || "0");
        const mrpNum = parseFloat(row["Regular price"] || row["Sale price"] || "0");
        const stockNum = parseInt(row["Stock"] || "0", 10);

        const priceInPaise = Math.round(priceNum * 100);
        const mrpInPaise = Math.max(priceInPaise, Math.round(mrpNum * 100));

        const brandSlug = generateSlug(vendorName);
        const categorySlug = generateSlug(rawCategory);

        const brand = await db.brand.upsert({
          where: { slug: brandSlug },
          update: {},
          create: { name: vendorName, slug: brandSlug },
        });

        const category = await db.category.upsert({
          where: { slug: categorySlug },
          update: {},
          create: { name: rawCategory, slug: categorySlug },
        });

        const partNumbersSet = new Set<string>();
        if (row["SKU"]?.trim()) partNumbersSet.add(row["SKU"].trim());

        const imageUrls = (row["Images"] || "")
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u.startsWith("http"));

        const oldUrl = `/product/${slug}/`;

        const existing = await db.product.findUnique({
          where: { slug },
          select: { id: true, oldUrls: true },
        });

        if (existing) {
          await db.$transaction(async (tx) => {
            await tx.partNumber.deleteMany({ where: { productId: existing.id } });
            await tx.productImage.deleteMany({ where: { productId: existing.id } });

            await tx.product.update({
              where: { id: existing.id },
              data: {
                title: name,
                description: description || null,
                brandId: brand.id,
                categoryId: category.id,
                price: priceInPaise,
                mrp: mrpInPaise,
                stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
                isActive: true,
                oldUrls: existing.oldUrls.includes(oldUrl) ? existing.oldUrls : [...existing.oldUrls, oldUrl],
                partNumbers: {
                  create: Array.from(partNumbersSet).map((code) => ({ code })),
                },
                images: {
                  create: imageUrls.map((url, i) => ({ url, position: i })),
                },
              },
            });
          });
          updatedCount++;
        } else {
          await db.product.create({
            data: {
              title: name,
              slug,
              description: description || null,
              brandId: brand.id,
              categoryId: category.id,
              price: priceInPaise,
              mrp: mrpInPaise,
              stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
              isActive: true,
              oldUrls: [oldUrl],
              partNumbers: {
                create: Array.from(partNumbersSet).map((code) => ({ code })),
              },
              images: {
                create: imageUrls.map((url, i) => ({ url, position: i })),
              },
            },
          });
          createdCount++;
        }
      } catch (err: unknown) {
        errors.push(`Error on WooCommerce product "${name}": ${err instanceof Error ? err.message : String(err)}`);
        skippedCount++;
      }
    }
  } else {
    // Standard WMart format
    for (const row of records) {
      const title = row["Title"] || row["title"] || row["Product Title"] || row["Name"];
      if (!title?.trim()) {
        skippedCount++;
        continue;
      }

      try {
        const trimmedTitle = title.trim();
        const slug = generateSlug(row["Slug"] || row["slug"] || trimmedTitle);
        const vendorName = row["Brand"] || row["brand"] || "Generic";
        const categoryName = row["Category"] || row["category"] || "Laptop Accessories";

        const priceNum = parseFloat(row["Price"] || row["price"] || "0");
        const mrpNum = parseFloat(row["MRP"] || row["mrp"] || row["Price"] || "0");
        const stockNum = parseInt(row["Stock"] || row["stock"] || "0", 10);

        const priceInPaise = Math.round(priceNum * 100);
        const mrpInPaise = Math.max(priceInPaise, Math.round(mrpNum * 100));

        const brandSlug = generateSlug(vendorName);
        const categorySlug = generateSlug(categoryName);

        const brand = await db.brand.upsert({
          where: { slug: brandSlug },
          update: {},
          create: { name: vendorName, slug: brandSlug },
        });

        const category = await db.category.upsert({
          where: { slug: categorySlug },
          update: {},
          create: { name: categoryName, slug: categorySlug },
        });

        // List cells may be separated by "|", ",", ";" or new lines.
        // Column names are accepted in both PascalCase and snake_case
        // (e.g. "Images" or "image_urls"), matching the WMart sample CSVs.
        const splitList = (value: string | undefined) =>
          (value || "")
            .split(/[|,;\n]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        const partCodes = splitList(
          row["PartNumbers"] || row["partNumbers"] || row["part_numbers"] || row["SKU"] || row["sku"],
        );

        const compatibleModels = splitList(
          row["CompatibleModels"] || row["compatibleWith"] || row["compatible_models"],
        );

        const imageUrls = splitList(
          row["Images"] || row["images"] || row["Image"] || row["image_urls"] || row["ImageUrls"],
        ).filter((s) => s.startsWith("http"));

        const hsnCode = (row["HSN"] || row["hsnCode"] || row["hsn_code"] || "").trim() || null;
        const activeCell = (row["IsActive"] || row["isActive"] || row["is_active"] || "").trim().toLowerCase();
        const isActive = !["false", "0", "no"].includes(activeCell);

        const existing = await db.product.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (existing) {
          await db.$transaction(async (tx) => {
            await tx.partNumber.deleteMany({ where: { productId: existing.id } });
            await tx.compatibleModel.deleteMany({ where: { productId: existing.id } });
            await tx.productImage.deleteMany({ where: { productId: existing.id } });

            await tx.product.update({
              where: { id: existing.id },
              data: {
                title: trimmedTitle,
                description: row["Description"] || row["description"] || null,
                brandId: brand.id,
                categoryId: category.id,
                price: priceInPaise,
                mrp: mrpInPaise,
                stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
                hsnCode,
                isActive,
                partNumbers: {
                  create: partCodes.map((code) => ({ code })),
                },
                compatibleWith: {
                  create: compatibleModels.map((name) => ({ name })),
                },
                images: {
                  create: imageUrls.map((url, i) => ({ url, position: i })),
                },
              },
            });
          });
          updatedCount++;
        } else {
          await db.product.create({
            data: {
              title: trimmedTitle,
              slug,
              description: row["Description"] || row["description"] || null,
              brandId: brand.id,
              categoryId: category.id,
              price: priceInPaise,
              mrp: mrpInPaise,
              stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
              hsnCode,
              isActive,
              partNumbers: {
                create: partCodes.map((code) => ({ code })),
              },
              compatibleWith: {
                create: compatibleModels.map((name) => ({ name })),
              },
              images: {
                create: imageUrls.map((url, i) => ({ url, position: i })),
              },
            },
          });
          createdCount++;
        }
      } catch (err: unknown) {
        errors.push(`Error on product "${title}": ${err instanceof Error ? err.message : String(err)}`);
        skippedCount++;
      }
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  revalidatePath("/(shop)", "layout");

  return {
    success: createdCount > 0 || updatedCount > 0,
    totalParsed: records.length,
    createdCount,
    updatedCount,
    skippedCount,
    formatDetected: format,
    errors,
  };
}

