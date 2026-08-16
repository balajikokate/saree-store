const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { reviewSchema } = require("../utils/validators");

async function recalculateProductRating(productId, tx = prisma) {
  const agg = await tx.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      reviewCount: agg._count._all,
    },
  });
}

// GET /api/products/:slug/reviews
const listReviews = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new ApiError(404, "Product not found");

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  res.json({
    success: true,
    data: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      verified: r.verified,
      createdAt: r.createdAt,
      customerName: r.user.name,
    })),
  });
});

// POST /api/products/:slug/reviews  (requireCustomer)
// One review per customer per product — resubmitting updates the existing
// one rather than creating a duplicate (enforced by a DB unique constraint
// as the real guarantee; this upsert just makes that seamless for the UI).
const createOrUpdateReview = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new ApiError(404, "Product not found");

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid review", parsed.error.flatten());

  // "Verified purchase" — true only if this customer has a PAID order that
  // actually contains this product. Computed server-side so it can't be
  // faked from the client.
  const verifiedPurchase = await prisma.order.findFirst({
    where: {
      userId: req.user.sub,
      status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      items: { some: { productId: product.id } },
    },
  });

  const review = await prisma.review.upsert({
    where: { productId_userId: { productId: product.id, userId: req.user.sub } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment, verified: !!verifiedPurchase },
    create: {
      productId: product.id,
      userId: req.user.sub,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      verified: !!verifiedPurchase,
    },
  });

  await recalculateProductRating(product.id);

  res.status(201).json({ success: true, data: review });
});

// -------------------- Admin moderation --------------------

// GET /api/admin/reviews
const listAllReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
  });
  res.json({ success: true, data: reviews });
});

// DELETE /api/admin/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Review not found");
  await prisma.review.delete({ where: { id: existing.id } });
  await recalculateProductRating(existing.productId);
  res.json({ success: true, data: { id: existing.id } });
});

module.exports = { listReviews, createOrUpdateReview, listAllReviews, deleteReview };
