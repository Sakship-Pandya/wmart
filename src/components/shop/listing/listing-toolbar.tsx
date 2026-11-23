"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, SlidersHorizontal, Grid3x3 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { listingHref, type Query } from "@/lib/listing-url";
import { ListingFilters, type Facet } from "./listing-filters";

export function ListingToolbar({
  pathname,
  query,
  sorts,
  sort,
  perPageOptions,
  perPage,
  cols,
  total,
  from,
  to,
  filters,
}: {
  pathname: string;
  query: Query;
  sorts: Record<string, string>;
  sort: string;
  perPageOptions: readonly number[];
  perPage: number;
  cols: 3 | 4;
  total: number;
  from: number;
  to: number;
  filters: { categories: Facet[]; brands: Facet[]; priceBounds: { min: number; max: number } };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 border-b pb-4", pending && "opacity-60")}>
      {/* Mobile / tablet: filters open in a side panel */}
      <Sheet>
        <SheetTrigger
          render={
            <button type="button" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium lg:hidden" />
          }
        >
          <SlidersHorizontal className="size-4" /> Filters
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ListingFilters pathname={pathname} query={query} {...filters} />
          </div>
        </SheetContent>
      </Sheet>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total} ${total === 1 ? "result" : "results"}`}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="Products per page" className="hidden items-center gap-1 text-sm sm:flex">
          <span className="mr-1 text-muted-foreground">Show:</span>
          {perPageOptions.map((n) => (
            <Link
              key={n}
              href={listingHref(pathname, query, { per_page: n === 12 ? undefined : String(n) })}
              scroll={false}
              aria-current={n === perPage ? "true" : undefined}
              className={cn("rounded-md px-1.5 py-0.5", n === perPage ? "font-bold text-heading" : "text-muted-foreground hover:text-brand")}
            >
              {n}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 lg:flex" role="group" aria-label="Products per row">
          {([3, 4] as const).map((n) => (
            <Link
              key={n}
              href={listingHref(pathname, query, { cols: n === 4 ? undefined : "3", page: query.page })}
              scroll={false}
              aria-label={`${n} per row`}
              aria-current={n === cols ? "true" : undefined}
              className={cn("rounded-md p-1.5", n === cols ? "bg-muted text-heading" : "text-muted-foreground hover:text-brand")}
            >
              {n === 3 ? <Grid3x3 className="size-4" /> : <LayoutGrid className="size-4" />}
            </Link>
          ))}
        </div>

        <label className="sr-only" htmlFor="sort">Sort products</label>
        <select
          id="sort"
          value={sort}
          disabled={pending}
          onChange={(e) =>
            startTransition(() =>
              router.push(listingHref(pathname, query, { sort: e.target.value === "default" ? undefined : e.target.value }), { scroll: false }),
            )
          }
          className="h-9 rounded-full border bg-background px-4 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20"
        >
          {Object.entries(sorts).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
