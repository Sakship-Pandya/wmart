"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Download link to a CSV export that carries the page's current filters (the listed URL params). */
export function ExportLink({ endpoint, params, label = "Export CSV" }: { endpoint: string; params: string[]; label?: string }) {
  const searchParams = useSearchParams();
  const query = new URLSearchParams();
  for (const name of params) {
    const value = searchParams.get(name);
    if (value) query.set(name, value);
  }
  const qs = query.toString();
  return (
    <a href={qs ? `${endpoint}?${qs}` : endpoint} className={buttonVariants({ variant: "outline", size: "sm" })} download>
      <Download className="mr-1.5 size-4" />
      {label}
    </a>
  );
}
