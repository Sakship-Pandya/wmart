"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ProductTab = { id: string; label: string; content: ReactNode; href: string };

/** Home page product tabs (like the old site's Featured / Sale / New). Each tab's grid is rendered on the server. */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Products" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={t.id === current.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition",
                t.id === current.id ? "bg-heading text-background" : "bg-muted text-heading hover:bg-accent",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link href={current.href} className="text-sm font-medium text-brand hover:underline">
          View all →
        </Link>
      </div>
      <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`}>
        {current.content}
      </div>
    </div>
  );
}
