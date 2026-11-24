import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TaxInvoice } from "@/components/invoice/tax-invoice";
import { GenerateInvoiceButton, PrintInvoiceButton } from "@/components/admin/orders/invoice-buttons";
import { getAdminOrder } from "@/server/queries/admin/orders";
import { buildInvoice } from "@/lib/invoice";
import { formatOrderNumber } from "@/lib/orders";

export const metadata = { title: "Invoice | WMart Admin" };

export default function OrderInvoicePage({ params }: PageProps<"/admin/orders/[id]/invoice">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[900px] max-w-[210mm] rounded-lg" />}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}

async function InvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const back = (
    <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Order {formatOrderNumber(order.orderNumber)}
    </Link>
  );

  if (!order.invoiceNumber) {
    const canIssue = order.status !== "PENDING" && order.status !== "CANCELLED";
    return (
      <div className="mx-auto max-w-xl space-y-4">
        {back}
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-lg font-semibold">No invoice yet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canIssue
              ? "This order doesn't have a GST invoice number yet. Generate one to print the invoice."
              : "An invoice is issued when the order is confirmed. Pending and cancelled orders don't get one."}
          </p>
          {canIssue && (
            <div className="mt-4">
              <GenerateInvoiceButton orderId={order.id} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const invoice = buildInvoice(order);
  const warnings = [
    !invoice.seller.gstin && "Your GSTIN is not set. Add SELLER_GSTIN to .env – an invoice without it is not a valid tax invoice.",
    invoice.seller.gstin && !invoice.seller.gstinValid && `SELLER_GSTIN "${invoice.seller.gstin}" doesn't look like a valid GSTIN (15 characters, e.g. 24ABCDE1234F1Z5).`,
    invoice.missingHsn && "Some items have no HSN code. Add HSN codes to those products (they are copied onto orders when placed).",
    !invoice.matchesOrderTotal && "The invoice total doesn't match the order total. Please report this.",
    order.status === "CANCELLED" && "This order was cancelled after the invoice was issued. Issue a credit note in your accounts.",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        {back}
        <PrintInvoiceButton />
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-star/60 bg-star/15 p-3 text-sm text-heading print:hidden">
          {warnings.map((w) => (
            <li key={w} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {w}
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-lg border shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <TaxInvoice invoice={invoice} />
      </div>
    </div>
  );
}
