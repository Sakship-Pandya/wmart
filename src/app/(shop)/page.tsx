import Link from "next/link";

const categories = [
  { href: "/c/laptop-batteries", title: "Laptop Batteries", note: "2,700+ models" },
  { href: "/c/laptop-adapters", title: "Laptop Adapters", note: "Original chargers" },
  { href: "/c/power-cables", title: "Power Cables", note: "Laptop & desktop" },
  { href: "/c/accessories", title: "Accessories", note: "Keyboards & more" },
];

const brands = ["hp", "dell", "lenovo", "asus", "acer", "apple"];

// Home page. TODO (store UI): hero banner, bestsellers, brand tabs, FAQ, trust badges.
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.href} href={c.href} className="rounded-lg border p-4 hover:shadow-md">
              <p className="font-medium">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.note}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shop by brand</h2>
        <div className="flex flex-wrap gap-3">
          {brands.map((b) => (
            <Link
              key={b}
              href={`/brand/${b}`}
              className="rounded-full border px-4 py-1.5 text-sm uppercase hover:bg-muted"
            >
              {b}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
