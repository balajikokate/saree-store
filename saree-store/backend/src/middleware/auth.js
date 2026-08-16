const jwt = require("jsonwebtoken");
const { ApiError } = require("./errorHandler");

const COOKIE_NAME = "admin_token";

/**
 * Protects /api/admin/* routes. Reads the session token from an httpOnly
 * cookie (set by POST /api/admin/login) rather than an Authorization
 * header — this means the token is never exposed to JavaScript at all
 * (not even our own frontend code can read it), which is what makes it
 * resistant to theft via an XSS bug elsewhere on the site.
 *
 * Also accepts a Bearer token as a fallback, purely for convenience when
 * testing the API directly with curl/Postman outside a browser — normal
 * browser-based admin panel usage always goes through the cookie.
 */
function requireAdmin(req, res, next) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const header = req.headers.authorization || "";
  const headerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = cookieToken || headerToken;

  if (!token) {
    return next(new ApiError(401, "Login required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") throw new Error("wrong role");
    req.admin = payload;
    next();
  } catch {
    next(new ApiError(401, "Your session has expired. Please log in again."));
  }
}

module.exports = { requireAdmin, COOKIE_NAME };
