import type { Invoice } from "@/lib/invoice";
import { amountInWords } from "@/lib/amount-in-words";
import { gstStateCode } from "@/lib/gst-states";
import { formatDateIST } from "@/lib/orders";

// Invoices show exact amounts with paise (formatPrice in lib/format rounds to whole rupees).
const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (paise: number) => inr.format(paise / 100);

/**
 * GST tax invoice, laid out for A4 printing / "Save as PDF".
 * Plain black-on-white so it prints the same in light and dark mode.
 */
export function TaxInvoice({ invoice }: { invoice: Invoice }) {
  const { seller, buyer, lines, totals, intraState } = invoice;
  const bill = buyer.billing ?? buyer.shipping;
  const ship = buyer.shipping;

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white p-8 text-[12px] leading-snug text-black print:max-w-none print:p-0">
      {/* Title */}
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-wide">TAX INVOICE</h1>
          <p className="text-[11px] text-neutral-600">Original for recipient</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{seller.legalName}</p>
          <p className="text-[11px] text-neutral-600">Trading as {seller.tradeName}</p>
        </div>
      </header>

      {/* Seller + invoice details */}
      <section className="grid grid-cols-2 gap-6 border-b border-neutral-400 py-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Sold by</p>
          <p className="font-semibold">{seller.legalName}</p>
          {seller.addressLines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <p>
            GSTIN: <span className="font-mono font-semibold">{seller.gstin || "—"}</span>
          </p>
          <p>
            State: {seller.state} (Code {seller.stateCode})
          </p>
          <p>
            {seller.email} · {seller.phone}
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-0.5">
          <dt className="text-neutral-600">Invoice no.</dt>
          <dd className="font-mono font-semibold">{invoice.invoiceNumber}</dd>
          <dt className="text-neutral-600">Invoice date</dt>
          <dd>{formatDateIST(invoice.invoiceDate)}</dd>
          <dt className="text-neutral-600">Order no.</dt>
          <dd className="font-mono">{invoice.orderNumber}</dd>
          <dt className="text-neutral-600">Order date</dt>
          <dd>{formatDateIST(invoice.orderDate)}</dd>
          <dt className="text-neutral-600">Payment</dt>
          <dd>{invoice.paymentMethod}</dd>
          <dt className="text-neutral-600">Place of supply</dt>
          <dd>
            {invoice.placeOfSupply} ({invoice.placeOfSupplyCode || "—"})
          </dd>
          <dt className="text-neutral-600">Reverse charge</dt>
          <dd>No</dd>
        </dl>
      </section>

      {/* Buyer */}
      <section className="grid grid-cols-2 gap-6 border-b border-neutral-400 py-3">
        <AddressBox title="Bill to" address={bill} email={buyer.email} />
        <AddressBox title="Ship to" address={ship} />
      </section>

      {/* Items */}
      <table className="mt-3 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-1.5 pr-1">#</th>
            <th className="py-1.5 pr-2">Description</th>
            <th className="py-1.5 pr-2">HSN/SAC</th>
            <th className="py-1.5 pr-2 text-right">Qty</th>
            <th className="py-1.5 pr-2 text-right">Rate</th>
            <th className="py-1.5 pr-2 text-right">Taxable value</th>
            <th className="py-1.5 pr-2 text-right">GST %</th>
            {intraState ? (
              <>
                <th className="py-1.5 pr-2 text-right">CGST</th>
                <th className="py-1.5 pr-2 text-right">SGST</th>
              </>
            ) : (
              <th className="py-1.5 pr-2 text-right">IGST</th>
            )}
            <th className="py-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-neutral-300 align-top">
              <td className="py-1.5 pr-1">{i + 1}</td>
              <td className="py-1.5 pr-2 [overflow-wrap:anywhere]">{l.description}</td>
              <td className="py-1.5 pr-2 font-mono">{l.hsn || "—"}</td>
              <td className="py-1.5 pr-2 text-right">{l.quantity}</td>
              <td className="py-1.5 pr-2 text-right">{money(l.unitTaxable)}</td>
              <td className="py-1.5 pr-2 text-right">{money(l.taxable)}</td>
              <td className="py-1.5 pr-2 text-right">{l.gstRate}%</td>
              {intraState ? (
                <>
                  <td className="py-1.5 pr-2 text-right">{money(l.cgst)}</td>
                  <td className="py-1.5 pr-2 text-right">{money(l.sgst)}</td>
                </>
              ) : (
                <td className="py-1.5 pr-2 text-right">{money(l.igst)}</td>
              )}
              <td className="py-1.5 text-right font-medium">{money(l.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-y border-black font-semibold">
            <td colSpan={5} className="py-1.5 pr-2 text-right">
              Total
            </td>
            <td className="py-1.5 pr-2 text-right">{money(totals.taxable)}</td>
            <td />
            {intraState ? (
              <>
                <td className="py-1.5 pr-2 text-right">{money(totals.cgst)}</td>
                <td className="py-1.5 pr-2 text-right">{money(totals.sgst)}</td>
              </>
            ) : (
              <td className="py-1.5 pr-2 text-right">{money(totals.igst)}</td>
            )}
            <td className="py-1.5 text-right">₹{money(totals.total)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.discount > 0 && (
        <p className="mt-1.5 text-[11px] text-neutral-600">
          Coupon {invoice.couponCode ?? ""} discount of ₹{money(invoice.discount)} has been applied; line amounts are after the discount.
        </p>
      )}

      {/* Amount in words + summary */}
      <section className="mt-4 grid grid-cols-[1fr_auto] gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Amount in words</p>
          <p className="font-medium">{amountInWords(totals.total)}</p>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Tax summary by HSN</p>
          <table className="mt-1 border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-neutral-400 text-left">
                <th className="py-1 pr-4">HSN/SAC</th>
                <th className="py-1 pr-4 text-right">Taxable</th>
                <th className="py-1 pr-4 text-right">Rate</th>
                {intraState ? (
                  <>
                    <th className="py-1 pr-4 text-right">CGST</th>
                    <th className="py-1 pr-4 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-1 pr-4 text-right">IGST</th>
                )}
              </tr>
            </thead>
            <tbody>
              {invoice.hsnSummary.map((h) => (
                <tr key={`${h.hsn}-${h.gstRate}`}>
                  <td className="py-0.5 pr-4 font-mono">{h.hsn || "—"}</td>
                  <td className="py-0.5 pr-4 text-right">{money(h.taxable)}</td>
                  <td className="py-0.5 pr-4 text-right">{h.gstRate}%</td>
                  {intraState ? (
                    <>
                      <td className="py-0.5 pr-4 text-right">{money(h.cgst)}</td>
                      <td className="py-0.5 pr-4 text-right">{money(h.sgst)}</td>
                    </>
                  ) : (
                    <td className="py-0.5 pr-4 text-right">{money(h.igst)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="grid min-w-56 grid-cols-[1fr_auto] content-start gap-x-6 gap-y-1 border border-neutral-400 p-3">
          <dt>Taxable value</dt>
          <dd className="text-right">{money(totals.taxable)}</dd>
          {intraState ? (
            <>
              <dt>CGST</dt>
              <dd className="text-right">{money(totals.cgst)}</dd>
              <dt>SGST</dt>
              <dd className="text-right">{money(totals.sgst)}</dd>
            </>
          ) : (
            <>
              <dt>IGST</dt>
              <dd className="text-right">{money(totals.igst)}</dd>
            </>
          )}
          <dt className="border-t border-black pt-1 font-bold">Grand total</dt>
          <dd className="border-t border-black pt-1 text-right font-bold">₹{money(totals.total)}</dd>
        </dl>
      </section>

      {/* Declaration + signature */}
      <footer className="mt-8 grid grid-cols-2 items-end gap-6 border-t border-neutral-400 pt-3 text-[11px]">
        <div className="text-neutral-600">
          <p>Prices are inclusive of GST.</p>
          <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">For {seller.legalName}</p>
          <div className="h-10" />
          <p className="border-t border-neutral-400 pt-1">Authorised signatory</p>
        </div>
      </footer>
      <p className="mt-4 text-center text-[10px] text-neutral-500">This is a computer-generated invoice.</p>
    </article>
  );
}

function AddressBox({
  title,
  address,
  email,
}: {
  title: string;
  address: { fullName: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string } | null;
  email?: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
      {address ? (
        <>
          <p className="font-semibold">{address.fullName}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city} – {address.pincode}
          </p>
          <p>
            {address.state} (Code {gstStateCode(address.state) || "—"})
          </p>
          <p>Phone: {address.phone}</p>
          {email && <p>{email}</p>}
        </>
      ) : (
        <p className="text-neutral-500">Not available</p>
      )}
    </div>
  );
}
