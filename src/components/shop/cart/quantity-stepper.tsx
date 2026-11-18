"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// − [ 2 ] + quantity box, like the old site's product page.
export function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  disabled,
  label = "Quantity",
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? Math.round(n) : min));
  const btn = cn(
    "flex items-center justify-center text-muted-foreground transition hover:text-brand disabled:opacity-40 disabled:hover:text-muted-foreground",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div className={cn("inline-flex items-center rounded-full border", disabled && "opacity-60")} role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
        className={cn(
          "w-10 bg-transparent text-center font-semibold text-heading outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          size === "sm" ? "h-8 text-sm" : "h-10",
        )}
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
