"use client";

import { ExportMenu, istDate } from "@/components/admin/shared/export-menu";

/** Export menu on the Orders page: last 30 days by default, plus the page's tab/filters. */
export function OrdersExport() {
  return (
    <ExportMenu
      endpoint="/api/admin/export/orders"
      carry={["status", "payment", "method", "q"]}
      defaultFrom={istDate(29)}
      defaultTo={istDate(0)}
      allLabel="All orders in this date range"
      options={[
        { label: "Orders (one row per order)", primary: true },
        { label: "Order items (HSN / GST lines)", params: { rows: "items" } },
      ]}
    />
  );
}
