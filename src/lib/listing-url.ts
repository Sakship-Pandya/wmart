// Builds listing-page links that keep the current filters, e.g. changing the sort keeps the brand filter.

export type Query = Record<string, string | string[] | undefined>;

/** Returns `pathname?…` with `changes` applied. `undefined`/empty values remove the key. Any change except `page` resets to page 1. */
export function listingHref(pathname: string, query: Query, changes: Query): string {
  const params = new URLSearchParams();
  const merged: Query = { ...query, ...changes };
  if (!("page" in changes)) delete merged.page;
  for (const [key, value] of Object.entries(merged)) {
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    for (const v of values) if (v !== "") params.append(key, v);
  }
  const s = params.toString();
  return s ? `${pathname}?${s}` : pathname;
}

export function asList(v: string | string[] | undefined): string[] {
  return (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(",")).filter(Boolean);
}
