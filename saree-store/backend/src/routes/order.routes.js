const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { attachCustomerIfPresent } = require("../middleware/customerAuth");
const {
  checkout,
  verifyPayment,
  getOrderByNumber,
  downloadInvoice,
} = require("../controllers/order.controller");
const { validateCoupon } = require("../controllers/coupon.controller");

// Limit checkout attempts to reduce abuse / accidental double submits
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many checkout attempts. Please try again shortly." },
});

// attachCustomerIfPresent never blocks the request — if the browser sends a
// valid customer session cookie, the resulting order gets linked to that
// account (for order history); if not, checkout proceeds as a guest exactly
// as before. Nothing about the guest flow changes.
router.post("/orders/checkout", checkoutLimiter, attachCustomerIfPresent, checkout);
router.post("/orders/verify-payment", checkoutLimiter, verifyPayment);
router.get("/orders/:orderNumber", getOrderByNumber);
router.get("/orders/:orderNumber/invoice", downloadInvoice);
router.post("/coupons/validate", validateCoupon);

module.exports = router;
