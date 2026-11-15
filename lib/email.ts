/**
 * Minimal transactional email via Resend's REST API (https://resend.com).
 * Requires RESEND_API_KEY and EMAIL_FROM (e.g. "ConnectLive <no-reply@yourdomain.com>").
 * Without RESEND_API_KEY, emails are logged to the server console instead of sent,
 * which keeps local development working.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "ConnectLive <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — not sending. To: ${opts.to}\n${opts.text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
  });

  if (!res.ok) {
    throw new Error(`[email] Resend error ${res.status}: ${await res.text()}`);
  }
}
