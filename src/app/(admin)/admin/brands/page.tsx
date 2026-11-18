import { Suspense } from "react";
import { Tag } from "lucide-react";
import { getAdminBrands } from "@/server/queries/admin/brands";
import { BrandList } from "@/components/admin/brands/brand-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Brands | WMart Admin",
};

export default function AdminBrandsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Tag className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage hardware manufacturers and brands (e.g. Dell, HP, Lenovo, Apple).
        </p>
      </div>

      <Suspense fallback={<BrandListSkeleton />}>
        <BrandContent />
      </Suspense>
    </div>
  );
}

async function BrandContent() {
  const brands = await getAdminBrands();
  return <BrandList initialBrands={brands} />;
}

function BrandListSkeleton() {
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

