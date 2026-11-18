// Razorpay payment webhook: marks orders as paid / failed.
// TODO: verify the X-Razorpay-Signature header with RAZORPAY_WEBHOOK_SECRET before trusting the body.
export async function POST() {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
