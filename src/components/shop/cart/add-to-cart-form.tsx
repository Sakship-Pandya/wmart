"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart, buyNow, type CartActionState } from "@/server/actions/cart";
import { QuantityStepper } from "./quantity-stepper";
import { cn } from "@/lib/utils";

const idle: CartActionState = { status: "idle" };

// Product page: quantity, Add To Cart and Buy Now (straight to checkout) – same as the old site.
export function AddToCartForm({
  productId,
  stock,
  layout = "inline",
}: {
  productId: string;
  stock: number;
  /** "inline": quantity and both buttons in one row (product page). "stacked": quantity on top, buttons side by side below (quick view). */
  layout?: "inline" | "stacked";
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [addState, addAction, adding] = useActionState(addToCart, idle);
  const [buyState, buyAction, buying] = useActionState(buyNow, idle);
  const outOfStock = stock <= 0;
  const busy = adding || buying;

  useEffect(() => {
    if (addState.status === "success") {
      toast.success(addState.message, { action: { label: "View cart", onClick: () => router.push("/cart") } });
    } else if (addState.status === "error") {
      toast.error(addState.message);
    }
  }, [addState, router]);

  useEffect(() => {
    if (buyState.status === "error") toast.error(buyState.message);
  }, [buyState]);

  if (outOfStock) {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
        Out of stock – ask us on WhatsApp when it&apos;s back.
      </p>
    );
  }

  return (
    <form action={addAction} className={layout === "stacked" ? "grid grid-cols-2 gap-3" : "flex flex-wrap items-center gap-3"}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <div className={layout === "stacked" ? "col-span-2" : undefined}>
        <QuantityStepper value={quantity} onChange={setQuantity} max={Math.min(stock, 99)} disabled={busy} />
      </div>
      <Button type="submit" disabled={busy} className={cn("h-10 rounded-full px-6 text-base font-semibold", layout === "stacked" ? "w-full" : "flex-1 sm:flex-none")}>
        <ShoppingCart data-icon="inline-start" />
        {adding ? "Adding…" : "Add To Cart"}
      </Button>
      <Button
        type="submit"
        formAction={buyAction}
        disabled={busy}
        className={cn(
          "h-10 rounded-full bg-brand px-6 text-base font-semibold text-brand-foreground hover:bg-brand/85",
          layout === "stacked" ? "w-full" : "flex-1 sm:flex-none",
        )}
      >
        <Zap data-icon="inline-start" />
        {buying ? "Please wait…" : "Buy Now"}
      </Button>
    </form>
  );
}
