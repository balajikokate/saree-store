/**
 * Sends transactional email via Resend (https://resend.com) — free tier
 * covers a few thousand emails/month, simple API key setup, good
 * deliverability out of the box (no domain warm-up hassle like raw SMTP).
 *
 * If RESEND_API_KEY / RESEND_FROM_EMAIL aren't set, this silently no-ops
 * (logs a note) instead of throwing — so the store still works, just
 * without email notifications, until you configure it.
 */
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log(`[email] Skipped ("${subject}" to ${to}) — RESEND_API_KEY/RESEND_FROM_EMAIL not set`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${text}`);
  }
}

module.exports = { sendEmail };
