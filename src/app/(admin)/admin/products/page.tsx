import { Suspense } from "react";
import Link from "next/link";
import { Plus, Upload, Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  getAdminProducts,
  getAdminProductFilterOptions,
  type AdminProductListParams,
} from "@/server/queries/admin/products";
import { ProductTable } from "@/components/admin/products/product-table";
import { ProductFilters } from "@/components/admin/products/product-filters";
import { ProductPagination } from "@/components/admin/products/product-pagination";
import { ProductTableSkeleton } from "@/components/admin/products/product-table-skeleton";

export const metadata = {
  title: "Products | WMart Admin",
};

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    status?: "all" | "active" | "inactive" | "out-of-stock" | "in-stock";
    sort?: "newest" | "oldest" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc" | "title-asc";
    page?: string;
  }>;
}

export default function AdminProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your catalogue, part numbers, laptop compatibility, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/import"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Upload className="size-4 mr-1.5" />
            Bulk Import
          </Link>
          <Link
            href="/admin/products/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="size-4 mr-1.5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Product Content with Suspense boundary */}
      <Suspense fallback={<ProductTableSkeleton />}>
        <ProductContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    status?: "all" | "active" | "inactive" | "out-of-stock" | "in-stock";
    sort?: "newest" | "oldest" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc" | "title-asc";
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const pageNumber = params.page ? parseInt(params.page, 10) : 1;

  const queryParams: AdminProductListParams = {
    q: params.q,
    brand: params.brand,
    category: params.category,
    status: params.status,
    sort: params.sort,
    page: Number.isNaN(pageNumber) ? 1 : pageNumber,
    pageSize: 15,
  };

  const [{ products, totalCount, totalPages, currentPage, pageSize }, filterOptions] =
    await Promise.all([
      getAdminProducts(queryParams),
      getAdminProductFilterOptions(),
    ]);

  return (
    <div className="space-y-4">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-3 sm:w-fit">
        <div className="rounded-md border bg-card px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Total:</span>{" "}
          <span className="font-semibold">{filterOptions.stats.total}</span>
        </div>
        <div className="rounded-md border bg-card px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Active:</span>{" "}
          <span className="font-semibold text-emerald-600">{filterOptions.stats.active}</span>
        </div>
        <div className="rounded-md border bg-card px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Out of stock:</span>{" "}
          <span className="font-semibold text-destructive">{filterOptions.stats.outOfStock}</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <ProductFilters
        brands={filterOptions.brands}
        categories={filterOptions.categories}
      />

      {/* Table */}
      <ProductTable products={products} />

      {/* Pagination */}
      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
}
