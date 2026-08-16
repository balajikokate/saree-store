const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { streamInvoicePdf } = require("../services/invoice");
const {
  profileUpdateSchema,
  changePasswordSchema,
  addressSchema,
} = require("../utils/validators");

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone };
}

// -------------------- Profile --------------------

// PATCH /api/account/profile
const updateProfile = asyncHandler(async (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid profile data", parsed.error.flatten());

  const user = await prisma.user.update({
    where: { id: req.user.sub },
    data: parsed.data,
  });
  res.json({ success: true, data: publicUser(user) });
});

// POST /api/account/change-password
const changePassword = asyncHandler(async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid password data", parsed.error.flatten());
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) throw new ApiError(401, "Session invalid. Please log in again.");

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new ApiError(401, "Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  res.json({ success: true });
});

// -------------------- Addresses --------------------

// GET /api/account/addresses
const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.sub },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json({ success: true, data: addresses });
});

// POST /api/account/addresses
const createAddress = asyncHandler(async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid address data", parsed.error.flatten());

  const isFirstAddress = (await prisma.address.count({ where: { userId: req.user.sub } })) === 0;
  const shouldBeDefault = parsed.data.isDefault || isFirstAddress;

  if (shouldBeDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.sub }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { ...parsed.data, isDefault: shouldBeDefault, userId: req.user.sub },
  });
  res.status(201).json({ success: true, data: address });
});

// PUT /api/account/addresses/:id
const updateAddress = asyncHandler(async (req, res) => {
  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user.sub) throw new ApiError(404, "Address not found");

  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid address data", parsed.error.flatten());

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.sub }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  res.json({ success: true, data: address });
});

// DELETE /api/account/addresses/:id
const deleteAddress = asyncHandler(async (req, res) => {
  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user.sub) throw new ApiError(404, "Address not found");

  await prisma.address.delete({ where: { id: existing.id } });

  // If the deleted address was the default and other addresses remain,
  // promote the most recently added one to default so there's always a
  // sensible pre-fill choice at checkout.
  if (existing.isDefault) {
    const remaining = await prisma.address.findFirst({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
    });
    if (remaining) {
      await prisma.address.update({ where: { id: remaining.id }, data: { isDefault: true } });
    }
  }

  res.json({ success: true, data: { id: existing.id } });
});

// -------------------- Wishlist (synced across devices for logged-in customers) --------------------

// GET /api/account/wishlist
const listWishlist = asyncHandler(async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.sub },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
  res.json({ success: true, data: items.map((i) => i.product) });
});

// POST /api/account/wishlist  { productId }
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  if (!productId) throw new ApiError(400, "productId is required");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Product not found");

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user.sub, productId } },
    update: {},
    create: { userId: req.user.sub, productId },
  });
  res.status(201).json({ success: true });
});

// DELETE /api/account/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  await prisma.wishlistItem
    .delete({
      where: { userId_productId: { userId: req.user.sub, productId: req.params.productId } },
    })
    .catch(() => {}); // already removed — treat as success either way
  res.json({ success: true });
});

// -------------------- Order history --------------------

// GET /api/account/orders
const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.sub },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  res.json({ success: true, data: orders });
});

// GET /api/account/orders/:orderNumber
const getMyOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true },
  });
  if (!order || order.userId !== req.user.sub) throw new ApiError(404, "Order not found");
  res.json({ success: true, data: order });
});

// GET /api/account/orders/:orderNumber/invoice
const downloadMyInvoice = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true },
  });
  if (!order || order.userId !== req.user.sub) throw new ApiError(404, "Order not found");
  streamInvoicePdf(order, res);
});

module.exports = {
  updateProfile,
  changePassword,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listWishlist,
  addToWishlist,
  removeFromWishlist,
  listMyOrders,
  getMyOrder,
  downloadMyInvoice,
};
