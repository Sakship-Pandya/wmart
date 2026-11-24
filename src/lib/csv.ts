// CSV writing for admin exports. Pairs with parseCSV() in csv-parser.ts.

/**
 * Escapes one cell. Text that starts with = + @ (or a tab/CR) is prefixed with an
 * apostrophe so Excel/Sheets treat it as text, not a formula (CSV formula injection).
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === "string" && /^[=+@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds a CSV file. A UTF-8 BOM is added so Excel shows ₹ and Indian-language names correctly. */
export function toCsv<T extends Record<string, unknown>>(columns: readonly (keyof T & string)[], rows: T[]): string {
  const lines = [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Response that downloads `csv` as `filename`. Never cached. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Paise -> rupees with 2 decimals, as a plain number string for spreadsheets ("1799.00"). */
export function rupees(paise: number | null | undefined): string {
  return paise === null || paise === undefined ? "" : (paise / 100).toFixed(2);
}

/** "2026-11-23" in IST, used in export file names. */
export function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** "2026-11-01" -> midnight IST that day (as a UTC Date); invalid or empty -> undefined. */
export function istDayStart(s: string | null): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Date range from ?from=&to= (IST days, both inclusive): { from, to } with `to` exclusive. */
export function istDateRange(params: URLSearchParams): { from?: Date; to?: Date } {
  const from = istDayStart(params.get("from"));
  const toStart = istDayStart(params.get("to"));
  return { from, to: toStart ? new Date(toStart.getTime() + 24 * 3600 * 1000) : undefined };
}
