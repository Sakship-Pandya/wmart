import { Suspense } from "react";
import { getAdminProductFilterOptions } from "@/server/queries/admin/products";
import { ProductForm } from "@/components/admin/products/product-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "New Product | WMart Admin",
};

export default function NewProductPage() {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
  const { brands, categories } = await getAdminProductFilterOptions();

  return (
    <ProductForm
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

