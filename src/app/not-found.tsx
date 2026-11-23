import Link from "next/link";
import { SearchX } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { SearchBar } from "@/components/shop/search-bar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Site-wide "page not found" (any address that doesn't exist), with the normal store header and footer.
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <SearchX className="size-8" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand">Error 404</p>
        <h1 className="mt-2 text-3xl font-bold">We couldn&apos;t find that page</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          The link may be old or mistyped. Search for your laptop model or part number, or head back to the shop.
        </p>
        <div className="mt-6 w-full max-w-md text-left">
          <SearchBar />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className={cn(buttonVariants(), "h-10 rounded-full px-6")}>Go to home page</Link>
          <Link href="/shop" className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full px-6")}>Browse all products</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
