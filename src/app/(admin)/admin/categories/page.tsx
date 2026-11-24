import { Suspense } from "react";
import { Layers } from "lucide-react";
import { getAdminCategories } from "@/server/queries/admin/categories";
import { CategoryList } from "@/components/admin/categories/category-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Categories | WMart Admin",
};

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Layers className="size-6 text-brand" />
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage product categories (e.g. Laptop Batteries, Laptop Adapters, Power Cables).
        </p>
      </div>

      <Suspense fallback={<CategoryListSkeleton />}>
        <CategoryContent />
      </Suspense>
    </div>
  );
}

async function CategoryContent() {
  const categories = await getAdminCategories();
  return <CategoryList initialCategories={categories} />;
}

function CategoryListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-lg border bg-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

