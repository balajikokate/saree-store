/**
 * Sends SMS or WhatsApp messages via Twilio (https://twilio.com).
 * One Twilio account covers both channels — SMS uses a regular Twilio
 * phone number; WhatsApp uses Twilio's WhatsApp sender (sandbox for
 * testing, or an approved WhatsApp Business sender for production).
 *
 * If Twilio env vars aren't set, this silently no-ops instead of throwing.
 *
 * IMPORTANT LIMITATIONS TO KNOW ABOUT:
 * - Twilio TRIAL accounts can only send to phone numbers you've manually
 *   verified in the Twilio console — fine for testing, not for real customers.
 * - Twilio WhatsApp SANDBOX requires the recipient to first send a "join
 *   <code>" message to the sandbox number — fine for testing your own
 *   number, not usable for real customers until you complete Meta's
 *   WhatsApp Business API approval (a separate, longer process).
 * See README.md "Order Notifications" section for setup details.
 */
async function sendTwilioMessage({ to, body, whatsapp = false }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = whatsapp ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;

  const channel = whatsapp ? "whatsapp" : "sms";

  if (!sid || !token || !from) {
    console.log(`[${channel}] Skipped (to ${to}) — Twilio env vars not set`);
    return;
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({
    To: whatsapp ? `whatsapp:${to}` : to,
    From: whatsapp ? `whatsapp:${from}` : from,
    Body: body,
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio API error (${res.status}) [${channel}]: ${text}`);
  }
}

module.exports = { sendTwilioMessage };
