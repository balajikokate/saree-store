const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { isLocked, recordFailedAttempt, resetAttempts, ATTEMPT_LIMIT } = require("../services/loginProtection");

const COOKIE_NAME = "admin_token";

// Cookie settings differ between local dev and production because the
// frontend and backend run on different origins in both cases, but only
// production is served over HTTPS — and browsers require Secure cookies
// for SameSite=None (needed for cross-site requests). Locally, SameSite=Lax
// over plain HTTP still works fine between two localhost ports.
function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // JavaScript can never read this cookie — the core XSS defense
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches the JWT's own expiry
    path: "/",
  };
}

// POST /api/admin/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  if (isLocked(email)) {
    throw new ApiError(
      429,
      `Too many failed login attempts. This account is temporarily locked — try again in a few minutes.`
    );
  }

  const validEmail = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!validEmail || !passwordHash) {
    throw new ApiError(
      503,
      "Admin login isn't configured yet. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in backend/.env (see scripts/hash-password.js)."
    );
  }

  const emailMatches = email.trim().toLowerCase() === validEmail.trim().toLowerCase();
  // Always run bcrypt.compare even if the email didn't match, so a wrong
  // email doesn't return faster than a wrong password (avoids leaking which
  // part was incorrect via response timing).
  const passwordMatches = await bcrypt.compare(password, passwordHash);

  if (!emailMatches || !passwordMatches) {
    recordFailedAttempt(email);
    throw new ApiError(401, "Incorrect email or password");
  }

  if (!process.env.JWT_SECRET) {
    throw new ApiError(503, "Admin login isn't configured. Set JWT_SECRET in backend/.env.");
  }

  resetAttempts(email);

  const token = jwt.sign({ role: "admin", email: validEmail }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // The token lives ONLY in an httpOnly cookie — never in the JSON response
  // body, and never in localStorage/JS-readable storage. This means a
  // successful XSS injection elsewhere on the site still cannot steal the
  // admin session, since client-side JavaScript has no way to read this
  // cookie's value at all.
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ success: true, data: { email: validEmail } });
});

// POST /api/admin/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

// GET /api/admin/me — lets the frontend check whether the session cookie
// (sent automatically by the browser) is still valid.
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { email: req.admin.email } });
});

// POST /api/admin/unlock-lockout
// Emergency escape hatch: clears the failed-attempt lockout for an email,
// given a secret from .env — deliberately separate from the admin
// password, since the whole point is this needs to work even when you
// genuinely can't log in. Without this, the only ways to clear a lockout
// were waiting 15 minutes or redeploying the whole backend.
const unlockLockout = asyncHandler(async (req, res) => {
  const { email, secret } = req.body || {};
  const configuredSecret = process.env.ADMIN_UNLOCK_SECRET;

  if (!configuredSecret) {
    throw new ApiError(
      503,
      "Emergency unlock isn't configured. Set ADMIN_UNLOCK_SECRET in backend/.env to enable it."
    );
  }
  if (!email || !secret) {
    throw new ApiError(400, "email and secret are required");
  }

  // Timing-safe comparison — a plain === would leak how many leading
  // characters matched via response-time differences, which matters for a
  // secret exactly like this one.
  const provided = Buffer.from(String(secret));
  const expected = Buffer.from(configuredSecret);
  const matches =
    provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

  if (!matches) {
    throw new ApiError(401, "Incorrect unlock secret");
  }

  resetAttempts(email);
  res.json({ success: true, message: `Lockout cleared for ${email}. You can log in now.` });
});

module.exports = { login, logout, me, unlockLockout, COOKIE_NAME };
