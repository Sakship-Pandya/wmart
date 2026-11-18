// Shiprocket tracking webhook: updates shipment status (shipped, delivered, RTO...).
// TODO: check the shared token Shiprocket sends before trusting the body.
export async function POST() {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
