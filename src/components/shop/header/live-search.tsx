"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Suggestion = { slug: string; title: string; brand: string; price: number; image: string | null };

/**
 * Header search with live results while typing (like the old site).
 * Enter or the orange button opens the full results page; arrow keys move through suggestions.
 */
export function LiveSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions 250 ms after the customer stops typing.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) {
          setResults(await res.json());
          setActive(-1);
          setOpen(true);
        }
      } catch {
        // aborted or offline – keep the previous suggestions
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close when clicking outside.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const showList = open && query.trim().length >= 2;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (active >= 0 && results[active]) {
      router.push(`/p/${results[active].slug}`);
    } else if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
    setOpen(false);
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form role="search" action="/search" onSubmit={submit} className="relative">
        <input
          name="q"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) setOpen(false);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search by laptop model or part number, e.g. HS04"
          aria-label="Search products"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="h-11 w-full rounded-full border bg-background pr-14 pl-5 text-sm outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/20 [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand/85"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </button>
      </form>

      {showList && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{loading ? "Searching…" : "No products found."}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Suggestions">
              {results.map((r, i) => (
                <li key={r.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={`/p/${r.slug}`}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex items-center gap-3 px-4 py-2.5", i === active && "bg-muted")}
                  >
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {r.image && <Image src={r.image} alt="" fill sizes="44px" className="object-contain p-0.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-medium text-heading">{r.title}</span>
                      <span className="text-xs text-muted-foreground">{r.brand}</span>
                    </span>
                    <span className="text-sm font-bold text-brand">{formatPrice(r.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && (
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setOpen(false)}
              className="block border-t px-4 py-2.5 text-sm font-medium text-brand hover:bg-muted"
            >
              See all results for “{query.trim()}”
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
