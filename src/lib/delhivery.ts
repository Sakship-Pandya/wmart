import "server-only";
import type { ShipmentStatus } from "@/generated/prisma/enums";

// Delhivery (B2C / Last-Mile) API: pincode serviceability, shipment creation and tracking.
// Settings (.env / Vercel):
//   DELHIVERY_API_TOKEN        – account token (staging and live tokens are different)
//   DELHIVERY_BASE_URL         – https://staging-express.delhivery.com (test) or https://track.delhivery.com (live)
//   DELHIVERY_PICKUP_LOCATION  – warehouse name exactly as registered with Delhivery (case sensitive)
//   DELHIVERY_DEFAULT_WEIGHT_GRAMS – parcel weight used when booking (products have no weight yet), default 500
//   DELHIVERY_WEBHOOK_TOKEN    – shared secret Delhivery sends with status pushes (see /api/webhooks/delhivery)
// Without a token every function reports "not configured" and the site falls back to manual AWB entry.
//
// Request formats follow Delhivery's Last-Mile API reference (delhivery-express-api-doc.readme.io).
// Its pages disagree in places, so test once with the staging token before going live.

export class DelhiveryError extends Error {}

function config() {
  const token = process.env.DELHIVERY_API_TOKEN?.trim();
  if (!token) return null;
  return {
    token,
    base: (process.env.DELHIVERY_BASE_URL?.trim() || "https://staging-express.delhivery.com").replace(/\/+$/, ""),
    pickupLocation: process.env.DELHIVERY_PICKUP_LOCATION?.trim() ?? "",
    defaultWeight: Number(process.env.DELHIVERY_DEFAULT_WEIGHT_GRAMS) || 500,
  };
}

export function delhiveryConfigured(): boolean {
  return config() !== null;
}

