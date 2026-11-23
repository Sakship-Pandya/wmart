// Products CSV export (admin only).
//   GET /api/admin/export/products?q=&brand=&category=&status=
// Uses the same filters as the admin Products page. The columns match the
// "Standard CSV" bulk import, so an edited file can be imported back to update
// prices, stock and other fields (products are matched by slug).
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { adminProductWhere } from "@/lib/admin-product-filter";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { csvResponse, rupees, toCsv, todayIST } from "@/lib/csv";

const COLUMNS = [
  "title",
  "slug",
  "brand",
  "category",
  "price",
  "mrp",
  "stock",
  "stock_alert",
  "is_active",
  "part_numbers",
  "compatible_models",
  "voltage",
  "capacity",
  "wattage",
  "hsn_code",
  "gst_rate",
  "image_urls",
  "description",
  "old_urls",
  "updated_at",
] as const;

// Specs already exported in their own columns. Adapters keep voltage in "output".
const SPEC_COLUMN_KEYS = new Set(["voltage", "output", "capacity", "wattage"]);

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const filter = {
    q: url.searchParams.get("q") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  };

  const products = await db.product.findMany({
    where: adminProductWhere(filter),
    orderBy: [{ category: { name: "asc" } }, { title: "asc" }],
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, select: { url: true } },
      partNumbers: { orderBy: { code: "asc" }, select: { code: true } },
      compatibleWith: { orderBy: { name: "asc" }, select: { name: true } },
    },
  });

  // Extra spec keys (e.g. "cells", "connector") become spec_<key> columns.
  const extraSpecKeys = new Set<string>();
  for (const p of products) {
    for (const key of Object.keys((p.specs as Record<string, unknown> | null) ?? {})) {
      if (!SPEC_COLUMN_KEYS.has(key)) extraSpecKeys.add(key);
    }
  }
  const specColumns = [...extraSpecKeys].sort().map((k) => `spec_${k}`);

  const rows = products.map((p) => {
    const specs = (p.specs as Record<string, string> | null) ?? {};
    const row: Record<string, unknown> = {
      title: p.title,
      slug: p.slug,
      brand: p.brand.name,
      category: p.category.name,
      price: rupees(p.price),
      mrp: rupees(p.mrp),
      stock: p.stock,
      stock_alert: p.stock <= 0 ? "Out of stock" : p.stock <= LOW_STOCK_THRESHOLD ? "Low stock" : "",
      is_active: p.isActive ? "true" : "false",
      part_numbers: p.partNumbers.map((x) => x.code).join("|"),
      compatible_models: p.compatibleWith.map((x) => x.name).join("|"),
      voltage: specs.voltage ?? specs.output ?? "",
      capacity: specs.capacity ?? "",
      wattage: specs.wattage ?? "",
      hsn_code: p.hsnCode ?? "",
      gst_rate: p.gstRate,
      image_urls: p.images.map((i) => i.url).join("|"),
      description: p.description ?? "",
      old_urls: p.oldUrls.join("|"),
      updated_at: p.updatedAt,
    };
    for (const key of extraSpecKeys) row[`spec_${key}`] = specs[key] ?? "";
    return row;
  });

  const status = filter.status && filter.status !== "all" ? `-${filter.status}` : "";
  return csvResponse(toCsv([...COLUMNS, ...specColumns], rows), `wmart-products${status}-${todayIST()}.csv`);
}
