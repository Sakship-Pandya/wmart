"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateSlug } from "@/lib/validations/product";

export async function createCategory(data: { name: string; slug?: string }) {
  await requireAdmin();

  const name = data.name.trim();
  if (!name || name.length < 2) {
    throw new Error("Category name must be at least 2 characters");
  }

  const slug = data.slug?.trim() ? generateSlug(data.slug) : generateSlug(name);
  if (!slug) {
    throw new Error("A valid slug is required");
  }

  const existing = await db.category.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error(`A category with slug "${slug}" already exists.`);
  }

  const category = await db.category.create({
    data: { name, slug },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/(shop)", "layout");

  return { success: true, category };
}

export async function updateCategory(id: string, data: { name: string; slug: string }) {
  await requireAdmin();

  const name = data.name.trim();
  const slug = generateSlug(data.slug || name);

  if (!name || name.length < 2) {
    throw new Error("Category name must be at least 2 characters");
  }

  const existing = await db.category.findFirst({
    where: {
      slug,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error(`Another category with slug "${slug}" already exists.`);
  }

  await db.category.update({
    where: { id },
    data: { name, slug },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath(`/c/${slug}`);
  revalidatePath("/(shop)", "layout");

  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const category = await db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category._count.products > 0) {
    throw new Error(
      `Cannot delete "${category.name}" because it has ${category._count.products} products assigned to it. Please reassign or delete those products first.`
    );
  }

  await db.category.delete({
    where: { id },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true };
}

