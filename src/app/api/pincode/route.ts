import { checkPincode, DelhiveryError } from "@/lib/delhivery";
import { tooManyAttempts } from "@/lib/rate-limit";

// Delivery check for the "Check delivery" box: GET /api/pincode?pin=380058
// → { configured, serviceable, cod, city, state }. configured=false when Delhivery isn't set up yet.
export async function GET(request: Request) {
  const pin = (new URL(request.url).searchParams.get("pin") ?? "").trim();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (tooManyAttempts(`pincode:${ip}`, 30, 5 * 60 * 1000)) {
    return Response.json({ error: "Too many checks – please wait a few minutes." }, { status: 429 });
  }
  if (!/^[1-9]\d{5}$/.test(pin)) return Response.json({ error: "Enter a 6-digit pincode." }, { status: 400 });
  try {
    const result = await checkPincode(pin);
    if (!result) return Response.json({ configured: false });
    return Response.json({ configured: true, ...result });
  } catch (err) {
    console.error("pincode check failed", err instanceof DelhiveryError ? err.message : err);
    return Response.json({ error: "Couldn't check right now – please try again." }, { status: 502 });
  }
}
