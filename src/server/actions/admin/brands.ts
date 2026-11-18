"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateSlug } from "@/lib/validations/product";

export async function createBrand(data: { name: string; slug?: string }) {
  await requireAdmin();

  const name = data.name.trim();
  if (!name || name.length < 2) {
    throw new Error("Brand name must be at least 2 characters");
  }

  const slug = (data.slug?.trim() ? generateSlug(data.slug) : generateSlug(name));
  if (!slug) {
    throw new Error("A valid slug is required");
  }

  // Check unique constraints
  const existing = await db.brand.findFirst({
    where: {
      OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }],
    },
  });

  if (existing) {
    if (existing.slug === slug) {
      throw new Error(`A brand with slug "${slug}" already exists.`);
    }
    throw new Error(`A brand named "${name}" already exists.`);
  }

  const brand = await db.brand.create({
    data: { name, slug },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/(shop)", "layout");

  return { success: true, brand };
}

export async function updateBrand(id: string, data: { name: string; slug: string }) {
  await requireAdmin();

  const name = data.name.trim();
  const slug = generateSlug(data.slug || name);

  if (!name || name.length < 2) {
    throw new Error("Brand name must be at least 2 characters");
  }

  const existing = await db.brand.findFirst({
    where: {
      NOT: { id },
      OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }],
    },
  });

  if (existing) {
    if (existing.slug === slug) {
      throw new Error(`Another brand with slug "${slug}" already exists.`);
    }
    throw new Error(`Another brand named "${name}" already exists.`);
  }

  await db.brand.update({
    where: { id },
    data: { name, slug },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath(`/brand/${slug}`);
  revalidatePath("/(shop)", "layout");

  return { success: true };
}

export async function deleteBrand(id: string) {
  await requireAdmin();

  const brand = await db.brand.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  if (brand._count.products > 0) {
    throw new Error(
      `Cannot delete "${brand.name}" because it has ${brand._count.products} products assigned to it. Please reassign or delete those products first.`
    );
  }

  await db.brand.delete({
    where: { id },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true };
}

