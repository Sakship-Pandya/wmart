import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { NoProducts } from "@/components/shop/no-products";
import { SearchBar } from "@/components/shop/search-bar";
import { ProductTabs, type ProductTab } from "@/components/shop/home/product-tabs";
import { HeroCarousel } from "@/components/shop/home/hero-carousel";
import {
  listBestDeals,
  listBrandsWithProducts,
  listCategoriesWithProducts,
  listHeroDealSlides,
  listLatestProducts,
  listProductsInCategory,
  type HeroDealSlide,
} from "@/server/queries/products";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { business } from "@/lib/site";
import { discountPercent, formatPrice } from "@/lib/format";

// Home page. Categories, brands, products and the hero deal slides come from the database,
// so they always match whatever the admin panel / CSV import created.

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
      <Suspense fallback={<WelcomeSlide buttons={<Skeleton className="h-11 w-72 rounded-full bg-background/20" />} />}>
        <HomeHero />
      </Suspense>

      <section aria-label="Why shop with WMart" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {trust.map((t) => (
          <div key={t.title} className="flex items-center gap-3 rounded-2xl bg-brand/10 p-4">
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

/** Rotating hero: the welcome slide, then one slide per category with real discounts (live data). */
async function HomeHero() {
  const [deals, top] = await Promise.all([listHeroDealSlides(4), listCategoriesWithProducts(2)]);
  return (
    <HeroCarousel labels={["Welcome to WMart", ...deals.map((d) => `${d.category.name} – up to ${d.maxDiscount}% off`)]}>
      <WelcomeSlide buttons={<HeroButtons top={top} />} />
      {deals.map((d) => (
        <DealSlide key={d.category.slug} deal={d} />
      ))}
    </HeroCarousel>
  );
}

const slideBox = "relative flex h-full flex-col justify-center overflow-hidden rounded-3xl bg-heading px-6 py-9 text-background sm:px-10 sm:py-11";

function WelcomeSlide({ buttons }: { buttons: React.ReactNode }) {
  return (
    <div className={slideBox}>
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand/30 blur-3xl" />
      <div className="relative max-w-2xl space-y-4">
        <p className="inline-flex rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-foreground">
          Genuine &amp; tested parts
        </p>
        <h1 className="text-2xl font-bold leading-tight text-background sm:text-4xl">
          Shop great deals on laptop batteries, adapters and more.
        </h1>
        <p className="text-sm text-background/75 sm:text-base">
          For HP, Dell, Lenovo, Asus, Acer, Apple and more – with GST invoice, Cash on Delivery and free shipping across India.
        </p>
        <div className="max-w-lg text-heading">
          <SearchBar />
        </div>
        {buttons}
      </div>
    </div>
  );
}

function DealSlide({ deal }: { deal: HeroDealSlide }) {
  const brands = deal.brands.slice(0, 3).join(", ") + (deal.brands.length > 3 ? " & more" : "");
  const productOff = discountPercent(deal.product.mrp, deal.product.price);
  return (
    <div className={slideBox}>
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-brand/25 blur-3xl" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <p className="inline-flex rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-foreground">
            Up to {deal.maxDiscount}% off
          </p>
          <h2 className="text-2xl font-bold leading-tight text-background sm:text-4xl">{deal.category.name} on sale</h2>
          <p className="text-sm text-background/75 sm:text-base">
            {deal.onSale} {deal.onSale === 1 ? "product" : "products"} on sale, from {formatPrice(deal.fromPrice)} – {brands}. 18% GST
            included, free shipping and Cash on Delivery.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/c/${deal.category.slug}?sort=discount`}
              className={cn(buttonVariants(), "h-11 rounded-full bg-brand px-6 text-base font-semibold text-brand-foreground hover:bg-brand/85")}
            >
              Shop the deals <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href={`/c/${deal.category.slug}`}
              className={cn(buttonVariants(), "h-11 rounded-full bg-background px-6 text-base font-semibold text-heading hover:bg-background/85")}
            >
              All {deal.category.name}
            </Link>
          </div>
        </div>

        <Link
          href={`/p/${deal.product.slug}`}
          className="group hidden w-full max-w-sm items-center gap-4 justify-self-end rounded-2xl bg-background p-4 text-heading shadow-xl transition hover:-translate-y-0.5 md:flex lg:flex-col lg:items-stretch"
        >
          <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-muted lg:aspect-auto lg:h-32 lg:w-full">
            {deal.product.image && (
              <Image src={deal.product.image} alt="" fill sizes="(min-width: 1024px) 360px, 112px" className="object-contain p-3 transition group-hover:scale-105" />
            )}
            {productOff > 0 && (
              <span className="absolute top-2 left-2 rounded-full bg-sale-badge px-2 py-0.5 text-xs font-bold text-background">-{productOff}%</span>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Biggest discount</p>
            <p className="line-clamp-2 font-semibold group-hover:text-brand">{deal.product.title}</p>
            <p>
              <span className="text-lg font-bold text-brand">{formatPrice(deal.product.price)}</span>
              <span className="ml-2 text-sm text-muted-foreground line-through">{formatPrice(deal.product.mrp)}</span>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function HeroButtons({ top }: { top: { name: string; slug: string }[] }) {
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
