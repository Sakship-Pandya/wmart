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
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="categories-menu"
        className={cn(
          "inline-flex h-9.5 items-center gap-1.5 rounded-full border-2 border-brand px-4 text-sm font-semibold transition cursor-pointer",
          open
            ? "bg-brand text-brand-foreground shadow-sm"
            : "text-brand hover:bg-brand hover:text-brand-foreground"
        )}
      >
        <LayoutGrid className="size-3.5" />
        Categories
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id="categories-menu"
          className="absolute top-full left-0 z-50 mt-2 flex w-[min(680px,92vw)] flex-col rounded-2xl border bg-popover p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none sm:flex-row sm:divide-x sm:divide-border"
        >
          {/* Categories section */}
          <div className="flex-1 sm:pr-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</p>
            <ul className="space-y-1">
              <li key="all-products">
                <Link
                  href="/shop"
                  onClick={close}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium text-heading transition hover:bg-muted hover:text-brand"
                >
                  All Products
                  {totalCount > 0 && <span className="text-xs text-muted-foreground">{totalCount}</span>}
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/c/${c.slug}`}
                    onClick={close}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium text-heading transition hover:bg-muted hover:text-brand"
                  >
                    {c.name}
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop by Brand section */}
          <div className="mt-6 border-t pt-6 sm:mt-0 sm:border-t-0 sm:pt-0 sm:flex-1 sm:pl-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Shop by brand</p>
            <ul className="grid grid-cols-2 gap-1">
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/brand/${b.slug}`}
                    onClick={close}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium text-heading transition hover:bg-muted hover:text-brand"
                  >
                    <span>{b.name}</span>
                    {b.count > 0 && <span className="text-xs text-muted-foreground">{b.count}</span>}
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
