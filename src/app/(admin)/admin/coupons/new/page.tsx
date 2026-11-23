import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/coupons/coupon-form";

export const metadata = { title: "Add coupon | WMart Admin" };

export default function NewCouponPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link href="/admin/coupons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Coupons
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add coupon</h1>
      </div>
      <CouponForm />
    </div>
  );
}
