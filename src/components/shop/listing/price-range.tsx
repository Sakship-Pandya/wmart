"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

// Two-handle price slider (like the old site's "Filter by price"). Values are in rupees.
export function PriceRange({
  bounds,
  value,
  onApply,
  disabled,
}: {
  bounds: { min: number; max: number };
  value: { min?: number; max?: number };
  onApply: (min: number | undefined, max: number | undefined) => void;
  disabled?: boolean;
}) {
  const step = bounds.max - bounds.min > 5000 ? 100 : 10;
  const [lo, setLo] = useState(value.min ?? bounds.min);
  const [hi, setHi] = useState(value.max ?? bounds.max);
  if (bounds.max <= bounds.min) return null;

  const pct = (v: number) => ((v - bounds.min) / (bounds.max - bounds.min)) * 100;
  const changed = lo !== (value.min ?? bounds.min) || hi !== (value.max ?? bounds.max);
  const thumb =
    "pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-brand";

  return (
    <div className="space-y-3">
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-2 h-1 rounded-full bg-muted" />
        <div className="absolute top-2 h-1 rounded-full bg-brand" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          aria-label="Minimum price"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={lo}
          disabled={disabled}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - step))}
          className={thumb}
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={hi}
          disabled={disabled}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + step))}
          className={thumb}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {formatPrice(lo * 100)} – {formatPrice(hi * 100)}
        </p>
        <button
          type="button"
          disabled={disabled || !changed}
          onClick={() => onApply(lo <= bounds.min ? undefined : lo, hi >= bounds.max ? undefined : hi)}
          className="rounded-full bg-heading px-4 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
        >
          Filter
        </button>
      </div>
    </div>
  );
}
