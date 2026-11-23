// Development test data for the admin Orders, Customers and Coupons pages.
//
//   npx tsx scripts/seed-orders.ts          adds test data (refuses if it already exists)
//   npx tsx scripts/seed-orders.ts --reset  removes previous test data first, then adds it again
//
// Test customers all use @example.com emails; --reset only deletes orders and customers
// with those emails and coupons whose code starts with "TEST". Real data is never touched.
// Stock is NOT reduced for these orders. Never run this against the production database.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type OrderStatus, type PaymentStatus, type ShipmentStatus } from "../src/generated/prisma/client";
import { isIntraState } from "../src/lib/orders";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const TEST_DOMAIN = "@example.com";

let seed = 20261123;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T>(a: readonly T[]): T => a[Math.floor(rand() * a.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const daysAgo = (d: number, h = int(9, 21)) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, int(0, 59), 0, 0);
  return t;
};

const PEOPLE = [
  ["Rahul", "Sharma", "Ahmedabad", "Gujarat", "380015"],
  ["Priya", "Patel", "Surat", "Gujarat", "395007"],
  ["Amit", "Verma", "Mumbai", "Maharashtra", "400069"],
  ["Sneha", "Iyer", "Bengaluru", "Karnataka", "560034"],
  ["Vikram", "Singh", "Jaipur", "Rajasthan", "302017"],
  ["Ananya", "Reddy", "Hyderabad", "Telangana", "500081"],
  ["Rohan", "Mehta", "Vadodara", "Gujarat", "390007"],
  ["Kavya", "Nair", "Kochi", "Kerala", "682024"],
  ["Arjun", "Gupta", "New Delhi", "Delhi", "110017"],
  ["Pooja", "Joshi", "Pune", "Maharashtra", "411038"],
  ["Sanjay", "Kumar", "Lucknow", "Uttar Pradesh", "226010"],
  ["Neha", "Das", "Kolkata", "West Bengal", "700091"],
] as const;

const STREETS = ["MG Road", "Station Road", "Ring Road", "Satellite Road", "Link Road", "Park Street", "Lake View Road"];
const AREAS = ["Near City Mall", "Opp. SBI Bank", "Behind Bus Stand", "Sector 4", "Phase 2", null];

// Order status → payment status, shipment status and how many days each step took.
type Plan = { status: OrderStatus; pay: (cod: boolean) => PaymentStatus; ship: ShipmentStatus | null };
const PLANS: Plan[] = [
  { status: "PENDING", pay: () => "PENDING", ship: null },
  { status: "PENDING", pay: (cod) => (cod ? "PENDING" : "FAILED"), ship: null },
  { status: "CONFIRMED", pay: (cod) => (cod ? "PENDING" : "PAID"), ship: null },
  { status: "PACKED", pay: (cod) => (cod ? "PENDING" : "PAID"), ship: "PENDING" },
  { status: "SHIPPED", pay: (cod) => (cod ? "PENDING" : "PAID"), ship: "IN_TRANSIT" },
  { status: "SHIPPED", pay: (cod) => (cod ? "PENDING" : "PAID"), ship: "OUT_FOR_DELIVERY" },
  { status: "DELIVERED", pay: () => "PAID", ship: "DELIVERED" },
  { status: "DELIVERED", pay: () => "PAID", ship: "DELIVERED" },
  { status: "CANCELLED", pay: (cod) => (cod ? "PENDING" : "REFUNDED"), ship: null },
  { status: "RETURNED", pay: (cod) => (cod ? "PENDING" : "REFUNDED"), ship: "RTO_DELIVERED" },
];

