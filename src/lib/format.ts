// All money is stored in paise (whole numbers): ₹1,799 = 179900.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 179900 -> "₹1,799" */
export function formatPrice(paise: number): string {
  return inr.format(paise / 100);
}

/** Discount percentage between MRP and selling price, e.g. 28 for -28%. */
export function discountPercent(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