async function call(path: string, init?: RequestInit): Promise<unknown> {
  const c = config();
  if (!c) throw new DelhiveryError("Delhivery isn't connected yet (DELHIVERY_API_TOKEN is not set).");
  const res = await fetch(`${c.base}${path}`, {
    ...init,
    headers: { Authorization: `Token ${c.token}`, Accept: "application/json", ...init?.headers },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  if (!res.ok) throw new DelhiveryError(`Delhivery responded ${res.status}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new DelhiveryError(`Unexpected Delhivery response: ${text.slice(0, 200)}`);
  }
}

// ---------- Pincode serviceability ----------

export type PincodeResult = { serviceable: boolean; cod: boolean; prepaid: boolean; city?: string; state?: string };

const pincodeCache = new Map<string, { at: number; result: PincodeResult }>();
const PINCODE_TTL_MS = 6 * 60 * 60 * 1000; // serviceability rarely changes – remember answers for 6 hours

/** Can Delhivery deliver to this pincode (and collect cash)? null when Delhivery isn't configured. */
export async function checkPincode(pin: string): Promise<PincodeResult | null> {
  if (!config()) return null;
  if (!/^[1-9]\d{5}$/.test(pin)) return { serviceable: false, cod: false, prepaid: false };
  const hit = pincodeCache.get(pin);
  if (hit && Date.now() - hit.at < PINCODE_TTL_MS) return hit.result;

  const data = (await call(`/c/api/pin-codes/json/?filter_codes=${pin}`)) as {
    delivery_codes?: { postal_code?: { pre_paid?: string; cod?: string; district?: string; state_code?: string } }[];
  };
  const code = data.delivery_codes?.[0]?.postal_code;
  const result: PincodeResult = code
    ? {
        prepaid: code.pre_paid === "Y",
        cod: code.cod === "Y",
        serviceable: code.pre_paid === "Y" || code.cod === "Y",
        city: code.district || undefined,
        state: code.state_code || undefined,
      }
    : { serviceable: false, cod: false, prepaid: false };
  pincodeCache.set(pin, { at: Date.now(), result });
  return result;
}

// ---------- Create shipment (manifest) ----------

export type ShipmentOrder = {
  orderNumber: string; // "WM10234" – must be unique per shipment at Delhivery
  createdAt: Date;
  paymentMethod: "COD" | "PAYU";
  total: number; // paise
  address: { fullName: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string };
  items: { title: string; quantity: number; hsnCode: string | null }[];
  seller: { name: string; gstin: string; address: string };
};

/** Delhivery rejects & # % ; \ in text fields. */
const safe = (s: string, max = 200) =>
  s.replace(/[&#%;\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const rupees = (paise: number) => Math.round(paise) / 100;

/** Books the parcel with Delhivery and returns its AWB (tracking number). */
export async function createShipment(o: ShipmentOrder): Promise<{ awb: string }> {
  const c = config();
  if (!c) throw new DelhiveryError("Delhivery isn't connected yet (DELHIVERY_API_TOKEN is not set).");
  if (!c.pickupLocation) throw new DelhiveryError("Set DELHIVERY_PICKUP_LOCATION to your warehouse name registered with Delhivery.");

  const a = o.address;
  const quantity = o.items.reduce((n, i) => n + i.quantity, 0);
  const payload = {
    shipments: [
      {
        name: safe(a.fullName, 100),
        add: safe([a.line1, a.line2].filter(Boolean).join(", ")),
        pin: a.pincode,
        city: safe(a.city, 60),
        state: safe(a.state, 60),
        country: "India",
        phone: a.phone,
        order: o.orderNumber,
        order_date: o.createdAt.toISOString(),
        payment_mode: o.paymentMethod === "COD" ? "COD" : "Prepaid",
        total_amount: rupees(o.total),
        cod_amount: o.paymentMethod === "COD" ? rupees(o.total) : 0,
        products_desc: safe(o.items.map((i) => `${i.title} x${i.quantity}`).join(", "), 300),
        quantity: String(quantity),
        hsn_code: o.items.map((i) => i.hsnCode).filter(Boolean).join(",") || undefined,
        weight: c.defaultWeight,
        shipping_mode: "Surface",
        seller_name: safe(o.seller.name, 100),
        seller_add: safe(o.seller.address),
        seller_gst_tin: o.seller.gstin || undefined,
        waybill: "", // single parcel: Delhivery assigns the AWB
      },
    ],
    pickup_location: { name: c.pickupLocation },
  };

  const body = new URLSearchParams({ format: "json", data: JSON.stringify(payload) });
  const data = (await call("/api/cmu/create.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })) as { success?: boolean; rmk?: string; packages?: { waybill?: string; status?: string; remarks?: string | string[] }[] };

  const pkg = data.packages?.[0];
  if (pkg?.waybill && pkg.status?.toLowerCase() !== "fail") return { awb: pkg.waybill };
  const why = [pkg?.remarks, data.rmk].flat().filter(Boolean).join(" · ");
  throw new DelhiveryError(`Delhivery didn't book the shipment${why ? `: ${why}` : "."}`);
}

// ---------- Tracking ----------

export type TrackingUpdate = { status: ShipmentStatus | null; text: string; at: Date | null };

/** Latest scan for an AWB (pull API – limited to 750 calls per 5 minutes, so use on demand). */
export async function trackShipment(awb: string): Promise<TrackingUpdate | null> {
  const data = (await call(`/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}`)) as {
    ShipmentData?: { Shipment?: { Status?: DelhiveryStatus } }[];
  };
  const s = data.ShipmentData?.[0]?.Shipment?.Status;
  return s ? toUpdate(s) : null;
}

export type DelhiveryStatus = {
  Status?: string;
  StatusType?: string;
  StatusDateTime?: string;
  StatusLocation?: string;
  Instructions?: string;
};

export function toUpdate(s: DelhiveryStatus): TrackingUpdate {
  const text = [s.Status, s.StatusLocation, s.Instructions].filter(Boolean).join(" · ").slice(0, 300);
  // Delhivery sends Indian time without a zone ("2026-11-25T16:40:00"); servers may run in UTC.
  const raw = s.StatusDateTime?.trim();
  const at = raw ? new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw.replace(" ", "T")}+05:30`) : null;
  return { status: mapStatus(s.StatusType, s.Status), text, at: at && !Number.isNaN(at.getTime()) ? at : null };
}

/**
 * Delhivery StatusType + Status → our ShipmentStatus. Codes from Delhivery's docs:
 * UD = forward journey (Manifested, Not Picked, In Transit, Pending, Dispatched), DL = delivered
 * (Status "RTO" = returned to us), RT = coming back to us. Unknown combinations return null
 * (the scan text is still saved) – Delhivery warns not to hard-code its flow.
 */
export function mapStatus(type?: string, status?: string): ShipmentStatus | null {
  const t = (type ?? "").toUpperCase();
  const s = (status ?? "").toLowerCase();
  if (s.includes("lost")) return "LOST";
  if (t === "DL") return s.includes("rto") ? "RTO_DELIVERED" : "DELIVERED";
  if (t === "RT") return "RTO_IN_TRANSIT";
  if (t === "UD" || t === "PU") {
    if (s.includes("dispatched") || s.includes("out for delivery")) return "OUT_FOR_DELIVERY";
    if (s.includes("picked up") || s.includes("pickup completed")) return "PICKED_UP";
    if (s.includes("in transit") || s === "pending") return "IN_TRANSIT";
    if (s.includes("manifest") || s.includes("not picked")) return "MANIFESTED";
  }
  return null;
}