async function removeTestData() {
  const orders = await db.order.deleteMany({ where: { email: { endsWith: TEST_DOMAIN } } });
  const customers = await db.customer.deleteMany({ where: { email: { endsWith: TEST_DOMAIN } } });
  const coupons = await db.coupon.deleteMany({ where: { code: { startsWith: "TEST" } } });
  console.log(`Removed ${orders.count} test orders, ${customers.count} test customers, ${coupons.count} test coupons.`);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (process.argv.includes("--reset")) await removeTestData();
  else if (await db.customer.count({ where: { email: { endsWith: TEST_DOMAIN } } })) {
    console.log("Test data already exists. Run with --reset to recreate it.");
    return;
  }

  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true, slug: true, price: true, mrp: true, hsnCode: true, gstRate: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
    take: 60,
  });
  if (products.length === 0) throw new Error("No products found. Import products first.");

  // Coupons
  const in30 = new Date(Date.now() + 30 * 864e5);
  const coupons = await Promise.all([
    db.coupon.create({ data: { code: "TESTWELCOME10", type: "PERCENT", value: 10, maxDiscount: 50000, perCustomerLimit: 1, usageLimit: 500, expiresAt: in30 } }),
    db.coupon.create({ data: { code: "TESTFLAT200", type: "FLAT", value: 20000, minOrderValue: 200000, expiresAt: in30 } }),
    db.coupon.create({ data: { code: "TESTDIWALI15", type: "PERCENT", value: 15, maxDiscount: 100000, startsAt: daysAgo(40), expiresAt: daysAgo(10) } }),
    db.coupon.create({ data: { code: "TESTBULK500", type: "FLAT", value: 50000, minOrderValue: 1000000, usageLimit: 20 } }),
    db.coupon.create({ data: { code: "TESTOLDPROMO", type: "PERCENT", value: 5, isActive: false } }),
  ]);
  const usableCoupons = coupons.slice(0, 2);

  // Customers with saved addresses
  const customers = [];
  for (const [i, [first, last, city, state, pin]] of PEOPLE.entries()) {
    const phone = `9${String(800000000 + i * 7919).padStart(9, "0")}`;
    const address = { fullName: `${first} ${last}`, phone, line1: `${int(1, 250)}, ${pick(STREETS)}`, line2: pick(AREAS), city, state, pincode: pin };
    customers.push(
      await db.customer.create({
        data: {
          email: `${first}.${last}${TEST_DOMAIN}`.toLowerCase(),
          firstName: first,
          lastName: last,
          displayName: first,
          phone,
          createdAt: daysAgo(int(35, 90)),
          addresses: { create: [{ type: "SHIPPING", ...address }, { type: "BILLING", ...address }] },
        },
        include: { addresses: true },
      }),
    );
  }

  // Orders
  let created = 0;
  for (let n = 0; n < 30; n++) {
    const guest = n % 7 === 6; // a few guest checkouts
    const customer = guest ? null : pick(customers);
    const plan = PLANS[n % PLANS.length];
    const cod = rand() < 0.4;
    const placedAt = daysAgo(Math.max(0, 30 - n), int(9, 21));

    let address;
    let email;
    if (customer) {
      const a = customer.addresses.find((x) => x.type === "SHIPPING")!;
      address = { fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode };
      email = customer.email;
    } else {
      const [first, last, city, state, pin] = pick(PEOPLE);
      address = { fullName: `${first} ${last}`, phone: `98${int(10000000, 99999999)}`, line1: `${int(1, 250)}, ${pick(STREETS)}`, line2: null, city, state, pincode: pin };
      email = `guest${n}${TEST_DOMAIN}`;
    }

    const lines = Array.from({ length: int(1, 3) }, () => pick(products));
    const unique = [...new Map(lines.map((p) => [p.id, p])).values()];
    const items = unique.map((p) => {
      const quantity = rand() < 0.8 ? 1 : 2;
      return { productId: p.id, title: p.title, slug: p.slug, imageUrl: p.images[0]?.url ?? null, hsnCode: p.hsnCode, gstRate: p.gstRate, unitPrice: p.price, mrp: p.mrp, quantity, lineTotal: p.price * quantity };
    });
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

    const coupon = rand() < 0.3 ? pick(usableCoupons) : null;
    let discount = 0;
    if (coupon && (!coupon.minOrderValue || subtotal >= coupon.minOrderValue)) {
      discount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    }
    const useCoupon = discount > 0 ? coupon : null;
    const total = subtotal - discount;
    const payStatus = plan.pay(cod);
    const at = (d: number) => new Date(placedAt.getTime() + d * 864e5);
    const progressed = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "RETURNED"].includes(plan.status);

    const events: { type: string; message: string | null; actor: string; createdAt: Date }[] = [
      { type: "status:PENDING", message: `Order placed (${cod ? "Cash on Delivery" : "PayU"})`, actor: "customer", createdAt: placedAt },
    ];
    if (!cod && payStatus === "FAILED") events.push({ type: "payment:FAILED", message: "PayU payment failed", actor: "payu", createdAt: at(0.01) });
    if (!cod && payStatus !== "PENDING" && payStatus !== "FAILED") events.push({ type: "payment:PAID", message: "Payment received via PayU", actor: "payu", createdAt: at(0.01) });
    if (progressed) events.push({ type: "status:CONFIRMED", message: cod ? "COD confirmed on WhatsApp" : null, actor: "admin:test", createdAt: at(0.2) });
    if (["PACKED", "SHIPPED", "DELIVERED", "RETURNED"].includes(plan.status)) events.push({ type: "status:PACKED", message: null, actor: "admin:test", createdAt: at(0.6) });
    if (["SHIPPED", "DELIVERED", "RETURNED"].includes(plan.status)) events.push({ type: "status:SHIPPED", message: "Handed to Delhivery", actor: "admin:test", createdAt: at(1) });
    if (plan.status === "DELIVERED") events.push({ type: "status:DELIVERED", message: null, actor: "delhivery", createdAt: at(4) });
    if (plan.status === "CANCELLED") events.push({ type: "status:CANCELLED", message: "Customer asked to cancel", actor: "admin:test", createdAt: at(0.3) });
    if (plan.status === "RETURNED") events.push({ type: "status:RETURNED", message: "Returned to origin (RTO)", actor: "delhivery", createdAt: at(7) });

    await db.order.create({
      data: {
        customerId: customer?.id ?? null,
        email,
        phone: address.phone,
        status: plan.status,
        paymentMethod: cod ? "COD" : "PAYU",
        paymentStatus: payStatus,
        shippingAddress: address,
        billingAddress: address,
        placeOfSupply: address.state,
        intraState: isIntraState(address.state),
        notes: rand() < 0.2 ? pick(["Please call before delivery", "Deliver after 6 pm", "Office address, Mon–Sat only"]) : null,
        subtotal,
        discount,
        total,
        couponId: useCoupon?.id ?? null,
        couponCode: useCoupon?.code ?? null,
        invoiceNumber: progressed ? `WM/2026-27/${String(n + 1).padStart(4, "0")}` : null,
        invoicedAt: progressed ? at(0.2) : null,
        cancelReason: plan.status === "CANCELLED" ? "Customer asked to cancel" : null,
        confirmedAt: progressed ? at(0.2) : null,
        shippedAt: ["SHIPPED", "DELIVERED", "RETURNED"].includes(plan.status) ? at(1) : null,
        deliveredAt: plan.status === "DELIVERED" ? at(4) : null,
        cancelledAt: plan.status === "CANCELLED" ? at(0.3) : null,
        createdAt: placedAt,
        items: { create: items },
        events: { create: events },
        payments: cod
          ? undefined
          : { create: { method: "PAYU", status: payStatus === "PENDING" ? "PENDING" : payStatus, amount: total, txnId: `TEST${Date.now()}${n}`, gatewayPaymentId: payStatus === "PAID" || payStatus === "REFUNDED" ? String(int(10000000, 99999999)) : null, refundedAmount: payStatus === "REFUNDED" ? total : 0, createdAt: placedAt } },
        shipments: plan.ship
          ? { create: { status: plan.ship, awb: plan.ship === "PENDING" ? null : `TEST${int(1000000000, 9999999999)}`, codAmount: cod ? total : 0, weightGrams: 400 * items.length, lastUpdate: plan.ship === "PENDING" ? null : "Scan received at Ahmedabad hub", shippedAt: plan.ship === "PENDING" ? null : at(1), deliveredAt: plan.ship === "DELIVERED" ? at(4) : null } }
          : undefined,
      },
    });
    if (useCoupon) await db.coupon.update({ where: { id: useCoupon.id }, data: { usedCount: { increment: 1 } } });
    created++;
  }

  console.log(`Created ${customers.length} test customers, ${created} test orders and ${coupons.length} test coupons.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
