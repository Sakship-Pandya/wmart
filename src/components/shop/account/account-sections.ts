// Same menu as the old site's My account area. Shared by the server pages and the client menu.
// segment = the folder name under /account (null for the dashboard at /account).
// Downloads is left out of the menu (WMart sells no downloadable products); /account/downloads still exists.
export const accountSections = [
  { segment: null, href: "/account", label: "Dashboard" },
  { segment: "orders", href: "/account/orders", label: "Orders" },
  { segment: "coupons", href: "/account/coupons", label: "Coupons" },
  { segment: "addresses", href: "/account/addresses", label: "Addresses" },
  { segment: "details", href: "/account/details", label: "Account details" },
] as const;
