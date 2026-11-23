"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Previous / next pagination stored in the ?page= URL param. `noun` is plural, e.g. "orders". */
export function ListPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  noun,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  noun: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) {
    return <p className="py-2 text-xs text-muted-foreground">Showing all {totalCount} {noun}</p>;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span> to{" "}
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span> {noun}
      </p>
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <Button variant="outline" size="sm" onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1 || isPending} className="h-8 gap-1 px-2.5 text-xs">
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <span className="px-2 text-xs font-medium">
          {currentPage} <span className="text-muted-foreground">/ {totalPages}</span>
        </span>
        <Button variant="outline" size="sm" onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages || isPending} className="h-8 gap-1 px-2.5 text-xs">
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
