const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { getRazorpay } = require("../config/razorpay");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { checkoutSchema, verifyPaymentSchema } = require("../utils/validators");
const { markOrderPaid } = require("../services/orderFulfillment");
const { evaluateCoupon } = require("../services/coupon");
const { streamInvoicePdf } = require("../services/invoice");

const SHIPPING_FLAT_FEE = 0; // free shipping storewide; change if needed
const FREE_SHIPPING_THRESHOLD = 1999;
const GIFT_WRAP_FEE = 49;

// The order number doubles as a public "access key" — anyone who has it can
// look up the order's name/address/phone with no login (this is what makes
// guest checkout confirmation possible without an account). A short/
// sequential suffix would make other people's orders guessable by brute
// force. A cryptographically random 8-character suffix makes that
// practically infeasible (36^8 ≈ 2.8 trillion combinations) while staying
// short enough to read aloud or type into a support ticket.
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(6).toString("base64url").slice(0, 8).toUpperCase();
  return `SS-${date}-${suffix}`;
}

/**
 * POST /api/orders/checkout
 * Body: { customer: {...}, items: [{ productId, quantity }] }
 *
 * Prices are NEVER trusted from the client — we look up the current
 * discountPrice/price for each product from the database and compute
 * the total server-side. This prevents price tampering from the browser.
 */
const checkout = asyncHandler(async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid checkout data", parsed.error.flatten());
  }
  const { customer, items, couponCode, giftWrap, giftNote } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new ApiError(400, "One or more items in your cart are no longer available");
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = productMap[item.productId];
    if (product.stock < item.quantity) {
      throw new ApiError(400, `"${product.name}" only has ${product.stock} unit(s) left in stock`);
    }
    const unitPrice = Number(product.discountPrice ?? product.price);
    subtotal += unitPrice * item.quantity;
    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      price: unitPrice,
      quantity: item.quantity,
    });
  }

  // Coupon discount is validated server-side, same as prices — never trust
  // a discount amount from the client, only ever the code itself.
  let discountAmount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const result = await evaluateCoupon(couponCode, subtotal);
    if (!result.valid) throw new ApiError(400, result.message);
    discountAmount = result.discountAmount;
    appliedCouponCode = result.coupon.code;
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE || 49;
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;
  const totalAmount = Math.max(subtotal + shippingFee + giftWrapFee - discountAmount, 0);

  // Create the order in our DB first (status PENDING)
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: req.user?.sub || null, // linked if logged in, null for guest checkout
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone,
      addressLine: customer.addressLine,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      subtotal,
      shippingFee,
      couponCode: appliedCouponCode,
      discountAmount,
      giftWrap: !!giftWrap,
      giftWrapFee,
      giftNote: giftWrap ? giftNote || null : null,
      totalAmount,
      items: { create: orderItemsData },
    },
  });

  // Create the matching Razorpay order (amount is in paise)
  const razorpay = getRazorpay();
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order.id },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

/**
 * POST /api/orders/verify-payment
 * Verifies the Razorpay signature server-side, marks the order PAID,
 * and decrements stock. This is the source of truth for payment success —
 * never trust a client-side "payment succeeded" callback alone.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const parsed = verifyPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid payment verification payload", parsed.error.flatten());
  }
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, "Order/payment mismatch");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    throw new ApiError(400, "Payment signature verification failed");
  }

  // Signature valid — mark paid and decrement stock, idempotently. If
  // Razorpay's webhook already processed this exact order (a race is
  // possible: webhook and browser can both arrive close together),
  // markOrderPaid detects that and safely skips reprocessing.
  await markOrderPaid({
    orderId: order.id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  res.json({ success: true, data: { orderNumber: order.orderNumber } });
});

// GET /api/orders/:orderNumber — used by the order confirmation page
const getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, data: order });
});

// GET /api/orders/:orderNumber/invoice — downloadable PDF invoice.
// Same public access model as the order lookup above: the order number
// itself is the access key (see the comment on generateOrderNumber for why
// that's safe — it's cryptographically random, not guessable).
const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  streamInvoicePdf(order, res);
});

module.exports = { checkout, verifyPayment, getOrderByNumber, downloadInvoice };
