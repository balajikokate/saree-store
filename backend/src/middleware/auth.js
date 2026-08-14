const jwt = require("jsonwebtoken");
const { ApiError } = require("./errorHandler");

/**
 * Protects /api/admin/* routes. Expects "Authorization: Bearer <token>".
 * There's a single admin account (credentials in .env) — no multi-user
 * roles/permissions system, by design, for a single-owner storefront.
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

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

module.exports = { requireAdmin };
