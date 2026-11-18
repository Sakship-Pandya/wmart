import Link from "next/link";
import { MessageCircle, PackageSearch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shopCategories, whatsappUrl } from "@/lib/site";
import { SearchBar } from "./search-bar";

// Shown instead of an empty grid (or a 404) when there are no products to list.
export function NoProducts({
  title = "No products to show yet",
  message = "We couldn't find any products here right now. Try searching by your laptop model or part number, or browse another category.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl bg-muted px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-background text-brand">
        <PackageSearch className="size-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">{message}</p>

      <div className="mt-6 w-full max-w-md text-left">
        <SearchBar />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {shopCategories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-full border bg-background px-4 py-1.5 text-sm font-medium hover:border-brand hover:text-brand"
          >
            {c.label}
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">Can&apos;t find the part you need?</p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline" }), "mt-2 rounded-full px-5")}
      >
        <MessageCircle data-icon="inline-start" />
        Ask us on WhatsApp
      </a>
    </div>
  );
}
