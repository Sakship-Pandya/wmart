import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { NoProducts } from "@/components/shop/no-products";
import {
  listBrandsWithProducts,
  listCategoriesWithProducts,
  listLatestProducts,
} from "@/server/queries/products";

// Home page. Categories, brands and products come from the database, so they always match
// whatever the admin panel / CSV import created.
// TODO (store UI): hero banner, bestsellers, Featured/Sale/New tabs, FAQ, trust badges.
export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-xl bg-muted px-6 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Genuine Laptop Batteries &amp; Adapters
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          For HP, Dell, Lenovo, Asus, Acer, Apple and more — with GST invoice, Cash on Delivery
          and free shipping across India.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shop by category</h2>
        <Suspense fallback={<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>}>
          <CategoryTiles />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shop by brand</h2>
        <Suspense fallback={<Skeleton className="h-9 w-2/3 rounded-full" />}>
          <BrandChips />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">New products</h2>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <LatestProducts />
        </Suspense>
      </section>
    </div>
  );
}

async function CategoryTiles() {
  const categories = await listCategoriesWithProducts(8);
  if (categories.length === 0) {
    return <p className="text-muted-foreground">No categories yet – add products in the admin panel.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {categories.map((c) => (
        <Link key={c.slug} href={`/c/${c.slug}`} className="rounded-lg border p-4 transition hover:border-brand hover:shadow-md">
          <p className="font-medium text-heading">{c.name}</p>
          <p className="text-sm text-muted-foreground">
            {c.count} {c.count === 1 ? "product" : "products"}
          </p>
        </Link>
      ))}
    </div>
  );
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
          className="rounded-full border px-4 py-1.5 text-sm font-medium hover:border-brand hover:text-brand"
        >
          {b.name}
        </Link>
      ))}
    </div>
  );
}

async function LatestProducts() {
  const products = await listLatestProducts(8);
  return (
    <ProductGrid
      products={products}
      empty={
        <NoProducts
          title="No products yet"
          message="Products added in the admin panel or imported from a CSV will appear here."
        />
      }
    />
  );
}
