import { AccountEmptyState } from "@/components/shop/account/empty-state";

export const metadata = { title: "Orders" };

// My account → Orders.
// TODO: list the customer's orders (number, date, status, total, View) and an order details page,
// once the Order tables exist.
export default function OrdersPage() {
  return <AccountEmptyState message="No order has been made yet." />;
}
