const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { slugify } = require("../middleware/upload");
const { streamInvoicePdf } = require("../services/invoice");

// ---------- Products ----------

const HEX_PATTERN = /^#?[0-9A-Fa-f]{6}$/;

const productVariantSchema = z.object({
  color: z
    .string()
    .min(1, "Color name is required")
    .max(50)
    .refine((v) => !HEX_PATTERN.test(v.trim()), {
      message: 'Enter a color NAME (e.g. "Royal Blue"), not a hex code — use the hex field for that',
    }),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color like #1B3A6B")
    .optional()
    .or(z.literal("")),
  stock: z.number().int().min(0),
  images: z.array(z.string()).max(10).optional(),
  sku: z.string().max(50).optional().or(z.literal("")),
});

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(5).max(3000),
  fabric: z.string().min(1).max(120),
  // Optional here on purpose: when `variants` is provided (the saree
  // comes in multiple colors), color/stock are DERIVED server-side from
  // the variants list below instead of being typed twice by the admin.
  // Required only for single-color products (no variants) — enforced in
  // createProduct below, since a plain ZodObject is needed here for
  // `.partial()` to work in updateProduct (z.ZodEffects from
  // .superRefine() doesn't support .partial()).
  color: z.string().min(1).max(60).optional(),
  occasion: z.string().min(1).max(60),
  price: z.number().positive(),
  discountPrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  featured: z.boolean().optional(),
  categoryId: z.string().uuid(),
  // Per-color stock tracking — when provided (non-empty), the storefront
  // shows a color picker and checks/decrements THIS stock per color
  // instead of a single top-level stock number. See ProductVariant in
  // schema.prisma for the full reasoning.
  variants: z.array(productVariantSchema).max(20).optional(),
});

// Derives the top-level color/stock fields from variants when present, so
// they stay consistent for anything that still reads product.color /
// product.stock directly (e.g. filtering by color, admin product list).
function deriveColorAndStock(data) {
  if (!data.variants || data.variants.length === 0) {
    return { color: data.color, stock: data.stock };
  }
  return {
    color: data.variants.map((v) => v.color).join(", "),
    stock: data.variants.reduce((sum, v) => sum + v.stock, 0),
  };
}

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
      include: { category: { select: { name: true, slug: true } }, variants: true },
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
    include: { category: true, variants: true },
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
  const { variants, ...data } = parsed.data;

  const hasVariants = variants && variants.length > 0;
  if (hasVariants) {
    const colors = variants.map((v) => v.color.trim().toLowerCase());
    if (new Set(colors).size !== colors.length) {
      throw new ApiError(400, "Each color variant must be unique");
    }
  } else if (!data.color || data.stock === undefined) {
    throw new ApiError(400, "Invalid product data", {
      message: "Provide either a color + stock, or at least one color variant.",
    });
  }

  const { color, stock } = deriveColorAndStock({ ...data, variants });

  let slug = slugFromName(data.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const product = await prisma.product.create({
    data: {
      ...data,
      color,
      stock,
      slug,
      ...(hasVariants
        ? { variants: { create: variants.map((v) => ({ ...v, sku: v.sku || null, colorHex: v.colorHex || null })) } }
        : {}),
    },
    include: { variants: true },
  });
  res.status(201).json({ success: true, data: product });
});

// PUT /api/admin/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid product data", parsed.error.flatten());
  const { variants, ...data } = parsed.data;

  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Product not found");

  if (variants) {
    const colors = variants.map((v) => v.color.trim().toLowerCase());
    if (new Set(colors).size !== colors.length) {
      throw new ApiError(400, "Each color variant must be unique");
    }
  }

  // If variants are part of this update, derive color/stock from them so
  // the top-level fields stay in sync (e.g. for the admin products table,
  // and anything filtering by product.color). If variants weren't touched
  // in this request, leave color/stock exactly as submitted (or untouched,
  // for a partial update that doesn't mention them).
  const derivedData =
    variants !== undefined
      ? { ...data, ...deriveColorAndStock({ ...data, variants }) }
      : data;

  const product = await prisma.$transaction(async (tx) => {
    if (variants) {
      // Replace-all: simplest correct approach, mirrors how the images
      // array is already just overwritten wholesale on every save. Safe
      // even for variants referenced by past orders — see the onDelete:
      // SetNull note on OrderItem.variant in schema.prisma.
      await tx.productVariant.deleteMany({ where: { productId: req.params.id } });
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v) => ({
            productId: req.params.id,
            color: v.color,
            colorHex: v.colorHex || null,
            stock: v.stock,
            images: v.images || [],
            sku: v.sku || null,
          })),
        });
      }
    }
    return tx.product.update({
      where: { id: req.params.id },
      data: derivedData,
      include: { variants: true },
    });
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
