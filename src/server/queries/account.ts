import { connection } from "next/server";

// Read-only queries for the customer's My account area.
// These depend on who is signed in, so they always run at request time.

export type CustomerDownload = {
  id: string;
  productTitle: string;
  productSlug: string;
  fileName: string;
  /** Link that serves the file. Must check the signed-in customer owns it. */
  url: string;
  /** null = unlimited */
  downloadsRemaining: number | null;
  /** null = never expires */
  expiresAt: Date | null;
};

/**
 * Files the signed-in customer can download (e.g. manuals, driver files, invoices).
 * WMart sells no downloadable products today, so this returns an empty list.
 * TODO: when customer login and orders exist, load downloads granted by the
 * customer's paid orders (needs Customer/Order/Download tables in the schema).
 */
export async function getCustomerDownloads(): Promise<CustomerDownload[]> {
  await connection();
  return [];
}
