"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FilterSelect {
  /** URL search param name, e.g. "payment" */
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Value that means "no filter" (removed from the URL). Defaults to "". */
  defaultValue?: string;
}

/**
 * Search box + dropdown filters that keep their state in the URL, like the products page.
 * Params listed in `keep` (e.g. the status tab) survive "Clear filters".
 */
export function ListFilters({
  placeholder,
  selects = [],
  keep = [],
}: {
  placeholder: string;
  selects?: FilterSelect[];
  keep?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams.get("q") ?? "";
  const hasFilters =
    !!currentQ || selects.some((s) => (searchParams.get(s.param) ?? s.defaultValue ?? "") !== (s.defaultValue ?? ""));

  function push(params: URLSearchParams) {
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function setParam(name: string, value: string, defaultValue = "") {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === defaultValue) params.delete(name);
    else params.set(name, value);
    push(params);
  }

  function clearAll() {
    const params = new URLSearchParams();
    for (const k of keep) {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    }
    push(params);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-xs md:flex-row md:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", String(new FormData(e.currentTarget).get("q") ?? "").trim());
        }}
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input key={currentQ} name="q" defaultValue={currentQ} placeholder={placeholder} className="pl-9 pr-16" />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          disabled={isPending}
          className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2.5 text-xs"
        >
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {selects.map((s) => (
          <select
            key={s.param}
            aria-label={s.label}
            value={searchParams.get(s.param) ?? s.defaultValue ?? ""}
            onChange={(e) => setParam(s.param, e.target.value, s.defaultValue)}
            disabled={isPending}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={isPending}
            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
