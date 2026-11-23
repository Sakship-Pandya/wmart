import { Suspense } from "react";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { listCategoriesWithProducts } from "@/server/queries/products";
import { contact, whatsappUrl } from "@/lib/site";
import { CurrentYear } from "./current-year";

const help = [
  { href: "/track-order", label: "Shipment Tracking" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
  { href: "/account", label: "My Account" },
];

const policies = [
  { href: "/pages/shipping-policy", label: "Shipping Policy" },
  { href: "/pages/refund-policy", label: "Refund & Exchange" },
  { href: "/pages/privacy-policy", label: "Privacy Policy" },
  { href: "/pages/terms", label: "Terms and Conditions" },
];

const linkClass = "text-muted-foreground transition hover:text-brand";

async function PopularCategories() {
  const categories = await listCategoriesWithProducts(6);
  return (
    <>
      {categories.map((c) => (
        <li key={c.slug}>
          <Link href={`/c/${c.slug}`} className={linkClass}>{c.name}</Link>
        </li>
      ))}
      <li>
        <Link href="/shop" className={linkClass}>All products</Link>
      </li>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-muted">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link href="/" className="text-[28px] font-black tracking-tight text-heading">
            W<span className="text-brand">Mart</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Laptop batteries, adapters, power cables and accessories, with free shipping and Cash on Delivery across India.
          </p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 text-muted-foreground hover:text-brand">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{contact.addressLines.join(", ")}</span>
              </a>
            </li>
            <li>
              <a href={contact.phoneHref} className="flex items-center gap-2.5 text-muted-foreground hover:text-brand">
                <Phone className="size-4 text-brand" /> {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-muted-foreground hover:text-brand">
                <Mail className="size-4 text-brand" /> {contact.email}
              </a>
            </li>
            <li>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-muted-foreground hover:text-brand">
                <MessageCircle className="size-4 text-brand" /> Chat with our support
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold text-heading">Popular categories</p>
          <ul className="space-y-2 text-sm">
            <Suspense fallback={null}>
              <PopularCategories />
            </Suspense>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold text-heading">Useful links</p>
          <ul className="space-y-2 text-sm">
            {help.map((l) => (
              <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold text-heading">Policies</p>
          <ul className="space-y-2 text-sm">
            {policies.map((l) => (
              <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <p>© <CurrentYear /> WMart. All rights reserved.</p>
          <p>All prices include 18% GST · Payments by PayU · Shipping by Delhivery</p>
        </div>
      </div>
    </footer>
  );
}
