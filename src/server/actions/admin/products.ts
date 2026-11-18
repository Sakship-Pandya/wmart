"use server";

import { requireAdmin } from "@/lib/auth";

// Admin server actions (owned by the admin-panel developer).
// Every action must call requireAdmin() first.
// TODO: createProduct, updateProduct, deleteProduct, updateStock, importProductsCsv

export async function placeholderAdminAction() {
  await requireAdmin();
}
