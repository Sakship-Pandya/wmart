// PayU payment callback / webhook: marks orders as paid or failed.
// PayU is the only payment gateway (same as the old site).
// TODO:
// - Checkout posts the customer to PayU with a SHA-512 hash of
//   key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||SALT
// - PayU sends the result back here (surl / furl and the server-to-server webhook).
//   Recompute the reverse hash with PAYU_SALT and compare it before trusting the body,
//   and check the amount matches the order total.
export async function POST() {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
