import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shop/page-header";
import { CartLineControls } from "@/components/shop/cart/cart-line-controls";
import { CouponForm } from "@/components/shop/cart/coupon-form";
import { OrderSummaryTotals } from "@/components/shop/cart/order-summary";
import { getCart } from "@/server/queries/cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: true } };

export default function CartPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Your cart" />
      <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
        <CartContents />
      </Suspense>
    </div>
  );
}

async function CartContents() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-muted px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-background text-brand">
          <ShoppingCart className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Your cart is currently empty</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Find the right battery, adapter or cable by searching for your laptop model or part number.
        </p>
        <Link href="/" className={cn(buttonVariants(), "mt-6 h-10 rounded-full px-6 text-base font-semibold")}>
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y rounded-2xl border">
        {cart.lines.map((line) => (
          // The whole row opens the product (the title link stretches over it); the quantity controls sit above it.
          <li key={line.productId} className="group relative flex cursor-pointer gap-4 p-4 transition hover:bg-muted/40">
            <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
              {line.image && (
                <Image src={line.image.url} alt="" fill sizes="96px" className="object-contain p-1.5" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">{line.brand}</p>
                <Link href={`/p/${line.slug}`} className="line-clamp-2 font-medium text-heading group-hover:text-brand outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-brand/60">
                  {line.title}
                </Link>
                <p className="text-sm">
                  <span className="font-semibold text-brand">{formatPrice(line.price)}</span>
                  {line.mrp > line.price && (
                    <span className="ml-2 text-muted-foreground line-through">{formatPrice(line.mrp)}</span>
                  )}
                </p>
                <div className="relative z-10 w-fit cursor-default">
                  <CartLineControls key={`${line.productId}-${line.quantity}`} productId={line.productId} quantity={line.quantity} stock={line.stock} />
                </div>
              </div>
              <p className="shrink-0 font-bold text-heading sm:text-right">{formatPrice(line.lineTotal)}</p>
            </div>
          </li>
        ))}
      </ul>

      <aside className="space-y-5 rounded-2xl bg-muted p-6 lg:sticky lg:top-6">
        <h2 className="text-lg font-bold">Order summary</h2>
        <OrderSummaryTotals cart={cart} />
        <CouponForm applied={cart.coupon} />
        <Link
          href="/checkout"
          className={cn(buttonVariants(), "h-11 w-full rounded-full bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/85")}
        >
          Proceed to checkout
          <ArrowRight data-icon="inline-end" />
        </Link>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><Truck className="size-4" /> Free shipping with Delhivery</li>
          <li className="flex items-center gap-2"><ShieldCheck className="size-4" /> Pay online with PayU or Cash on Delivery</li>
        </ul>
      </aside>
    </div>
  );
}
