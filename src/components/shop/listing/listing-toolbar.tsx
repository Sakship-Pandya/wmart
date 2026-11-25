"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { listingHref, type Query } from "@/lib/listing-url";
import { ListingFilters, type Facet } from "./listing-filters";

export function ListingToolbar({
  pathname,
  query,
  sorts,
  sort,
  total,
  from,
  to,
  filters,
}: {
  pathname: string;
  query: Query;
  sorts: Record<string, string>;
  sort: string;
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
        <Select
          items={sorts}
          value={sort}
          disabled={pending}
          onValueChange={(value) =>
            startTransition(() =>
              router.push(listingHref(pathname, query, { sort: !value || value === "default" ? undefined : String(value) }), { scroll: false }),
            )
          }
        >
          <SelectTrigger
            aria-label="Sort products"
            className="h-9 min-w-52 gap-2 rounded-full border-border bg-background pr-3 pl-4 font-medium text-heading hover:border-brand data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20 focus-visible:border-brand focus-visible:ring-brand/20 dark:bg-background [&_[data-slot=select-value]]:flex-1"
          >
            <ArrowUpDown className="size-4 text-brand" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            align="end"
            alignItemWithTrigger={false}
            sideOffset={6}
            className="min-w-56 rounded-2xl border p-1.5 shadow-lg ring-0"
          >
            {Object.entries(sorts).map(([value, label]) => (
              <SelectItem
                key={value}
                value={value}
                className="cursor-pointer rounded-xl py-2 pr-9 pl-3 text-sm text-heading focus:bg-brand/10 focus:text-brand data-highlighted:bg-brand/10 data-highlighted:text-brand data-selected:font-semibold data-selected:text-brand [&_svg]:text-brand"
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
