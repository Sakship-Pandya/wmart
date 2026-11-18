"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeCartItem, updateCartItem } from "@/server/actions/cart";
import { QuantityStepper } from "./quantity-stepper";

// Quantity box + remove button for one cart line. Changes are saved straight away.
export function CartLineControls({ productId, quantity, stock }: { productId: string; quantity: number; stock: number }) {
  const [value, setValue] = useState(quantity);
  const [pending, startTransition] = useTransition();

  function save(next: number) {
    setValue(next);
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("quantity", String(next));
    startTransition(() => updateCartItem(fd));
  }

  function remove() {
    const fd = new FormData();
    fd.set("productId", productId);
    startTransition(() => removeCartItem(fd));
  }

  return (
    <div className="flex items-center gap-3" aria-busy={pending}>
      <QuantityStepper value={value} onChange={save} max={Math.min(stock, 99)} size="sm" disabled={pending} />
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-4" />
        Remove
      </button>
    </div>
  );
}
