"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Store, User, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { MenuItem } from "./categories-menu";

const pages = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop all products" },
  { href: "/shop?sort=discount", label: "Discounts" },
  { href: "/track-order", label: "Track order" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/account", label: "My account" },
];

/**
 * Phones and tablets: hamburger button in the header, a slide-in menu with "Menu" and
 * "Categories" tabs, and a bar fixed to the bottom with Cart, My account, Menu and Shop (like the old site).
 */
export function MobileNav({ categories, brands, cartCount }: { categories: MenuItem[]; brands: MenuItem[]; cartCount: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"menu" | "categories">("menu");
  const close = () => setOpen(false);
  const openMenu = (t: "menu" | "categories") => {
    setTab(t);
    setOpen(true);
  };

  const barItem = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-heading";

  return (
    <>
      <button type="button" onClick={() => openMenu("menu")} aria-label="Open menu" className="flex size-10 items-center justify-center rounded-full hover:bg-muted lg:hidden">
        <Menu className="size-5" />
      </button>

      <nav aria-label="Quick links" className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur lg:hidden">
        <Link href="/cart" className={cn(barItem, "relative")}>
          <span className="relative">
            <ShoppingCart className="size-5" aria-hidden />
            {cartCount}
          </span>
          Cart
        </Link>
        <Link href="/account" className={barItem}>
          <User className="size-5" aria-hidden /> My account
        </Link>
        <button type="button" onClick={() => openMenu("categories")} className={barItem}>
          <Menu className="size-5" aria-hidden /> Menu
        </button>
        <Link href="/shop" className={barItem}>
          <Store className="size-5" aria-hidden /> Shop
        </Link>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[85vw] overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">
              W<span className="text-brand">Mart</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex border-b px-4" role="tablist">
            {(["menu", "categories"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn("flex-1 border-b-2 py-2.5 text-sm font-bold uppercase tracking-wide", tab === t ? "border-brand text-heading" : "border-transparent text-muted-foreground")}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="px-4 pb-8" role="tabpanel">
            {tab === "menu" ? (
              <ul className="divide-y">
                {pages.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} onClick={close} className="block py-3 font-medium text-heading hover:text-brand">{p.label}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-6 pt-2">
                <ul className="divide-y">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/c/${c.slug}`} onClick={close} className="flex justify-between py-3 font-medium text-heading hover:text-brand">
                        {c.name} <span className="text-sm text-muted-foreground">{c.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Brands</p>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((b) => (
                      <Link key={b.slug} href={`/brand/${b.slug}`} onClick={close} className="rounded-full border px-3 py-1 text-sm hover:border-brand hover:text-brand">
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
