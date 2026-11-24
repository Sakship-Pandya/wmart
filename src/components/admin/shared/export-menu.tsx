"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** "YYYY-MM-DD" in IST, `daysAgo` days before today. */
export function istDate(daysAgo = 0) {
  return new Date(Date.now() + 5.5 * 3600 * 1000 - daysAgo * 864e5).toISOString().slice(0, 10);
}

export interface ExportOption {
  label: string;
  /** Extra URL params for this file, e.g. { rows: "items" } */
  params?: Record<string, string>;
  primary?: boolean;
}

/**
 * "Export CSV" button with a small menu: a date range (IST, inclusive) plus the page's
 * current filters (the URL params listed in `carry`), and one button per file.
 *
 * Closes when you click outside it, press Esc, pick a download, or change the page's
 * tab / filters.
 */
export function ExportMenu({
  endpoint,
  carry,
  options,
  dateLabel = "",
  defaultFrom = "",
  defaultTo = "",
  allLabel,
}: {
  endpoint: string;
  carry: string[];
  options: ExportOption[];
  /** Shown above the dates, e.g. "Joined between". */
  dateLabel?: string;
  defaultFrom?: string;
  defaultTo?: string;
  /** Hint when no page filters are active, e.g. "All customers". */
  allLabel: string;
}) {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when the status tab or filters change (the URL's search params change).
  const search = searchParams.toString();
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setOpen(false);
  }

  // Close on a click/tap outside the menu, or on Esc.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const href = (extra?: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const name of carry) {
      const v = searchParams.get(name);
      if (v) q.set(name, v);
    }
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    for (const [k, v] of Object.entries(extra ?? {})) q.set(k, v);
    const qs = q.toString();
    return qs ? `${endpoint}?${qs}` : endpoint;
  };

  const filtered = carry.some((n) => searchParams.get(n));
  const menuId = `export-menu-${endpoint.replace(/\W+/g, "-")}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Download className="mr-1.5 size-4" />
        Export CSV
      </button>
      {open && (
        <div id={menuId} className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg">
          {dateLabel && <p className="text-xs font-medium">{dateLabel}</p>}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${menuId}-from`} className="text-xs">From</Label>
              <Input id={`${menuId}-from`} type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${menuId}-to`} className="text-xs">To</Label>
              <Input id={`${menuId}-to`} type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered ? "Uses the filters on this page." : `${allLabel}.`} Leave dates empty for all time.
          </p>
          <div className="flex flex-col gap-2">
            {options.map((o) => (
              <a
                key={o.label}
                href={href(o.params)}
                download
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: o.primary ? "default" : "outline", size: "sm" })}
              >
                {o.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
