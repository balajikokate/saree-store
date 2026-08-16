const prisma = require("../lib/prisma");
const { sendOrderNotifications } = require("./notifications");

/**
 * Marks an order as PAID and decrements stock — but ONLY if it isn't
 * already PAID. This function can safely be called twice for the same
 * order (e.g. once from the customer's browser via /verify-payment, and
 * once from Razorpay's server-to-server webhook, which can genuinely race
 * against each other in production) without double-decrementing stock or
 * sending duplicate notifications.
 *
 * SAFETY NOTE: the status transition uses `updateMany` with a
 * `status: { not: "PAID" }` WHERE clause, NOT a "read status, then decide,
 * then update" pattern. This matters — under Postgres's default READ
 * COMMITTED isolation, a "read-then-write" check is NOT safe against two
 * concurrent calls (both could read "not yet paid" before either commits,
 * and both would proceed). An UPDATE...WHERE is different: Postgres
 * serializes concurrent UPDATEs to the same row via a row lock, and the
 * second UPDATE re-evaluates its WHERE clause against the now-committed
 * row — so only ONE of the two concurrent calls can ever see count > 0.
 * This is the standard atomic "compare-and-swap" pattern for exactly this
 * kind of race, and it's the reason this function is safe to call from
 * both the webhook and the browser-facing endpoint without extra locking.
 *
 * Returns { order, justPaid }. `order` is null if the order doesn't exist.
 * `justPaid` is false if the order was already PAID before this call (the
 * caller should treat that as "already handled", not as a new event).
 */
async function markOrderPaid({ orderId, razorpayPaymentId, razorpaySignature }) {
  const paidOrder = await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: { not: "PAID" } },
      data: {
        status: "PAID",
        ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
        ...(razorpaySignature ? { razorpaySignature } : {}),
      },
    });

    // count === 0 means either the order doesn't exist, or it was already
    // PAID (possibly by the other call in the race described above).
    // Either way, there's nothing further to do here.
    if (count === 0) return null;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return null;

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Coupon usage is only counted once the order actually gets paid (not
    // at checkout time) — this same transaction guarantees it increments
    // exactly once even under the webhook/browser race described above.
    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return order;
  });

  if (paidOrder) {
    // Fire-and-forget: notification failures must never break checkout or
    // the webhook response. Errors are logged inside sendOrderNotifications
    // itself (per-channel), not thrown here.
    sendOrderNotifications(paidOrder).catch((err) => {
      console.error("[notifications] Failed to send order notifications:", err.message || err);
    });
  }

  return { order: paidOrder, justPaid: !!paidOrder };
}

module.exports = { markOrderPaid };
