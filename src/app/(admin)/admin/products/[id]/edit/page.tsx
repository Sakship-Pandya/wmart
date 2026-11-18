import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getAdminProductById,
  getAdminProductFilterOptions,
} from "@/server/queries/admin/products";
import { ProductForm } from "@/components/admin/products/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductFormValues } from "@/lib/validations/product";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Product | WMart Admin",
};

export default function EditProductPage({ params }: EditProductPageProps) {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <EditProductContent params={params} />
    </Suspense>
  );
}

async function EditProductContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, { brands, categories }] = await Promise.all([
    getAdminProductById(id),
    getAdminProductFilterOptions(),
  ]);

  if (!product) {
    notFound();
  }

  const initialData: ProductFormValues & { id: string } = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description || "",
    brandId: product.brandId,
    categoryId: product.categoryId,
    mrp: product.mrp / 100, // paise to ₹
    price: product.price / 100, // paise to ₹
    stock: product.stock,
    hsnCode: product.hsnCode || "",
    gstRate: product.gstRate,
    isOriginal: product.isOriginal,
    isActive: product.isActive,
    partNumbers: product.partNumbers.map((p) => p.code),
    compatibleWith: product.compatibleWith.map((c) => c.name),
    images: product.images.map((img) => ({
      url: img.url,
      alt: img.alt || undefined,
    })),
    specs: (product.specs as Record<string, string>) || undefined,
  };

  return (
    <ProductForm
      initialData={initialData}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}

function ProductFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-1/3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

