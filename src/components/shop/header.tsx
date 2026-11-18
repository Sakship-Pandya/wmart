import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { getCartCount } from "@/server/queries/cart";
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

const nav = [
  { href: "/c/laptop-batteries", label: "Batteries" },
  { href: "/c/laptop-adapters", label: "Adapters" },
  { href: "/c/power-cables", label: "Power Cables" },
  { href: "/c/accessories", label: "Accessories" },
];

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
      <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 pb-3 text-sm">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap hover:underline">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
