"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  brands: FilterOption[];
  categories: FilterOption[];
}

export function ProductFilters({ brands, categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams.get("q") ?? "";
  const currentBrand = searchParams.get("brand") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentSort = searchParams.get("sort") ?? "newest";

  const hasFilters = Boolean(
    currentQ ||
    currentBrand ||
    currentCategory ||
    (currentStatus && currentStatus !== "all") ||
    (currentSort && currentSort !== "newest")
  );

  function updateFilter(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    // Reset page whenever search or filter criteria change
    if (!updates.page) {
      params.delete("page");
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "sort" && value === "newest")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string) || "";
    updateFilter({ q });
  }

  function handleClearAll() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={currentQ}
            placeholder="Search by title, part number (e.g. HS04), or laptop model..."
            className="pl-9 pr-16"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={isPending}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2.5 text-xs"
          >
            Search
          </Button>
        </form>

        {/* Clear Filters Button */}
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={isPending}
            className="h-9 gap-1 text-muted-foreground hover:text-foreground self-start md:self-auto"
          >
            <X className="size-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mr-1">
          <Filter className="size-3.5" />
          <span>Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          value={currentCategory}
          onChange={(e) => updateFilter({ category: e.target.value })}
          disabled={isPending}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={currentBrand}
          onChange={(e) => updateFilter({ brand: e.target.value })}
          disabled={isPending}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Stock / Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilter({ status: e.target.value })}
          disabled={isPending}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive / Draft</option>
          <option value="in-stock">In Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>

        {/* Sort Filter */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground hidden sm:inline">Sort by:</span>
          <select
            value={currentSort}
            onChange={(e) => updateFilter({ sort: e.target.value })}
            disabled={isPending}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="newest">Newest Added</option>
            <option value="oldest">Oldest Added</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-desc">Stock: High to Low</option>
            <option value="stock-asc">Stock: Low to High</option>
            <option value="title-asc">Title: A to Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}

