import crypto from "node:crypto";
import { toUpdate, type DelhiveryStatus } from "@/lib/delhivery";
import { applyTrackingUpdate } from "@/server/shipments";

// Delhivery status pushes (manifested, in transit, out for delivery, delivered, RTO...).
// Delhivery is the only courier (same as the old site).
//
// Set-up: ask Delhivery (lastmile-integration@delhivery.com) to push scans to
//   https://<your domain>/api/webhooks/delhivery
// with the header   Authorization: Bearer <DELHIVERY_WEBHOOK_TOKEN>
// (any long random value you choose, also saved in Vercel). Delhivery says set-up takes 5–6 working days.
// Sample payload from Delhivery's docs: { "Shipment": { "AWB": "...", "Status": { "Status": "Manifested",
//   "StatusType": "UD", "StatusDateTime": "...", "StatusLocation": "...", "Instructions": "..." } } }

type Push = { Shipment?: { AWB?: string; Status?: DelhiveryStatus } };

function authorised(request: Request): boolean {
  const expected = process.env.DELHIVERY_WEBHOOK_TOKEN?.trim();
  if (!expected) return false; // never trust pushes until a token is configured
  const given = (request.headers.get("authorization") ?? "").replace(/^(Bearer|Token)\s+/i, "").trim();
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept one scan or a list of scans.
  const pushes = (Array.isArray(body) ? body : [body]) as Push[];
  let applied = 0;
  for (const push of pushes.slice(0, 100)) {
    const awb = push?.Shipment?.AWB;
    const status = push?.Shipment?.Status;
    if (typeof awb !== "string" || !status) continue;
    try {
      if (await applyTrackingUpdate(awb, toUpdate(status), "delhivery")) applied++;
    } catch (err) {
      console.error(`Delhivery push for AWB ${awb} failed`, err);
      return Response.json({ error: "Could not save the update" }, { status: 500 }); // let Delhivery retry
    }
  }
  // Delhivery expects 200 OK with "Success". Unknown AWBs are acknowledged so they aren't retried forever.
  return new Response("Success", { status: 200, headers: { "X-Applied": String(applied) } });
}
