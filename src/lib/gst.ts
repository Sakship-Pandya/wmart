// Prices on WMart are GST-inclusive. These helpers split an inclusive price into
// taxable value + tax for invoices. Amounts are in paise.

export type GstSplit = {
  taxable: number;
  /** Intra-state sale (seller and buyer in the same state): CGST + SGST */
  cgst: number;
  sgst: number;
  /** Inter-state sale: IGST */
  igst: number;
  total: number;
};

export function splitInclusivePrice(
  inclusivePaise: number,
  gstRatePercent: number,
  intraState: boolean,
): GstSplit {
  const taxable = Math.round((inclusivePaise * 100) / (100 + gstRatePercent));
  const tax = inclusivePaise - taxable;
  if (intraState) {
    const cgst = Math.floor(tax / 2);
    return { taxable, cgst, sgst: tax - cgst, igst: 0, total: inclusivePaise };
  }
  return { taxable, cgst: 0, sgst: 0, igst: tax, total: inclusivePaise };
}
