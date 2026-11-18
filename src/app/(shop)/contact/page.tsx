import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/shop/page-header";
import { ContactForm } from "@/components/shop/forms/contact-form";
import { contact, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Call, email or WhatsApp WMart in Ahmedabad for help with laptop batteries, adapters and orders.",
};

const channels = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    detail: contact.phoneDisplay,
    note: "Fastest reply – send your laptop model to check compatibility.",
    href: whatsappUrl,
    external: true,
  },
  { icon: Phone, title: "Call us", detail: contact.phoneDisplay, note: "Talk to our support team.", href: contact.phoneHref },
  { icon: Mail, title: "Email", detail: contact.email, note: "For orders, invoices and returns.", href: `mailto:${contact.email}` },
] as const;

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Contact us"
        intro="Not sure which battery or adapter fits your laptop? Need help with an order? We're happy to help."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {channels.map((c) => (
            <a
              key={c.title}
              href={c.href}
              {...("external" in c ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-start gap-4 rounded-2xl border p-4 transition hover:border-brand"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <c.icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold text-heading">{c.title}</span>
                <span className="block font-medium text-brand">{c.detail}</span>
                <span className="block text-sm text-muted-foreground">{c.note}</span>
              </span>
            </a>
          ))}

          <a
            href={contact.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border p-4 transition hover:border-brand"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <MapPin className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-heading">Visit us</span>
              {contact.addressLines.map((l) => (
                <span key={l} className="block text-sm text-muted-foreground">{l}</span>
              ))}
              <span className="mt-1 block text-sm font-medium text-brand">Open in Google Maps</span>
            </span>
          </a>

          {/* TODO: add WMart's real support hours here. */}
        </div>

        <section aria-labelledby="contact-form-heading" className="rounded-2xl bg-muted p-6 sm:p-8">
          <h2 id="contact-form-heading" className="text-xl font-bold">Send us a message</h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Include your laptop model or part number and we&apos;ll get back to you by email.
          </p>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
