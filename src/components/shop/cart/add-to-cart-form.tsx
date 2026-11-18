"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart, buyNow, type CartActionState } from "@/server/actions/cart";
import { QuantityStepper } from "./quantity-stepper";

const idle: CartActionState = { status: "idle" };

// Product page: quantity, Add To Cart and Buy Now (straight to checkout) – same as the old site.
export function AddToCartForm({ productId, stock }: { productId: string; stock: number }) {
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
    <form action={addAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <QuantityStepper value={quantity} onChange={setQuantity} max={Math.min(stock, 99)} disabled={busy} />
      <Button type="submit" disabled={busy} className="h-10 flex-1 rounded-full px-6 text-base font-semibold sm:flex-none">
        <ShoppingCart data-icon="inline-start" />
        {adding ? "Adding…" : "Add To Cart"}
      </Button>
      <Button
        type="submit"
        formAction={buyAction}
        disabled={busy}
        className="h-10 flex-1 rounded-full bg-brand px-6 text-base font-semibold text-brand-foreground hover:bg-brand/85 sm:flex-none"
      >
        <Zap data-icon="inline-start" />
        {buying ? "Please wait…" : "Buy Now"}
      </Button>
    </form>
  );
}
