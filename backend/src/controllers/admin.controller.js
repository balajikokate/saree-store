const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { slugify } = require("../middleware/upload");
const { streamInvoicePdf } = require("../services/invoice");

// ---------- Products ----------

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(5).max(3000),
  fabric: z.string().min(1).max(120),
  color: z.string().min(1).max(60),
  occasion: z.string().min(1).max(60),
  price: z.number().positive(),
  discountPrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  images: z.array(z.string()).min(1, "At least one image is required"),
  featured: z.boolean().optional(),
  categoryId: z.string().uuid(),
});

// GET /api/admin/products?search=&page=&limit=
const listAllProducts = asyncHandler(async (req, res) => {
  const { search, page = "1", limit = "20" } = req.query;
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { fabric: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
  });
});

// GET /api/admin/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, data: product });
});

function slugFromName(name) {
  return slugify(name);
}

// POST /api/admin/products
const createProduct = asyncHandler(async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid product data", parsed.error.flatten());
  const data = parsed.data;

  let slug = slugFromName(data.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const product = await prisma.product.create({
    data: { ...data, slug },
  });
  res.status(201).json({ success: true, data: product });
});

// PUT /api/admin/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid product data", parsed.error.flatten());

  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Product not found");

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ success: true, data: product });
});

// DELETE /api/admin/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Product not found");

  // Products referenced by past orders can't be hard-deleted (would break
  // order history) — mark out of stock instead so it disappears from the
  // storefront while preserving order records.
  const referencedByOrder = await prisma.orderItem.findFirst({ where: { productId: req.params.id } });
  if (referencedByOrder) {
    await prisma.product.update({ where: { id: req.params.id }, data: { stock: 0 } });
    return res.json({
      success: true,
      data: { softDeleted: true, message: "This product has past orders, so it was set to out-of-stock instead of deleted, to preserve order history." },
    });
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { deleted: true } });
});

// ---------- Categories ----------

// GET /api/admin/categories
const listCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json({ success: true, data: categories });
});

const categorySchema = z.object({ name: z.string().min(2).max(100) });

// POST /api/admin/categories
const createCategory = asyncHandler(async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid category data", parsed.error.flatten());

  const slug = slugify(parsed.data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new ApiError(400, "A category with this name already exists");

  const category = await prisma.category.create({ data: { name: parsed.data.name, slug } });
  res.status(201).json({ success: true, data: category });
});

// ---------- Image upload ----------

// POST /api/admin/upload-image  (multipart/form-data: image, category, filenamePrefix)
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file was uploaded");
  const category = slugify(req.body.category || "misc");
  const publicPath = `/images/products/${category}/${req.file.filename}`;
  res.status(201).json({ success: true, data: { path: publicPath } });
});

// ---------- Orders ----------

// GET /api/admin/orders?status=&page=&limit=
const listOrders = asyncHandler(async (req, res) => {
  const { status, page = "1", limit = "20" } = req.query;
  const where = status ? { status } : {};

  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
  });
});

// GET /api/admin/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, data: order });
});

// GET /api/admin/orders/:id/invoice
const downloadOrderInvoice = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  streamInvoicePdf(order, res);
});

const VALID_STATUSES = ["PENDING", "PAID", "FAILED", "SHIPPED", "DELIVERED", "CANCELLED"];

// PATCH /api/admin/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Order not found");

  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  res.json({ success: true, data: order });
});

// GET /api/admin/stats — dashboard numbers + chart data
const getDashboardStats = asyncHandler(async (req, res) => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13); // includes today = 14 days total
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [
    productCount,
    orderCount,
    revenue,
    lowStock,
    recentPaidOrders,
    statusGroups,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { totalAmount: true } }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    // Paid orders in the last 14 days, for the revenue trend chart
    prisma.order.findMany({
      where: { status: "PAID", createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, totalAmount: true },
    }),
    // Count of orders per status, for the status breakdown chart
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    // A handful of the most recent orders for a quick-glance list
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNumber: true, customerName: true, totalAmount: true, status: true, createdAt: true },
    }),
  ]);

  // Bucket the last 14 days' paid orders into per-day revenue totals,
  // including days with zero orders so the chart has a continuous x-axis.
  const revenueByDay = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    revenueByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const order of recentPaidOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (key in revenueByDay) revenueByDay[key] += Number(order.totalAmount);
  }
  const revenueTrend = Object.entries(revenueByDay).map(([date, total]) => ({ date, total }));

  const statusBreakdown = statusGroups.map((g) => ({ status: g.status, count: g._count._all }));

  // Top 5 best-selling products by quantity, across paid orders
  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    where: { order: { status: "PAID" } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });
  const topProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    name: p.productName,
    quantitySold: p._sum.quantity || 0,
  }));

  res.json({
    success: true,
    data: {
      productCount,
      orderCount,
      totalRevenue: revenue._sum.totalAmount || 0,
      lowStockCount: lowStock,
      revenueTrend,
      statusBreakdown,
      topProducts,
      recentOrders,
    },
  });
});

module.exports = {
  listAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategoriesAdmin,
  createCategory,
  uploadImage,
  listOrders,
  getOrderById,
  updateOrderStatus,
  downloadOrderInvoice,
  getDashboardStats,
};
