// Delhivery tracking updates: shipment status (manifested, in transit, delivered, RTO...).
// Delhivery is the only courier (same as the old site).
// TODO: check the token Delhivery is configured to send before trusting the body.
export async function POST() {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
