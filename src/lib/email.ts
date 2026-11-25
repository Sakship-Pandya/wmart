import "server-only";

// Sends email through Resend (https://resend.com) – one HTTPS call, no SDK.
// Settings (.env / Vercel):
//   RESEND_API_KEY  – from the Resend dashboard (re_…)
//   EMAIL_FROM      – a sender on a domain verified in Resend, e.g. "WMart <orders@wmart.co.in>"
//   SUPPORT_EMAIL   – where contact-form messages go (defaults to support@wmart.co.in)
// Without RESEND_API_KEY nothing is sent: emails are logged to the server console instead, so
// development works without an account. Callers check `sent` to tell the customer what happened.

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type EmailResult = { sent: true; id: string } | { sent: false; reason: "not-configured" | "failed" };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function supportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || "support@wmart.co.in";
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email not sent – RESEND_API_KEY / EMAIL_FROM not set] to=${[message.to].flat().join(", ")} subject="${message.subject}"`);
    // In development show the text too, so links (e.g. password reset) can be followed from the log.
    if (process.env.NODE_ENV !== "production") console.info(message.text);
    return { sent: false, reason: "not-configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`Resend error ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return { sent: false, reason: "failed" };
    }
    const body = (await res.json()) as { id?: string };
    return { sent: true, id: body.id ?? "" };
  } catch (err) {
    console.error("Resend request failed", err);
    return { sent: false, reason: "failed" };
  }
}
