import {
  siAcer,
  siApple,
  siAsus,
  siDell,
  siFujitsu,
  siHp,
  siHuawei,
  siLenovo,
  siLg,
  siMsi,
  siRazer,
  siSamsung,
  siSony,
  siToshiba,
  siXiaomi,
  type SimpleIcon,
} from "simple-icons";

// Brand logos (Simple Icons, CC0) for the storefront. Only the brands listed here are bundled.
// Keyed by brand slug; a brand without a logo here falls back to its first letter.
// To add one: import `si<Name>` above (see https://simpleicons.org) and add it below.
const logos: Record<string, SimpleIcon> = {
  acer: siAcer,
  apple: siApple,
  asus: siAsus,
  dell: siDell,
  fujitsu: siFujitsu,
  hp: siHp,
  huawei: siHuawei,
  lenovo: siLenovo,
  lg: siLg,
  msi: siMsi,
  razer: siRazer,
  samsung: siSamsung,
  sony: siSony,
  toshiba: siToshiba,
  xiaomi: siXiaomi,
};

// Wordmark logos only fill a thin strip of the 24×24 box, so they are cropped to their outline
// (measured with getBBox, plus a little padding) to show at a readable size in a wide slot.
const viewBoxes: Record<string, string> = {
  acer: "0 8.8 24 6.4",
  asus: "0 9.2 24 5.6",
  lenovo: "0 7.7 24 8.6",
  samsung: "0 9.9 24 4.2",
  sony: "0 9.6 24 4.8",
};

/** The brand's logo as an SVG path plus the viewBox to draw it in, or null when there isn't one. */
export function brandLogo(slug: string): { path: string; viewBox: string } | null {
  const key = slug.toLowerCase();
  const icon = logos[key];
  return icon ? { path: icon.path, viewBox: viewBoxes[key] ?? "0 0 24 24" } : null;
}
