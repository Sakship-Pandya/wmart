import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/shop/breadcrumbs";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { getListing, parseListingParams, PER_PAGE_OPTIONS, SORTS, type ListingParams } from "@/server/queries/listing";
import type { Query } from "@/lib/listing-url";
import { ListingFilters } from "./listing-filters";
import { ListingToolbar } from "./listing-toolbar";
import { Pagination } from "./pagination";

/**
 * Shop-style product list: breadcrumbs, title, filter sidebar, sort / per-page / columns toolbar,
 * product grid and numbered pages. Used by /shop, /c/[slug], /brand/[slug] and /search.
 */
export async function ProductListing({
  pathname,
  scope,
  query,
  title,
  crumbs,
  empty,
}: {
  pathname: string;
  scope: ListingParams["scope"];
  query: Query;
  title: ReactNode;
  crumbs: Crumb[];
  empty: ReactNode;
}) {
  const params = parseListingParams(query, scope);
  const result = await getListing(params);
  const cols = query.cols === "3" ? 3 : 4;
  // Keep only the keys the listing understands in links (drops anything unexpected from the URL).
  const keep: Query = Object.fromEntries(
    Object.entries(query).filter(([k]) => ["q", "category", "brand", "min", "max", "in_stock", "sort", "per_page", "cols", "page"].includes(k)),
  );
  const from = result.total === 0 ? 0 : (result.page - 1) * result.perPage + 1;
  const to = Math.min(result.page * result.perPage, result.total);
  const filters = { categories: result.facets.categories, brands: result.facets.brands, priceBounds: result.priceBounds };
  const filtered = Boolean(params.categories.length || params.brands.length || params.min !== undefined || params.max !== undefined || params.inStock);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs items={crumbs} />
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-6">
            <ListingFilters pathname={pathname} query={keep} {...filters} />
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <ListingToolbar
            pathname={pathname}
            query={keep}
            sorts={SORTS}
            sort={params.sort}
            perPageOptions={PER_PAGE_OPTIONS}
            perPage={result.perPage}
            cols={cols}
            total={result.total}
            from={from}
            to={to}
            filters={filters}
          />
          <ProductGrid
            products={result.items}
            cols={cols}
            empty={
              filtered ? (
                <div className="rounded-2xl bg-muted px-6 py-12 text-center">
                  <p className="font-semibold text-heading">No products match these filters.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or widening the price range.</p>
                </div>
              ) : (
                empty
              )
            }
          />
          <Pagination pathname={pathname} query={keep} page={result.page} pageCount={result.pageCount} />
        </div>
      </div>
    </div>
  );
}

export function ProductListingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-72" />
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <Skeleton className="hidden h-96 rounded-2xl lg:block" />
        <div className="space-y-6">
          <Skeleton className="h-10 rounded-full" />
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
}
