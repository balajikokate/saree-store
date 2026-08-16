const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { couponSchema, couponValidateSchema } = require("../utils/validators");
const { evaluateCoupon } = require("../services/coupon");

// -------------------- Public --------------------

// POST /api/coupons/validate  { code, subtotal }
// Lets the checkout page show the discount BEFORE payment, using the exact
// same logic that checkout itself will enforce server-side — so what the
// customer sees here always matches what they're actually charged.
const validateCoupon = asyncHandler(async (req, res) => {
  const parsed = couponValidateSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid request", parsed.error.flatten());

  const result = await evaluateCoupon(parsed.data.code, parsed.data.subtotal);
  if (!result.valid) {
    return res.json({ success: false, message: result.message });
  }
  res.json({
    success: true,
    data: {
      code: result.coupon.code,
      discountAmount: result.discountAmount,
      type: result.coupon.type,
      value: Number(result.coupon.value),
    },
  });
});

// -------------------- Admin --------------------

function serializeCoupon(c) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    minOrderValue: Number(c.minOrderValue),
    maxDiscount: c.maxDiscount !== null ? Number(c.maxDiscount) : null,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    active: c.active,
    expiresAt: c.expiresAt,
    createdAt: c.createdAt,
  };
}

// GET /api/admin/coupons
const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: coupons.map(serializeCoupon) });
});

// POST /api/admin/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid coupon data", parsed.error.flatten());
  const data = parsed.data;

  const code = data.code.toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw new ApiError(409, "A coupon with this code already exists");

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: data.type,
      value: data.value,
      minOrderValue: data.minOrderValue ?? 0,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      active: data.active ?? true,
      expiresAt: data.expiresAt ?? null,
    },
  });
  res.status(201).json({ success: true, data: serializeCoupon(coupon) });
});

// PUT /api/admin/coupons/:id
const updateCoupon = asyncHandler(async (req, res) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Coupon not found");

  const parsed = couponSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid coupon data", parsed.error.flatten());
  const data = { ...parsed.data };
  if (data.code) data.code = data.code.toUpperCase();

  const coupon = await prisma.coupon.update({ where: { id: existing.id }, data });
  res.json({ success: true, data: serializeCoupon(coupon) });
});

// DELETE /api/admin/coupons/:id
const deleteCoupon = asyncHandler(async (req, res) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Coupon not found");
  await prisma.coupon.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { id: existing.id } });
});

module.exports = { validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon };
