const jwt = require("jsonwebtoken");
const { ApiError } = require("./errorHandler");

const COOKIE_NAME = "customer_token";

function readToken(req) {
  return req.cookies?.[COOKIE_NAME] || null;
}

/**
 * Protects /api/account/* routes — requires a logged-in customer.
 * Uses the same httpOnly-cookie pattern as the admin session (see
 * middleware/auth.js) for the same reason: JavaScript can never read this
 * cookie, so it isn't stealable via an XSS bug elsewhere on the site.
 */
function requireCustomer(req, res, next) {
  const token = readToken(req);
  if (!token) return next(new ApiError(401, "Please log in to continue"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "customer") throw new Error("wrong role");
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, "Your session has expired. Please log in again."));
  }
}

/**
 * For routes that work for BOTH guests and logged-in customers — most
 * importantly checkout. If a valid session cookie is present, req.user is
 * populated (so the order gets linked to the account); if not, the request
 * just proceeds as a guest with req.user left undefined. Never blocks.
 */
function attachCustomerIfPresent(req, res, next) {
  const token = readToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role === "customer") req.user = payload;
  } catch {
    // Invalid/expired token on an optional-auth route — just treat as a
    // guest rather than failing the request.
  }
  next();
}

module.exports = { requireCustomer, attachCustomerIfPresent, COOKIE_NAME };
