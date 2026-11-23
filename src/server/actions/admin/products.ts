"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminProductWhere, type ProductStatusFilter } from "@/lib/admin-product-filter";
import { productSchema, generateSlug, type ProductFormValues } from "@/lib/validations/product";
import type { Prisma } from "@/generated/prisma/client";

// Admin server actions (owned by the admin-panel developer).
// Every action must call requireAdmin() first.

export async function createProduct(input: ProductFormValues) {
  await requireAdmin();

  const validated = productSchema.parse(input);

  // Auto-generate unique slug from title
  const baseSlug = validated.slug?.trim() ? generateSlug(validated.slug) : generateSlug(validated.title);
  let finalSlug = baseSlug;
  let counter = 1;

  while (await db.product.findUnique({ where: { slug: finalSlug }, select: { id: true } })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Convert prices from Rupees to Paise (whole numbers)
  const mrpInPaise = Math.round(validated.mrp * 100);
  const priceInPaise = Math.round(validated.price * 100);

  const cleanPartNumbers = Array.from(
    new Set(
      validated.partNumbers
        .map((p) => p.trim())
        .filter((code) => code.length > 0)
    )
  );

  const cleanModels = Array.from(
    new Set(
      validated.compatibleWith
        .map((m) => m.trim())
        .filter((name) => name.length > 0)
    )
  );

  const product = await db.product.create({
    data: {
      title: validated.title.trim(),
      slug: finalSlug,
      description: validated.description?.trim() || null,
      brandId: validated.brandId,
      categoryId: validated.categoryId,
      mrp: mrpInPaise,
      price: priceInPaise,
      hsnCode: validated.hsnCode?.trim() || null,
      gstRate: 18, // Fixed to 18%
      stock: validated.stock,
      isOriginal: validated.isOriginal,
      isActive: validated.isActive,
      specs: validated.specs ?? undefined,
      partNumbers: {
        create: cleanPartNumbers.map((code) => ({ code })),
      },
      compatibleWith: {
        create: cleanModels.map((name) => ({ name })),
      },
      images: {
        create: validated.images.map((img, index) => ({
          url: img.url.trim(),
          alt: img.alt?.trim() || null,
          position: index,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true, id: product.id, slug: product.slug };
}

export async function updateProduct(productId: string, input: ProductFormValues) {
  await requireAdmin();

  const validated = productSchema.parse(input);

  const current = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true, title: true },
  });

  // Calculate slug
  let finalSlug = current?.slug ?? generateSlug(validated.title);
  if (validated.slug?.trim()) {
    finalSlug = generateSlug(validated.slug);
  } else if (current && current.title !== validated.title) {
    const baseSlug = generateSlug(validated.title);
    finalSlug = baseSlug;
    let counter = 1;
    while (
      await db.product.findFirst({
        where: { slug: finalSlug, NOT: { id: productId } },
        select: { id: true },
      })
    ) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  const mrpInPaise = Math.round(validated.mrp * 100);
  const priceInPaise = Math.round(validated.price * 100);

  const cleanPartNumbers = Array.from(
    new Set(
      validated.partNumbers
        .map((p) => p.trim())
        .filter((code) => code.length > 0)
    )
  );

  const cleanModels = Array.from(
    new Set(
      validated.compatibleWith
        .map((m) => m.trim())
        .filter((name) => name.length > 0)
    )
  );

  await db.$transaction(async (tx) => {
    // Delete existing child relations
    await tx.partNumber.deleteMany({ where: { productId } });
    await tx.compatibleModel.deleteMany({ where: { productId } });
    await tx.productImage.deleteMany({ where: { productId } });

    // Update product & re-create relations
    await tx.product.update({
      where: { id: productId },
      data: {
        title: validated.title.trim(),
        slug: finalSlug,
        description: validated.description?.trim() || null,
        brandId: validated.brandId,
        categoryId: validated.categoryId,
        mrp: mrpInPaise,
        price: priceInPaise,
        hsnCode: validated.hsnCode?.trim() || null,
        gstRate: 18, // Fixed to 18%
        stock: validated.stock,
        isOriginal: validated.isOriginal,
        isActive: validated.isActive,
        specs: validated.specs ?? undefined,
        partNumbers: {
          create: cleanPartNumbers.map((code) => ({ code })),
        },
        compatibleWith: {
          create: cleanModels.map((name) => ({ name })),
        },
        images: {
          create: validated.images.map((img, index) => ({
            url: img.url.trim(),
            alt: img.alt?.trim() || null,
            position: index,
          })),
        },
      },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/p/${finalSlug}`);
  revalidatePath("/(shop)", "layout");

  return { success: true, id: productId, slug: finalSlug };
}

export async function toggleProductActive(productId: string) {
  await requireAdmin();

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { isActive: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const updated = await db.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
    select: { id: true, isActive: true },
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true, isActive: updated.isActive };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();

  await db.product.delete({
    where: { id: productId },
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true };
}

export async function updateProductStock(productId: string, stock: number) {
  await requireAdmin();

  if (stock < 0) {
    throw new Error("Stock cannot be negative");
  }

  const updated = await db.product.update({
    where: { id: productId },
    data: { stock },
    select: { id: true, stock: true },
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true, stock: updated.stock };
}

export async function deleteManyProducts(productIds: string[]) {
  await requireAdmin();

  if (!productIds || productIds.length === 0) {
    return { success: true, count: 0 };
  }

  await db.$transaction(async (tx) => {
    await tx.partNumber.deleteMany({
      where: { productId: { in: productIds } },
    });
    await tx.compatibleModel.deleteMany({
      where: { productId: { in: productIds } },
    });
    await tx.productImage.deleteMany({
      where: { productId: { in: productIds } },
    });
    await tx.product.deleteMany({
      where: { id: { in: productIds } },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true, count: productIds.length };
}

export async function setManyProductsActive(productIds: string[], isActive: boolean) {
  await requireAdmin();

  if (!productIds || productIds.length === 0) {
    return { success: true, count: 0 };
  }

  await db.product.updateMany({
    where: { id: { in: productIds } },
    data: { isActive },
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true, count: productIds.length };
}

export interface AdminProductFilterCriteria {
  q?: string;
  brand?: string;
  category?: string;
  status?: ProductStatusFilter;
}

function buildAdminProductFilterWhere(filters?: AdminProductFilterCriteria): Prisma.ProductWhereInput {
  return filters ? adminProductWhere(filters) : {};
}

export async function deleteAllFilteredProducts(filters?: AdminProductFilterCriteria) {
  await requireAdmin();
  const where = buildAdminProductFilterWhere(filters);

  const products = await db.product.findMany({
    where,
    select: { id: true },
  });

  if (products.length === 0) {
    return { success: true, count: 0 };
  }

  const ids = products.map((p) => p.id);

  await db.$transaction(async (tx) => {
    await tx.partNumber.deleteMany({
      where: { productId: { in: ids } },
    });
    await tx.compatibleModel.deleteMany({
      where: { productId: { in: ids } },
    });
    await tx.productImage.deleteMany({
      where: { productId: { in: ids } },
    });
    await tx.product.deleteMany({
      where: { id: { in: ids } },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true, count: ids.length };
}

export async function setAllFilteredProductsActive(
  isActive: boolean,
  filters?: AdminProductFilterCriteria
) {
  await requireAdmin();
  const where = buildAdminProductFilterWhere(filters);

  const updated = await db.product.updateMany({
    where,
    data: { isActive },
  });

  revalidatePath("/admin/products");
  revalidatePath("/(shop)", "layout");

  return { success: true, count: updated.count };
}


