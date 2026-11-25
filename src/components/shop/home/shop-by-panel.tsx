"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Part = { first: ReactNode; rest: ReactNode | null };

/**
 * Home page "Shop by category / brand" panel. Each part shows its first row; its own arrow (far right of
 * its title) slides the rest open underneath, and the panel grows with it. Tiles are rendered on the server.
 */
export function ShopByPanel({ categories, brands }: { categories: Part; brands: Part }) {
  return (
    <section aria-label="Shop by category or brand" className="rounded-3xl border bg-muted/40 p-4 sm:p-7">
      <ShopBySection title="Shop by category" part={categories} />
      <div className="my-6 border-t sm:my-7" />
      <ShopBySection title="Shop by brand" part={brands} />
    </section>
  );
}

function ShopBySection({ title, part }: { title: string; part: Part }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-heading sm:text-2xl">{title}</h3>
        {part.rest && (
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

      <div className="mt-4">{part.first}</div>

      {part.rest && (
        // Animates the row height from 0 to its natural size, so the panel grows smoothly.
        <div
          id={id}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-700 ease-in-out",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          {/* inert: hidden tiles can't be tabbed to or read out while closed. */}
          <div className="min-h-0 overflow-hidden" inert={!open}>
            <div className="pt-3">{part.rest}</div>
          </div>
        </div>
      )}
    </div>
  );
}
