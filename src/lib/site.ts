// Store-wide constants shared by several components.

export const shopCategories = [
  { href: "/c/laptop-batteries", label: "Laptop Batteries" },
  { href: "/c/laptop-adapters", label: "Laptop Adapters" },
  { href: "/c/power-cables", label: "Power Cables" },
  { href: "/c/accessories", label: "Accessories" },
] as const;

// Same WhatsApp support number as the old site.
export const whatsappUrl = "https://api.whatsapp.com/send?phone=917829225000&text=WMart%20Support";

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
