import { AccountEmptyState } from "@/components/shop/account/empty-state";

export const metadata = { title: "Coupons" };

// My account → Coupons: coupons the customer can use.
// TODO: list available coupons (e.g. ONLINE10 – 10% off online payment) once the Coupon table exists.
export default function CouponsPage() {
  return <AccountEmptyState message="You don't have any coupons yet." />;
}
