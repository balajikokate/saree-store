const crypto = require("crypto");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { markOrderPaid } = require("../services/orderFulfillment");

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay calls this endpoint directly from their servers whenever a
 * payment's status changes — independent of the customer's browser. This
 * is what makes payment confirmation reliable: even if the customer closes
 * the tab the instant payment succeeds (before the browser-side
 * /verify-payment call completes), this webhook still fires and confirms
 * the order.
 *
 * Configure this in the Razorpay Dashboard: Settings → Webhooks →
 * Add New Webhook, URL = https://your-backend.onrender.com/api/webhooks/razorpay,
 * events = payment.captured, payment.failed. Razorpay gives you a "webhook
 * secret" at that point — put it in RAZORPAY_WEBHOOK_SECRET in .env (this
 * is DIFFERENT from your regular RAZORPAY_KEY_SECRET).
 */
const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook call");
    return res.status(503).json({ success: false, message: "Webhook not configured" });
  }

  if (!req.rawBody) {
    // Should never happen (app.js captures this on every request), but
    // without the raw bytes we cannot safely verify the signature.
    console.error("[webhook] Missing raw request body — cannot verify signature");
    return res.status(500).json({ success: false, message: "Server misconfiguration" });
  }

  const expectedSignature = crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");

  if (expectedSignature !== signature) {
    console.warn("[webhook] Signature mismatch — rejecting (possible spoofed request)");
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body?.event;
  const payment = req.body?.payload?.payment?.entity;

  try {
    if ((event === "payment.captured" || event === "order.paid") && payment?.order_id) {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
      if (order) {
        await markOrderPaid({
          orderId: order.id,
          razorpayPaymentId: payment.id,
          // The webhook payload doesn't include the checkout-flow signature
          // (that's a different value, computed client-side); markOrderPaid
          // treats a null here as "keep whatever's already stored." Trust
          // for this path comes from the webhook's own HMAC signature,
          // verified above.
          razorpaySignature: null,
        });
      } else {
        console.warn(`[webhook] payment.captured for unknown razorpayOrderId: ${payment.order_id}`);
      }
    }

    if (event === "payment.failed" && payment?.order_id) {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
      if (order && order.status === "PENDING") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      }
    }
  } catch (err) {
    // Log but still return 200 below where possible — an internal error
    // processing the event shouldn't cause Razorpay to hammer retries
    // indefinitely on something that may keep failing the same way.
    // (If this becomes a real issue in practice, monitor these logs.)
    console.error("[webhook] Error processing event:", err.message || err);
  }

  // Acknowledge quickly so Razorpay doesn't retry unnecessarily.
  res.json({ success: true });
});

module.exports = { razorpayWebhook };
