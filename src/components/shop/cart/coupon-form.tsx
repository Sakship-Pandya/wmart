"use client";

import { useActionState, useTransition } from "react";
import { TicketPercent, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { applyCoupon, removeCoupon, type CartActionState } from "@/server/actions/cart";
import type { AppliedCoupon } from "@/server/coupons";

const idle: CartActionState = { status: "idle" };

/** Coupon box in the cart. Shows the applied code (with Remove) or the field to enter one. */
export function CouponForm({ applied }: { applied?: AppliedCoupon | null }) {
  const [state, action, pending] = useActionState(applyCoupon, idle);
  const [removing, startRemove] = useTransition();

  if (applied) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-3 text-sm",
          applied.ok ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/5",
        )}
      >
        <TicketPercent className={cn("mt-0.5 size-5 shrink-0", applied.ok ? "text-success" : "text-destructive")} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-heading">
            <span className="font-mono">{applied.code}</span> {applied.ok ? "applied" : "can't be used"}
          </p>
          <p className={applied.ok ? "text-muted-foreground" : "text-destructive"}>{applied.ok ? applied.summary : applied.problem}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={removing}
          onClick={() => startRemove(() => removeCoupon())}
          className="h-8 shrink-0 rounded-full px-2.5"
        >
          <X className="mr-1 size-3.5" />
          Remove
        </Button>
      </div>
    );
  }

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
          {pending ? "Checking…" : "Apply"}
        </Button>
      </div>
      {state.status === "error" && state.message && (
        <p role="status" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
