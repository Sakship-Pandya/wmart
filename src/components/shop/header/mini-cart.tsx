"use client";

import { useCallback, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { removeCartItem } from "@/server/actions/cart";
import type { Cart } from "@/server/queries/cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Cart button in the header. Opens a side panel with the cart items, subtotal,
 * View cart and Checkout (the old site's mini-cart). `count` is the server-rendered item bubble.
 */
export function MiniCart({ count, className }: { count: React.ReactNode; className?: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) setCart(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  function remove(productId: string) {
    const fd = new FormData();
    fd.set("productId", productId);
    startTransition(async () => {
      await removeCartItem(fd);
      await load();
      router.refresh();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) void load();
      }}
    >
      <SheetTrigger
        render={
          <button
            type="button"
            className={cn("relative flex size-11 items-center justify-center rounded-full bg-heading text-background transition hover:bg-heading/85", className)}
          />
        }
      >
        <ShoppingCart className="size-5" aria-hidden />
        {count}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg">Shopping cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4" aria-busy={loading || pending}>
          {!cart && loading && (
            <p className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p>
          )}
          {cart && cart.lines.length === 0 && (
            <div className="py-10 text-center">
              <ShoppingCart className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 font-medium text-heading">Your cart is currently empty</p>
              <Link href="/shop" onClick={() => setOpen(false)} className={cn(buttonVariants(), "mt-5 h-10 rounded-full px-6")}>
                Return to shop
              </Link>
            </div>
          )}
          {cart && cart.lines.length > 0 && (
            <ul className={cn("divide-y", pending && "opacity-60")}>
              {cart.lines.map((l) => (
                <li key={l.productId} className="flex gap-3 py-3">
                  <Link href={`/p/${l.slug}`} onClick={() => setOpen(false)} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {l.image && <Image src={l.image.url} alt="" fill sizes="64px" className="object-contain p-1" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/p/${l.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-medium text-heading hover:text-brand">
                      {l.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {l.quantity} × <span className="font-semibold text-brand">{formatPrice(l.price)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.productId)}
                    disabled={pending}
                    aria-label={`Remove ${l.title}`}
                    className="self-start rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.lines.length > 0 && (
          <div className="space-y-3 border-t p-4">
            <div className="flex justify-between text-base">
              <span className="font-semibold text-heading">Subtotal</span>
              <span className="font-bold text-heading">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Free shipping · 18% GST included</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full")}>
                View cart
              </Link>
              <Link href="/checkout" onClick={() => setOpen(false)} className={cn(buttonVariants(), "h-10 rounded-full bg-brand text-brand-foreground hover:bg-brand/85")}>
                Checkout
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
