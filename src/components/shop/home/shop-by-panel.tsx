"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, X } from "lucide-react";
import { listingHref } from "@/lib/listing-url";
import { cn } from "@/lib/utils";

/** One category or brand card. `content` (icon/logo + name + count) is rendered on the server. */
export type ShopByItem = { slug: string; name: string; content: ReactNode };

/** Same grid for categories and brands, so the two parts line up. */
export const TILE_GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5";
/** Cards shown before a section is expanded (one row on desktop). */
export const FIRST_TILES = 5;

/**
 * Home page "Shop by category / brand" panel. Cards are toggles: pick any mix of categories and brands,
 * then "Show products" opens /shop filtered to them – e.g. Laptop Batteries from Dell or Apple
 * (/shop?category=laptop-batteries&brand=dell&brand=apple). Each section shows its first row; its own
 * arrow slides the rest open when there are more.
 */
export function ShopByPanel({ categories, brands }: { categories: ShopByItem[]; brands: ShopByItem[] }) {
  const [cats, setCats] = useState<string[]>([]);
  const [brs, setBrs] = useState<string[]>([]);
  const toggle = (list: string[], slug: string) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);

  const picked = [...categories.filter((c) => cats.includes(c.slug)), ...brands.filter((b) => brs.includes(b.slug))];
  const href = listingHref("/shop", {}, { category: cats, brand: brs });

  return (
    <section aria-label="Shop by category or brand" className="rounded-3xl border bg-muted/40 p-4 sm:p-7">
      <ShopBySection
        title="Shop by category"
        items={categories}
        selected={cats}
        onToggle={(slug) => setCats((l) => toggle(l, slug))}
        empty="No categories yet – add products in the admin panel."
      />
      <div className="my-6 border-t sm:my-7" />
      <ShopBySection
        title="Shop by brand"
        items={brands}
        selected={brs}
        onToggle={(slug) => setBrs((l) => toggle(l, slug))}
        empty="No brands yet."
      />

      {/* Selection bar: slides in once something is picked; sticks to the bottom of the screen while scrolling the panel. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-in-out",
          picked.length ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden" inert={!picked.length}>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
            <p className="min-w-0 flex-1 text-sm text-heading" aria-live="polite">
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-semibold">{picked.map((p) => p.name).join(", ")}</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCats([]);
                  setBrs([]);
                }}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium text-heading transition hover:border-brand hover:text-brand sm:flex-none"
              >
                <X className="size-4" aria-hidden />
                Clear
              </button>
              <Link
                href={href}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/85 sm:flex-none"
              >
                Show products
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShopBySection({
  title,
  items,
  selected,
  onToggle,
  empty,
}: {
  title: string;
  items: ShopByItem[];
  selected: string[];
  onToggle: (slug: string) => void;
  empty: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const first = items.slice(0, FIRST_TILES);
  const rest = items.slice(FIRST_TILES);
  const tiles = (list: ShopByItem[]) => (
    <div className={TILE_GRID}>
      {list.map((item) => (
        <Tile key={item.slug} item={item} selected={selected.includes(item.slug)} onToggle={() => onToggle(item.slug)} />
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-heading sm:text-2xl">{title}</h3>
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={id}
            aria-label={open ? `Show fewer – ${title.toLowerCase()}` : `Show all – ${title.toLowerCase()}`}
            title={open ? "Show less" : "Show all"}
            className="flex size-8 items-center justify-center rounded-full text-heading transition hover:bg-foreground/5 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          >
            <ChevronDown className={cn("size-5 transition-transform duration-500", open && "rotate-180")} aria-hidden />
          </button>
        )}
      </div>

      <div className="mt-4">{items.length ? tiles(first) : <p className="text-muted-foreground">{empty}</p>}</div>

      {rest.length > 0 && (
        // Animates the row height from 0 to its natural size, so the panel grows smoothly.
        <div
          id={id}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-700 ease-in-out",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          {/* inert: hidden cards can't be tabbed to or read out while closed. */}
          <div className="min-h-0 overflow-hidden" inert={!open}>
            <div className="pt-3">{tiles(rest)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** A selectable card: orange border, tint and a tick when picked. */
function Tile({ item, selected, onToggle }: { item: ShopByItem; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2.5 rounded-2xl border bg-background p-2.5 text-left transition sm:gap-3 sm:p-3",
        "hover:border-brand hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
        selected && "border-brand bg-brand/5 ring-1 ring-brand",
      )}
    >
      {item.content}
      <span
        aria-hidden
        className={cn(
          "absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm transition",
          selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
    </button>
  );
}
