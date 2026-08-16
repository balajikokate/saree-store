const prisma = require("../lib/prisma");

/**
 * Validates a coupon code against a subtotal and returns the discount it
 * would apply. Returns { valid: false, message } on any failure, or
 * { valid: true, coupon, discountAmount } on success. Centralized here so
 * checkout and the "preview before you pay" endpoint can never disagree
 * about whether a coupon applies.
 */
async function evaluateCoupon(code, subtotal) {
  if (!code) return { valid: false, message: "Enter a coupon code" };

  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon) return { valid: false, message: "Invalid coupon code" };
  if (!coupon.active) return { valid: false, message: "This coupon is no longer active" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: "This coupon has expired" };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }
  if (Number(coupon.minOrderValue) > 0 && subtotal < Number(coupon.minOrderValue)) {
    return {
      valid: false,
      message: `Add ${Number(coupon.minOrderValue) - subtotal > 0 ? "more" : ""} items — this code needs a minimum order of ₹${Number(coupon.minOrderValue)}`,
    };
  }

  let discountAmount;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = (subtotal * Number(coupon.value)) / 100;
    if (coupon.maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else {
    discountAmount = Number(coupon.value);
  }
  // Never let a coupon discount more than the order is worth
  discountAmount = Math.min(discountAmount, subtotal);
  discountAmount = Math.round(discountAmount * 100) / 100;

  return { valid: true, coupon, discountAmount };
}

module.exports = { evaluateCoupon };
