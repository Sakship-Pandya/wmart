"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Power, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteCoupon, setCouponActive } from "@/server/actions/admin/coupons";

export function CouponRowActions({ id, code, isActive }: { id: string; code: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });

  return (
    <div className="flex justify-end gap-1">
      <Link href={`/admin/coupons/${id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={`Edit ${code}`}>
        <Pencil className="size-4" />
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isActive ? `Disable ${code}` : `Enable ${code}`}
        title={isActive ? "Disable" : "Enable"}
        disabled={isPending}
        onClick={() =>
          run(async () => {
            await setCouponActive(id, !isActive);
            toast.success(isActive ? `${code} disabled` : `${code} enabled`);
          })
        }
      >
        <Power className={isActive ? "size-4 text-success" : "size-4 text-muted-foreground"} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${code}`}
        title="Delete"
        disabled={isPending}
        onClick={() => {
          if (!confirm(`Delete coupon ${code}? If orders already used it, it will be disabled instead.`)) return;
          run(async () => {
            const res = await deleteCoupon(id);
            toast.success(res.disabled ? `${code} was used by ${res.used} order(s), so it was disabled instead` : `${code} deleted`);
          });
        }}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}
