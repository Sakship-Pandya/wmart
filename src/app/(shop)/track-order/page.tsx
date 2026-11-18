import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Truck } from "lucide-react";
import { PageHeader } from "@/components/shop/page-header";
import { AwbTrackingForm, OrderLookupForm } from "@/components/shop/forms/track-order-forms";
import { delhiveryTrackingUrl, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your WMart order shipped with Delhivery using the AWB tracking number.",
};

// Same purpose as the old site's "Shipment Tracking" link (Delhivery is the only courier).
export default function TrackOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Track your order"
        intro="All WMart orders ship with Delhivery. Use the tracking number (AWB) from your shipping SMS or email, or look up your order."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="awb-heading" className="rounded-2xl border p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Truck className="size-5" />
            </span>
            <h2 id="awb-heading" className="text-xl font-bold">Track with AWB number</h2>
          </div>
          <AwbTrackingForm />
          <p className="mt-4 text-sm text-muted-foreground">
            Opens Delhivery&apos;s tracking page.{" "}
            <a href={delhiveryTrackingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
              Track by mobile number on Delhivery
            </a>
          </p>
        </section>

        <section aria-labelledby="lookup-heading" className="rounded-2xl bg-muted p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-background text-brand">
              <PackageSearch className="size-5" />
            </span>
            <h2 id="lookup-heading" className="text-xl font-bold">Look up your order</h2>
          </div>
          <OrderLookupForm />
        </section>
      </div>

      <p className="text-sm text-muted-foreground">
        Can&apos;t find your tracking number?{" "}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
          Ask us on WhatsApp
        </a>{" "}
        or see your orders in <Link href="/account/orders" className="font-medium text-brand hover:underline">My account</Link>.
      </p>
    </div>
  );
}
