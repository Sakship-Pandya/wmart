# Orders schema: draft for review

The draft tables are at the end of `prisma/schema.prisma` (section "Phase 2").
**No migration has been created yet.** Once both of us agree, one person runs
`npm run db:migrate -- --name orders` and commits the migration folder; the
other pulls and runs `npx prisma migrate dev`.

The migration only **adds** tables and enums. It does not change or drop any
existing table, so product data is safe.

## New tables

| Table | What it holds | Used by |
|---|---|---|
| `Customer` | Email, optional password hash (guests have none), name, phone | Login/register, Account details |
| `Address` | One saved `SHIPPING` and one `BILLING` address per customer | Account → Addresses, checkout prefill |
| `Order` | Order number (`WM` + number), contact, status, payment method/status, address snapshots, totals, coupon, GST invoice number | Checkout, Account → Orders, Track order, Admin → Orders |
| `OrderItem` | Snapshot of each line: title, slug, image, HSN, GST rate, unit price, MRP, qty | Order details, invoice |
| `OrderEvent` | Timeline: status changes, notes, PayU/Delhivery events | Admin order page |
| `Payment` | PayU attempt: our `txnId`, PayU `mihpayid`, amount, status, verified callback body | PayU webhook, refunds |
| `Shipment` | Delhivery AWB, status, COD amount to collect | Delhivery webhook, Track order |
| `Coupon` | Code, percent or flat, minimum order, cap, dates, usage limits | Cart coupon form, Account → Coupons, Admin → Coupons |

The cart stays in the cookie (`src/lib/cart-cookie.ts`); there is no Cart table.

## How it matches the checkout form

| Checkout field | Stored in |
|---|---|
| `email` | `Order.email` (+ `Customer.email` if signed in) |
| `shipping.fullName/phone/line1/line2/city/state/pincode` | `Order.shippingAddress` (JSON snapshot); `phone` also in `Order.phone` |
| `billingSameAsShipping` / `billing.*` | `Order.billingAddress` (copy of shipping when the box is ticked) |
| `paymentMethod` = `payu` / `cod` | `Order.paymentMethod` = `PAYU` / `COD` |
| `notes` | `Order.notes` |
| Buyer's state | `Order.placeOfSupply` + `Order.intraState` → `splitInclusivePrice()` in `src/lib/gst.ts` |

## Rules both sides should follow

- All money in **paise** (`Int`), GST included, like `Product.price`.
- At checkout, **re-read prices from the database** (as `getCart()` does), never trust the browser.
- Create the order, its items and the stock decrement in **one transaction**.
- PayU: mark `PAID` only after verifying the reverse hash **and** that the amount equals `Order.total`.
- Order lookup (Track order) needs order number **and** the matching email/phone.

## Decisions needed before migrating

1. **Seller state** (from the GSTIN) – decides `intraState`. Put it in config, not the database.
2. **COD**: extra fee? maximum order value for COD?
3. **Shipping fee**: free on all orders (current site), or a fee below some amount?
4. **First order number**: the old site's last order number, so new numbers don't overlap.
5. **Invoice number format**, e.g. `WM/2026-27/0001` (must restart each financial year).
6. **Customer login**: email + password (current register form) – sessions via cookie/JWT or Auth.js?
   This decides whether we need a `Session` table.
7. Is anything missing that the store UI needs to show? (e.g. estimated delivery date, GSTIN for B2B invoices)
