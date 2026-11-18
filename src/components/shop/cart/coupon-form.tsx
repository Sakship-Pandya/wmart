"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { applyCoupon, type CartActionState } from "@/server/actions/cart";

const idle: CartActionState = { status: "idle" };

export function CouponForm() {
  const [state, action, pending] = useActionState(applyCoupon, idle);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="coupon" className="text-sm font-medium text-heading">Coupon code</label>
      <div className="flex gap-2">
        <Input
          id="coupon"
          name="coupon"
          autoComplete="off"
          placeholder="e.g. ONLINE10"
          className="h-10 rounded-full px-4 uppercase focus-visible:border-brand focus-visible:ring-brand/20"
        />
        <Button type="submit" variant="outline" disabled={pending} className="h-10 rounded-full px-5">
          Apply
        </Button>
      </div>
      {state.message && (
        <p role="status" className={cn("text-sm", state.status === "error" ? "text-destructive" : "text-success")}>
          {state.message}
        </p>
      )}
    </form>
  );
}
