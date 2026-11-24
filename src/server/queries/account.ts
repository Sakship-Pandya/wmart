import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";

// Read-only queries for the signed-in customer's My account area.
// Every function takes the customer id from the session (never from the URL),
// so a customer can only ever see their own data.

export async function getCustomerOrders(customerId: string) {
  return db.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      total: true,
      items: { select: { title: true, slug: true, imageUrl: true, quantity: true }, orderBy: { title: "asc" } },
    },
    take: 100,
  });
}

export async function getCustomerAddresses(customerId: string) {
  const rows = await db.address.findMany({ where: { customerId } });
  return {
    billing: rows.find((a) => a.type === "BILLING") ?? null,
    shipping: rows.find((a) => a.type === "SHIPPING") ?? null,
  };
}

export async function getCustomerDetails(customerId: string) {
  return db.customer.findUnique({
    where: { id: customerId },
    select: { email: true, firstName: true, lastName: true, displayName: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
  });
}

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
 * Files the signed-in customer can download (e.g. manuals, driver files).
 * WMart sells no downloadable products today, so this returns an empty list.
 * TODO: add a Download table if downloadable products are ever sold.
 */
export async function getCustomerDownloads(): Promise<CustomerDownload[]> {
  await connection();
  return [];
}
