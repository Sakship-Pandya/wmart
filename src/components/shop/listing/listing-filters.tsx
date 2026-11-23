"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { asList, listingHref, type Query } from "@/lib/listing-url";
import { PriceRange } from "./price-range";

export type Facet = { name: string; slug: string; count: number };

/** Sidebar filters: Categories, Price, Brand, In stock. Each change updates the page address. */
export function ListingFilters({
  pathname,
  query,
  categories,
  brands,
  priceBounds,
}: {
  pathname: string;
  query: Query;
  categories: Facet[];
  brands: Facet[];
  priceBounds: { min: number; max: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (changes: Query) => startTransition(() => router.push(listingHref(pathname, query, changes), { scroll: false }));

  const selectedCats = asList(query.category);
  const selectedBrands = asList(query.brand);
  const min = query.min ? Number(query.min) : undefined;
  const max = query.max ? Number(query.max) : undefined;
  const inStock = query.in_stock === "1";
  const toggle = (list: string[], slug: string) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
  const active = selectedCats.length + selectedBrands.length + (min !== undefined || max !== undefined ? 1 : 0) + (inStock ? 1 : 0);

  return (
    <div className={cn("space-y-6 transition-opacity", pending && "pointer-events-none opacity-60")} aria-busy={pending}>
      {active > 0 && (
        <button
          type="button"
          onClick={() => go({ category: undefined, brand: undefined, min: undefined, max: undefined, in_stock: undefined })}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          <X className="size-4" /> Clear all filters ({active})
        </button>
      )}

      {categories.length > 0 && (
        <FilterGroup title="Categories">
          {categories.map((c) => (
            <CheckRow key={c.slug} label={c.name} count={c.count} checked={selectedCats.includes(c.slug)} onChange={() => go({ category: toggle(selectedCats, c.slug) })} />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Filter by price">
        <PriceRange key={`${min}-${max}`} bounds={priceBounds} value={{ min, max }} disabled={pending} onApply={(lo, hi) => go({ min: lo?.toString(), max: hi?.toString() })} />
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title="Brand">
          {brands.map((b) => (
            <CheckRow key={b.slug} label={b.name} count={b.count} checked={selectedBrands.includes(b.slug)} onChange={() => go({ brand: toggle(selectedBrands, b.slug) })} />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Availability">
        <CheckRow label="In stock only" checked={inStock} onChange={() => go({ in_stock: inStock ? undefined : "1" })} />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-2.5 text-base font-semibold text-heading">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckRow({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-heading hover:text-brand">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-brand" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">{count}</span>}
    </label>
  );
}
