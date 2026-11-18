import Link from "next/link";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/c/laptop-batteries", label: "Laptop Batteries" },
      { href: "/c/laptop-adapters", label: "Laptop Adapters" },
      { href: "/c/power-cables", label: "Power Cables" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track-order", label: "Track Order" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/pages/shipping-policy", label: "Shipping Policy" },
      { href: "/pages/refund-policy", label: "Refund & Exchange" },
      { href: "/pages/privacy-policy", label: "Privacy Policy" },
      { href: "/pages/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold">WMart</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Laptop batteries, adapters, power cables and accessories. All prices include 18% GST.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="font-semibold">{col.title}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
