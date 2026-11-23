// Store-wide constants shared by several components.

export const shopCategories = [
  { href: "/c/laptop-batteries", label: "Laptop Batteries" },
  { href: "/c/laptop-adapters", label: "Laptop Adapters" },
  { href: "/c/power-cables", label: "Power Cables" },
  { href: "/c/accessories", label: "Accessories" },
] as const;

// Same WhatsApp support number as the old site.
export const whatsappUrl = "https://api.whatsapp.com/send?phone=917829225000&text=WMart%20Support";

// Promo box shown on product pages (same offer as the old site).
// NOTE: coupon codes are not connected at checkout yet – set `enabled: false` to hide it until they are.
export const productPromo = {
  enabled: true,
  title: "Discounts Shopping Event",
  text: "Get 10% discount on online payment – use promo code",
  code: "ONLINE10",
} as const;

// Business details used in the policies, FAQ and product pages – change them here only.
// Return window confirmed by the team: 10 days, as on wmart.co.in and the wmartstore.in FAQ
// (only the old wmartstore.in refund-policy page said 7).
export const business = {
  legalName: "Worldmart Infocom",
  returnWindowDays: 10,
  warrantyMonthsOriginal: 12,
  warrantyMonthsCompatible: 6,
  supportHours: "Monday – Saturday, 10:00 AM – 7:00 PM",
} as const;

// "Why buy from us" points listed on every product page (from the old site).
export const trustPoints = [
  "Pan India delivery",
  "100% tested",
  "Secure payments",
  "1 Lakh+ orders delivered",
  `${business.returnWindowDays} days easy returns window`,
  "Easy replacement within warranty",
] as const;

// Contact details from the old wmart.co.in footer.
export const contact = {
  phoneDisplay: "+91 78292 25000",
  phoneHref: "tel:+917829225000",
  email: "support@wmart.co.in",
  addressLines: ["F-517, 4th floor, F-Block, Sobo Center", "South Bopal, Ahmedabad – 380058", "Gujarat, India"],
  mapUrl: "https://share.google/AyLuida2xcwQrD3tc",
} as const;

// Delhivery is the only courier.
export const delhiveryTrackingUrl = "https://www.delhivery.com/tracking";
export function delhiveryAwbUrl(awb: string) {
  return `https://www.delhivery.com/track-v2/package/${encodeURIComponent(awb)}`;
}

/** "laptop-batteries" -> "Laptop Batteries" (used when a page has no name in the database yet). */
export function titleFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
