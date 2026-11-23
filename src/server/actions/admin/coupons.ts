"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { couponSchema, type CouponFormValues } from "@/lib/validations/coupon";

const toPaise = (rupees: number | null) => (rupees === null ? null : Math.round(rupees * 100));

function parse(values: CouponFormValues) {
  const result = couponSchema.safeParse(values);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Invalid coupon");
  const c = result.data;
  return {
    code: c.code,
    type: c.type,
    value: c.type === "FLAT" ? Math.round(c.value * 100) : c.value,
    minOrderValue: toPaise(c.minOrderValue),
    maxDiscount: c.type === "PERCENT" ? toPaise(c.maxDiscount) : null,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    usageLimit: c.usageLimit,
    perCustomerLimit: c.perCustomerLimit,
    isActive: c.isActive,
  };
}

function revalidate() {
  revalidatePath("/admin/coupons");
}

export async function createCoupon(values: CouponFormValues) {
  await requireAdmin();
  const data = parse(values);
  if (await db.coupon.findUnique({ where: { code: data.code } })) {
    throw new Error(`A coupon with code "${data.code}" already exists.`);
  }
  const coupon = await db.coupon.create({ data });
  revalidate();
  return { success: true, id: coupon.id };
}

export async function updateCoupon(id: string, values: CouponFormValues) {
  await requireAdmin();
  const data = parse(values);
  const clash = await db.coupon.findFirst({ where: { code: data.code, NOT: { id } } });
  if (clash) throw new Error(`Another coupon already uses the code "${data.code}".`);
  await db.coupon.update({ where: { id }, data });
  revalidate();
  revalidatePath(`/admin/coupons/${id}/edit`);
  return { success: true };
}

export async function setCouponActive(id: string, isActive: boolean) {
  await requireAdmin();
  await db.coupon.update({ where: { id }, data: { isActive } });
  revalidate();
  return { success: true };
}

/**
 * Deletes a coupon that was never used. A coupon used by orders is disabled instead,
 * so those orders keep their link to it (they also keep a copy of the code).
 */
export async function deleteCoupon(id: string) {
  await requireAdmin();
  const used = await db.order.count({ where: { couponId: id } });
  if (used > 0) {
    await db.coupon.update({ where: { id }, data: { isActive: false } });
    revalidate();
    return { success: true, disabled: true as const, used };
  }
  await db.coupon.delete({ where: { id } });
  revalidate();
  return { success: true, disabled: false as const, used: 0 };
}
