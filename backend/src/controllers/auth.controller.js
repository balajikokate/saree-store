const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");

// POST /api/admin/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
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
    throw new ApiError(401, "Incorrect email or password");
  }

  if (!process.env.JWT_SECRET) {
    throw new ApiError(503, "Admin login isn't configured. Set JWT_SECRET in backend/.env.");
  }

  const token = jwt.sign({ role: "admin", email: validEmail }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ success: true, data: { token, email: validEmail } });
});

// GET /api/admin/me — lets the frontend validate a stored token on load
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { email: req.admin.email } });
});

module.exports = { login, me };
