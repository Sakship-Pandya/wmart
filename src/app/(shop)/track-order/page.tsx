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

      <div className="grid items-stretch gap-6 md:grid-cols-2">
        <TrackCard
          id="awb-heading"
          icon={<Truck className="size-5" />}
          title="Track with AWB number"
          subtitle="The tracking number from your shipping SMS or email."
          footer={
            <>
              Opens Delhivery&apos;s tracking page.{" "}
              <a href={delhiveryTrackingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
                Track by mobile number
              </a>
            </>
          }
        >
          <AwbTrackingForm />
        </TrackCard>

        <TrackCard
          id="lookup-heading"
          icon={<PackageSearch className="size-5" />}
          title="Look up your order"
          subtitle="Use the order number and the email or mobile you gave at checkout."
          footer="Your order number starts with WM, e.g. WM10234."
        >
          <OrderLookupForm />
        </TrackCard>
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

/** One tracking option. Both cards share this layout, so headings, fields and buttons line up. */
function TrackCard({
  id,
  icon,
  title,
  subtitle,
  footer,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">{icon}</span>
        <div>
          <h2 id={id} className="text-xl font-bold text-heading">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {/* The form fills the space so both buttons sit at the same height. */}
      <div className="flex flex-1 flex-col">{children}</div>
      <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{footer}</p>
    </section>
  );
}
