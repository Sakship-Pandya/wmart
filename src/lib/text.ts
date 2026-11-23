/** Max characters of a product name shown in admin lists; the full name is shown on hover. */
export const PRODUCT_NAME_MAX = 50;

/**
 * Cuts `text` to at most `max` characters and adds "..." when it was longer.
 * Cuts at the last space when one is near the end, so words aren't split.
 */
export function shortenText(text: string, max = PRODUCT_NAME_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:/-]+$/, "")}...`;
}
