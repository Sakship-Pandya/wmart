import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { getCartCount } from "@/server/queries/cart";
import { listCategoriesWithProducts } from "@/server/queries/products";
import { SearchBar } from "./search-bar";

// Orange bubble with the number of items in the cart (reads the cart cookie on each request).
async function CartCount() {
  const count = await getCartCount();
  return (
    <>
      <span className="sr-only">Cart, {count} {count === 1 ? "item" : "items"}</span>
      {count > 0 && (
        <span aria-hidden className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4.5 text-brand-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </>
  );
}

// Menu of the categories that have products in the database (so the links always work).
async function CategoryNav() {
  const categories = await listCategoriesWithProducts(8);
  return (
    <>
      {categories.map((c) => (
        <Link key={c.slug} href={`/c/${c.slug}`} className="whitespace-nowrap hover:text-brand">
          {c.name}
        </Link>
      ))}
    </>
  );
}

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="bg-brand px-4 py-1.5 text-center text-xs font-medium text-brand-foreground">
        Free shipping on all orders · Cash on Delivery · GST invoice
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-2xl font-bold tracking-tight text-heading">
          W<span className="text-brand">Mart</span>
        </Link>
        <div className="flex-1">
          <SearchBar />
        </div>
        <Link href="/account" aria-label="Account" className="p-2">
          <User className="size-5" />
        </Link>
        <Link href="/cart" className="relative p-2">
          <ShoppingCart className="size-5" aria-hidden />
          <Suspense fallback={<span className="sr-only">Cart</span>}>
            <CartCount />
          </Suspense>
        </Link>
      </div>
      <nav aria-label="Categories" className="mx-auto flex min-h-8 max-w-7xl gap-6 overflow-x-auto px-4 pb-3 text-sm">
        <Suspense fallback={null}>
          <CategoryNav />
        </Suspense>
      </nav>
    </header>
  );
}
