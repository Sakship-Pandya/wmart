"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type MenuItem = { name: string; slug: string; count: number };

/** Dark "Categories" button with a drop-down of every category and brand (the old site's mega-menu). */
export function CategoriesMenu({ categories, brands }: { categories: MenuItem[]; brands: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="categories-menu"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-heading px-5 text-sm font-semibold text-background transition hover:bg-heading/85"
      >
        <LayoutGrid className="size-4" />
        Categories
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id="categories-menu"
          className="absolute top-full left-0 z-50 mt-2 grid w-[min(640px,90vw)] gap-6 rounded-2xl border bg-popover p-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none sm:grid-cols-2"
        >
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</p>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/c/${c.slug}`} onClick={close} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-heading hover:bg-muted hover:text-brand">
                    {c.name}
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" onClick={close} className="block rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-muted">
                  All products →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Shop by brand</p>
            <ul className="grid grid-cols-2 gap-1">
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link href={`/brand/${b.slug}`} onClick={close} className="block rounded-lg px-2 py-1.5 text-sm text-heading hover:bg-muted hover:text-brand">
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
