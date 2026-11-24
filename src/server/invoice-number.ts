import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { formatInvoiceNumber, invoiceSeriesPrefix } from "@/lib/invoice";

/**
 * Gives an order the next GST invoice number of the current financial year
 * (WM/2026-27/0001, 0002, ...), unless it already has one. Must run inside a
 * transaction: the advisory lock makes concurrent confirmations wait their turn,
 * so two orders can never get the same number and the series has no gaps.
 *
 * Returns the order's invoice number (new or existing).
 */
export async function assignInvoiceNumber(tx: Prisma.TransactionClient, orderId: string, now = new Date()): Promise<string> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('wmart:invoice-number'))`;

  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { invoiceNumber: true } });
  if (order.invoiceNumber) return order.invoiceNumber;

  const prefix = invoiceSeriesPrefix(now);
  // Highest sequence used so far in this series (compared as numbers, so 10000 > 9999).
  // Numbers look like PREFIX/YEAR/SEQ and the prefix can't contain "/", so SEQ is the 3rd part.
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT max(split_part("invoiceNumber", '/', 3)::int) AS max
    FROM "Order"
    WHERE "invoiceNumber" LIKE ${`${prefix}%`} AND split_part("invoiceNumber", '/', 3) ~ '^[0-9]+$'
  `;
  const invoiceNumber = formatInvoiceNumber(now, (rows[0]?.max ?? 0) + 1);

  await tx.order.update({ where: { id: orderId }, data: { invoiceNumber, invoicedAt: now } });
  return invoiceNumber;
}
