const { sendEmail } = require("./notifications/email");

/**
 * Tracks failed admin login attempts per email and temporarily locks the
 * account after too many in a short window — independent of (and stricter
 * than) the general rate limiter on the route, which only slows requests
 * but doesn't lock the account or alert anyone.
 *
 * Storage is in-memory (a Map), which is intentional and matches how
 * express-rate-limit already works in this project by default: fine for a
 * single small Render instance. It resets on redeploy/restart — an
 * acceptable trade-off for a single-admin store. If this ever runs across
 * multiple server instances, this would need a shared store (e.g. Redis)
 * instead, same caveat that already applies to the rate limiter.
 */
const ATTEMPT_LIMIT = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const attempts = new Map(); // email -> { count, firstAttemptAt, alertSent }

function key(email) {
  return email.trim().toLowerCase();
}

function prune(record) {
  if (!record) return null;
  if (Date.now() - record.firstAttemptAt > LOCKOUT_WINDOW_MS) return null;
  return record;
}

function isLocked(email) {
  const record = prune(attempts.get(key(email)));
  return !!record && record.count >= ATTEMPT_LIMIT;
}

function recordFailedAttempt(email) {
  const k = key(email);
  const existing = prune(attempts.get(k));

  const record = existing
    ? { ...existing, count: existing.count + 1 }
    : { count: 1, firstAttemptAt: Date.now(), alertSent: false };

  attempts.set(k, record);

  if (record.count === ATTEMPT_LIMIT && !record.alertSent) {
    record.alertSent = true;
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: "Security alert — repeated failed admin login attempts",
        html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2A1E1B;">
            <h2 style="color: #6E1423;">Repeated failed login attempts</h2>
            <p style="font-size: 14px;">
              There have been ${ATTEMPT_LIMIT} failed login attempts for <strong>${k}</strong>
              in the last 15 minutes. The account is now temporarily locked.
            </p>
            <p style="font-size: 13px; color: #888;">
              If this wasn't you, no action is needed — the lockout expires automatically.
              If you're locked out yourself, wait 15 minutes and try again.
            </p>
          </div>
        `,
      }).catch((err) => console.error("[loginProtection] Failed to send lockout alert:", err.message || err));
    }
  }

  return record;
}

function resetAttempts(email) {
  attempts.delete(key(email));
}

module.exports = { isLocked, recordFailedAttempt, resetAttempts, ATTEMPT_LIMIT };
