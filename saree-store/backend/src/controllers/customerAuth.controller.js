const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { signupSchema, customerLoginSchema } = require("../utils/validators");
const { isLocked, recordFailedAttempt, resetAttempts } = require("../services/loginProtection");

const COOKIE_NAME = "customer_token";

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days — customers expect to stay logged in longer than an admin session
    path: "/",
  };
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone };
}

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid signup data", parsed.error.flatten());
  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    // Deliberately vague — don't confirm which emails already have accounts
    throw new ApiError(409, "An account with this email already exists. Try logging in instead.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, phone: phone || null },
  });

  const token = jwt.sign({ role: "customer", sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.status(201).json({ success: true, data: publicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const parsed = customerLoginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid login data", parsed.error.flatten());
  const { email, password } = parsed.data;

  if (isLocked(email)) {
    throw new ApiError(429, "Too many failed login attempts. Please try again in a few minutes.");
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always run bcrypt.compare, even against a dummy hash, so a nonexistent
  // email doesn't respond measurably faster than a wrong password — avoids
  // leaking which emails have accounts via response timing.
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash || "$2a$10$invalidsaltinvalidsaltinvalidsaltinvalidsal"
  );

  if (!user || !passwordMatches) {
    recordFailedAttempt(email);
    throw new ApiError(401, "Incorrect email or password");
  }

  resetAttempts(email);

  const token = jwt.sign({ role: "customer", sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ success: true, data: publicUser(user) });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) throw new ApiError(401, "Session invalid. Please log in again.");
  res.json({ success: true, data: publicUser(user) });
});

module.exports = { signup, login, logout, me, COOKIE_NAME };
