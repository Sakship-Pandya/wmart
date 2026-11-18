import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { SearchBar } from "./search-bar";

const nav = [
  { href: "/c/laptop-batteries", label: "Batteries" },
  { href: "/c/laptop-adapters", label: "Adapters" },
  { href: "/c/power-cables", label: "Power Cables" },
  { href: "/c/accessories", label: "Accessories" },
];

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="bg-primary px-4 py-1.5 text-center text-xs text-primary-foreground">
        Free shipping on all orders · Cash on Delivery · GST invoice
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          WMart
        </Link>
        <div className="flex-1">
          <SearchBar />
        </div>
        <Link href="/account" aria-label="Account" className="p-2">
          <User className="size-5" />
        </Link>
        <Link href="/cart" aria-label="Cart" className="p-2">
          <ShoppingCart className="size-5" />
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
