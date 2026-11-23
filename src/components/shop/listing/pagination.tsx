import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { listingHref, type Query } from "@/lib/listing-url";

/** 1 2 3 … 39 40 41 → numbered pages, like the old site. */
export function Pagination({ pathname, query, page, pageCount }: { pathname: string; query: Query; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => listingHref(pathname, query, { page: p === 1 ? undefined : String(p) });

  const pages: (number | "gap")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages.at(-1) !== "gap") pages.push("gap");
  }

  const item = "flex size-10 items-center justify-center rounded-full text-sm font-medium";
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-1.5 pt-8">
      {page > 1 && (
        <Link href={href(page - 1)} aria-label="Previous page" className={cn(item, "border hover:border-brand hover:text-brand")}>
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className={cn(item, "text-muted-foreground")} aria-hidden>…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-brand text-brand-foreground" : "border hover:border-brand hover:text-brand")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link href={href(page + 1)} aria-label="Next page" className={cn(item, "border hover:border-brand hover:text-brand")}>
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
