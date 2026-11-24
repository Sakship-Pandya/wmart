import { cache, Suspense } from "react";
import Link from "next/link";
import { BadgePercent, LayoutGrid, Menu, User } from "lucide-react";
import { getCartCount } from "@/server/queries/cart";
import { listBrandsWithProducts, listCategoriesWithProducts } from "@/server/queries/products";
import { CategoriesMenu } from "./header/categories-menu";
import { LiveSearch } from "./header/live-search";
import { MiniCart } from "./header/mini-cart";
import { MobileNav } from "./header/mobile-nav";

// Header like the old site: top bar with links, logo, Categories menu, live search,
// Discounts, account and mini-cart; on phones a menu button and a bottom bar.

/** Categories and brands that have products – loaded once per request even though two menus use them. */
const getMenuData = cache(async () => {
  const [categories, brands] = await Promise.all([listCategoriesWithProducts(20), listBrandsWithProducts(30)]);
  return { categories, brands };
});

/** Orange bubble with the number of items in the cart (reads the cart cookie on each request). */
async function CartCount() {
  const count = await getCartCount();
  return (
    <>
      <span className="sr-only">Cart, {count} {count === 1 ? "item" : "items"}</span>
      {count > 0 && (
        <span aria-hidden className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full border-2 border-background bg-brand px-1 text-[10px] font-bold leading-4 text-brand-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </>
  );
}

async function DesktopCategories() {
  const { categories, brands } = await getMenuData();
  return <CategoriesMenu categories={categories} brands={brands} />;
}

async function PhoneMenu() {
  const { categories, brands } = await getMenuData();
  return (
    <MobileNav
      categories={categories}
      brands={brands}
      cartCount={
        <Suspense fallback={null}>
          <CartCount />
        </Suspense>
      }
    />
  );
}

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-1.5 text-xs font-medium sm:justify-between">
          <p className="uppercase tracking-wide">Free shipping on all orders · Cash on Delivery</p>
          <nav aria-label="Help" className="hidden gap-5 sm:flex">
            <Link href="/track-order" className="hover:underline">Shipment Tracking</Link>
            <Link href="/contact" className="hover:underline">Contact Us</Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-4 lg:py-4">
        <Suspense fallback={<span className="flex size-10 items-center justify-center lg:hidden"><Menu className="size-5" /></span>}>
          <PhoneMenu />
        </Suspense>

        <Link href="/" className="mr-auto text-[28px] font-black tracking-tight text-heading lg:mr-0" aria-label="WMart home">
          W<span className="text-brand">Mart</span>
        </Link>

        <div className="hidden lg:block">
          <Suspense
            fallback={
              <span className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand px-5 text-sm font-semibold text-brand">
                <LayoutGrid className="size-4" /> Categories
              </span>
            }
          >
            <DesktopCategories />
          </Suspense>
        </div>

        <LiveSearch className="hidden flex-1 lg:block" />

        <Link
          href="/shop?sort=discount"
          className="hidden h-11 items-center gap-1.5 rounded-full border-2 border-brand px-5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-brand-foreground lg:inline-flex"
        >
          <BadgePercent className="size-4" /> Discounts
        </Link>

        <Link href="/account" aria-label="My account" className="hidden size-11 items-center justify-center rounded-full border transition hover:border-brand hover:text-brand sm:flex">
          <User className="size-5" />
        </Link>

        <MiniCart
          count={
            <Suspense fallback={<span className="sr-only">Cart</span>}>
              <CartCount />
            </Suspense>
          }
        />
      </div>

      {/* Phones and tablets: full-width search under the logo */}
      <div className="px-4 pb-3 lg:hidden">
        <LiveSearch />
      </div>
    </header>
  );
}
