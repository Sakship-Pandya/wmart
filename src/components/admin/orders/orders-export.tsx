"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** "YYYY-MM-DD" in IST, `daysAgo` days before today. */
function istDate(daysAgo = 0) {
  return new Date(Date.now() + 5.5 * 3600 * 1000 - daysAgo * 864e5).toISOString().slice(0, 10);
}

/**
 * Export menu on the Orders page: date range (IST, inclusive) plus the page's current
 * status / payment / search filters. Two files: one row per order, or one row per product line.
 */
export function OrdersExport() {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(istDate(29));
  const [to, setTo] = useState(istDate(0));

  const href = (rows?: "items") => {
    const q = new URLSearchParams();
    for (const name of ["status", "payment", "method", "q"]) {
      const v = searchParams.get(name);
      if (v) q.set(name, v);
    }
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (rows) q.set("rows", rows);
    return `/api/admin/export/orders?${q.toString()}`;
  };

  const filtered = ["status", "payment", "method", "q"].some((n) => searchParams.get(n));

  return (
    <details className="group relative">
      <summary className={`${buttonVariants({ variant: "outline", size: "sm" })} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        <Download className="mr-1.5 size-4" />
        Export CSV
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="export-from" className="text-xs">From</Label>
            <Input id="export-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="export-to" className="text-xs">To</Label>
            <Input id="export-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered ? "Uses the filters on this page." : "All orders in this date range."} Leave dates empty for all time.
        </p>
        <div className="flex flex-col gap-2">
          <a href={href()} download className={buttonVariants({ size: "sm" })}>
            Orders (one row per order)
          </a>
          <a href={href("items")} download className={buttonVariants({ variant: "outline", size: "sm" })}>
            Order items (HSN / GST lines)
          </a>
        </div>
      </div>
    </details>
  );
}
