import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { NoProducts } from "@/components/shop/no-products";
import { SearchBar } from "@/components/shop/search-bar";
import { ProductTabs, type ProductTab } from "@/components/shop/home/product-tabs";
import {
  listBestDeals,
  listBrandsWithProducts,
  listCategoriesWithProducts,
  listLatestProducts,
  listProductsInCategory,
} from "@/server/queries/products";
import { cn } from "@/lib/utils";
import { business } from "@/lib/site";

// Home page. Categories, brands and products come from the database, so they always match
// whatever the admin panel / CSV import created.
// TODO (store UI): hero slider with several banners (needs banner images + an admin screen for them).

const trust = [
  { icon: Truck, title: "Free shipping", text: "On every order, across India" },
  { icon: BadgeIndianRupee, title: "Cash on Delivery", text: "Or pay online with PayU" },
  { icon: ShieldCheck, title: "18% GST invoice", text: "With every order" },
  { icon: RotateCcw, title: `${business.returnWindowDays}-day easy returns`, text: "Replacement within warranty" },
  { icon: MessageCircle, title: "WhatsApp support", text: "We confirm compatibility" },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl bg-heading px-6 py-12 text-background sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="relative max-w-2xl space-y-5">
          <p className="inline-flex rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-foreground">
            Genuine &amp; tested parts
          </p>
          <h1 className="text-3xl font-bold leading-tight text-background sm:text-5xl">
            Shop great deals on laptop batteries, adapters and more.
          </h1>
          <p className="text-base text-background/75 sm:text-lg">
            For HP, Dell, Lenovo, Asus, Acer, Apple and more – with GST invoice, Cash on Delivery and free shipping across India.
          </p>
          <div className="max-w-lg text-heading">
            <SearchBar />
          </div>
          <Suspense fallback={<Skeleton className="h-11 w-72 rounded-full bg-background/20" />}>
            <HeroButtons />
          </Suspense>
        </div>
      </section>

      <section aria-label="Why shop with WMart" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {trust.map((t) => (
          <div key={t.title} className="flex items-center gap-3 rounded-2xl bg-muted p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-brand">
              <t.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-heading">{t.title}</span>
              <span className="block text-xs text-muted-foreground">{t.text}</span>
            </span>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Shop by category</h2>
        <Suspense fallback={<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>}>
          <CategoryTiles />
        </Suspense>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Products</h2>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <HomeProductTabs />
        </Suspense>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Shop by brand</h2>
        <Suspense fallback={<Skeleton className="h-11 w-2/3 rounded-full" />}>
          <BrandChips />
        </Suspense>
      </section>
    </div>
  );
}

async function HeroButtons() {
  const top = await listCategoriesWithProducts(2);
  return (
    <div className="flex flex-wrap gap-3">
      {top.map((c, i) => (
        <Link
          key={c.slug}
          href={`/c/${c.slug}`}
          className={cn(
            buttonVariants(),
            "h-11 rounded-full px-6 text-base font-semibold",
            i === 0 ? "bg-brand text-brand-foreground hover:bg-brand/85" : "bg-background text-heading hover:bg-background/85",
          )}
        >
          Shop {c.name} <ArrowRight data-icon="inline-end" />
        </Link>
      ))}
    </div>
  );
}

async function CategoryTiles() {
  const categories = await listCategoriesWithProducts(8);
  if (categories.length === 0) {
    return <p className="text-muted-foreground">No categories yet – add products in the admin panel.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => (
        <Link key={c.slug} href={`/c/${c.slug}`} className="group rounded-2xl border p-5 transition hover:border-brand hover:shadow-md">
          <p className="font-semibold text-heading group-hover:text-brand">{c.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.count} {c.count === 1 ? "product" : "products"}
          </p>
        </Link>
      ))}
    </div>
  );
}

async function HomeProductTabs() {
  const [latest, deals, topCategories] = await Promise.all([listLatestProducts(8), listBestDeals(8), listCategoriesWithProducts(2)]);
  if (latest.length === 0) {
    return <NoProducts title="No products yet" message="Products added in the admin panel or imported from a CSV will appear here." />;
  }
  const perCategory = await Promise.all(topCategories.map((c) => listProductsInCategory(c.slug, 8)));

  const tabs: ProductTab[] = [{ id: "new", label: "New arrivals", content: <ProductGrid products={latest} />, href: "/shop?sort=latest" }];
  if (deals.length > 0) tabs.push({ id: "deals", label: "Best deals", content: <ProductGrid products={deals} />, href: "/shop?sort=discount" });
  topCategories.forEach((c, i) => {
    if (perCategory[i].length > 0) tabs.push({ id: c.slug, label: c.name, content: <ProductGrid products={perCategory[i]} />, href: `/c/${c.slug}` });
  });
  return <ProductTabs tabs={tabs} />;
}

async function BrandChips() {
  const brands = await listBrandsWithProducts();
  if (brands.length === 0) return <p className="text-muted-foreground">No brands yet.</p>;
  return (
    <div className="flex flex-wrap gap-3">
      {brands.map((b) => (
        <Link
          key={b.slug}
          href={`/brand/${b.slug}`}
          className="rounded-full border px-5 py-2 text-sm font-semibold text-heading transition hover:border-brand hover:text-brand"
        >
          {b.name}
          <span className="ml-2 text-xs font-normal text-muted-foreground">{b.count}</span>
        </Link>
      ))}
    </div>
  );
}
