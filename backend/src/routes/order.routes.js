const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const {
  checkout,
  verifyPayment,
  getOrderByNumber,
} = require("../controllers/order.controller");

// Limit checkout attempts to reduce abuse / accidental double submits
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many checkout attempts. Please try again shortly." },
});

router.post("/orders/checkout", checkoutLimiter, checkout);
router.post("/orders/verify-payment", checkoutLimiter, verifyPayment);
router.get("/orders/:orderNumber", getOrderByNumber);

module.exports = router;
