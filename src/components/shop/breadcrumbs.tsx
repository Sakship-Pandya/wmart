import Link from "next/link";

export type Crumb = { label: string; href?: string };

// Breadcrumbs path (Home / Page / InnerPage) disabled per storefront design.
export function Breadcrumbs({ items: _items }: { items: Crumb[] }) {
  return null;
}
