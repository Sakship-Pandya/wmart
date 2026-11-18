import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/shop/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Shipping, Cash on Delivery, GST invoices, genuine parts, returns and finding the right battery or adapter.",
};

// Answers from the old WMart sites.
const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I find the right battery or adapter for my laptop?",
    a: (
      <>
        Check the model number on the sticker under your laptop (or the part number on your old
        battery/charger) and search for it on our store. You can also send the model number to us on{" "}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
          WhatsApp at 78292 25000
        </a>{" "}
        and we will confirm compatibility before you order.
      </>
    ),
  },
  {
    q: "Is shipping really free?",
    a: (
      <>
        Yes. We offer free shipping on all orders across India. Orders are shipped with Delhivery and you
        can follow your parcel from the{" "}
        <Link href="/track-order" className="font-medium text-brand hover:underline">Track order</Link> page.
      </>
    ),
  },
  {
    q: "Do you offer Cash on Delivery?",
    a: "Yes, Cash on Delivery is available on most pin codes in India. You can also pay online with PayU by UPI, debit/credit card, netbanking or wallets.",
  },
  {
    q: "Are your prices inclusive of GST? Will I get an invoice?",
    a: "All prices include 18% GST. A GST invoice is shared with every order.",
  },
  {
    q: "Are the products genuine?",
    a: "Yes. We sell original and high-grade compatible products that are quality-checked before dispatch. Each product page clearly states whether the item is original or compatible.",
  },
  {
    q: "What is your refund and exchange policy?",
    a: (
      <>
        If a product arrives damaged, defective or incompatible, request a return on WhatsApp within 10
        days of delivery for a refund or replacement (after 10 days, replacement only). Please read our{" "}
        <Link href="/pages/refund-policy" className="font-medium text-brand hover:underline">
          Refund &amp; Exchange policy
        </Link>{" "}
        for full details.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Frequently asked questions"
        intro="Quick answers about ordering, shipping, payments and returns."
      />

      <div className="max-w-3xl divide-y rounded-2xl border">
        {faqs.map((f, i) => (
          <details key={f.q} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-heading hover:text-brand [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 text-muted-foreground">{f.a}</div>
          </details>
        ))}
      </div>

      <div className="flex max-w-3xl flex-col items-start gap-3 rounded-2xl bg-muted p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-heading">Still have a question?</p>
          <p className="text-sm text-muted-foreground">Our team replies quickly on WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "h-10 rounded-full px-5")}>
            <MessageCircle data-icon="inline-start" />
            Chat on WhatsApp
          </a>
          <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full px-5")}>
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
