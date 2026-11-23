"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCoupon, updateCoupon } from "@/server/actions/admin/coupons";
import type { CouponFormValues } from "@/lib/validations/coupon";

export interface CouponInitial {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number; // percent, or paise for FLAT
  minOrderValue: number | null; // paise
  maxDiscount: number | null; // paise
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  isActive: boolean;
}

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

/** Date -> "YYYY-MM-DD" in IST, for <input type="date">. */
function toDateInput(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));

export function CouponForm({ initial }: { initial?: CouponInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"PERCENT" | "FLAT">(initial?.type ?? "PERCENT");
  const [code, setCode] = useState(initial?.code ?? "");

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    setCode(`WM${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const starts = get("startsAt");
    const expires = get("expiresAt");

    const values: CouponFormValues = {
      code,
      type,
      value: Number(get("value")),
      minOrderValue: num(get("minOrderValue")),
      maxDiscount: type === "PERCENT" ? num(get("maxDiscount")) : null,
      // Start of the day / end of the day in India time.
      startsAt: starts ? new Date(`${starts}T00:00:00+05:30`) : null,
      expiresAt: expires ? new Date(`${expires}T23:59:59+05:30`) : null,
      usageLimit: num(get("usageLimit")),
      perCustomerLimit: num(get("perCustomerLimit")),
      isActive: f.get("isActive") === "on",
    };

    startTransition(async () => {
      try {
        if (initial) {
          await updateCoupon(initial.id, values);
          toast.success("Coupon updated");
        } else {
          await createCoupon(values);
          toast.success("Coupon created");
        }
        router.push("/admin/coupons");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save the coupon");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Coupon</h2>
        <div className="space-y-1.5">
          <Label htmlFor="code">Coupon code</Label>
          <div className="flex gap-2">
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" className="font-mono uppercase" required maxLength={30} />
            <Button type="button" variant="outline" onClick={generateCode} disabled={isPending}>
              <Shuffle className="mr-1.5 size-4" /> Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Customers type this at checkout. Letters, numbers, - and _ only.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Discount type</Label>
            <select id="type" className={fieldClass} value={type} onChange={(e) => setType(e.target.value as "PERCENT" | "FLAT")}>
              <option value="PERCENT">Percentage discount</option>
              <option value="FLAT">Fixed amount (₹)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="value">{type === "PERCENT" ? "Discount (%)" : "Discount (₹)"}</Label>
            <Input
              id="value"
              name="value"
              type="number"
              required
              min={type === "PERCENT" ? 1 : 1}
              max={type === "PERCENT" ? 100 : undefined}
              step={type === "PERCENT" ? 1 : 0.01}
              defaultValue={initial ? (initial.type === "FLAT" ? initial.value / 100 : initial.value) : ""}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Conditions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="minOrderValue">Minimum order (₹)</Label>
            <Input id="minOrderValue" name="minOrderValue" type="number" min={0} step={0.01} placeholder="No minimum" defaultValue={initial?.minOrderValue != null ? initial.minOrderValue / 100 : ""} />
          </div>
          {type === "PERCENT" && (
            <div className="space-y-1.5">
              <Label htmlFor="maxDiscount">Maximum discount (₹)</Label>
              <Input id="maxDiscount" name="maxDiscount" type="number" min={0} step={0.01} placeholder="No cap" defaultValue={initial?.maxDiscount != null ? initial.maxDiscount / 100 : ""} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="startsAt">Starts on</Label>
            <Input id="startsAt" name="startsAt" type="date" defaultValue={toDateInput(initial?.startsAt ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">Expires on (end of day)</Label>
            <Input id="expiresAt" name="expiresAt" type="date" defaultValue={toDateInput(initial?.expiresAt ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usageLimit">Total uses allowed</Label>
            <Input id="usageLimit" name="usageLimit" type="number" min={1} step={1} placeholder="Unlimited" defaultValue={initial?.usageLimit ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perCustomerLimit">Uses per customer</Label>
            <Input id="perCustomerLimit" name="perCustomerLimit" type="number" min={1} step={1} placeholder="Unlimited" defaultValue={initial?.perCustomerLimit ?? ""} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="size-4 accent-primary" />
          Active (customers can use it)
        </label>
      </section>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial ? "Save changes" : "Create coupon"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/coupons")} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
