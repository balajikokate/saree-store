const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");

/**
 * GET /api/products
 * Supports: ?category=slug&fabric=&occasion=&color=&minPrice=&maxPrice=
 *           &search=&featured=true&sort=price_asc|price_desc|newest&page=1&limit=12
 */
const listProducts = asyncHandler(async (req, res) => {
  const {
    category,
    fabric,
    occasion,
    color,
    minPrice,
    maxPrice,
    search,
    featured,
    sort = "newest",
    page = "1",
    limit = "12",
  } = req.query;

  const where = {};

  if (category) where.category = { slug: category };
  if (fabric) where.fabric = { contains: fabric, mode: "insensitive" };
  if (occasion) where.occasion = { equals: occasion, mode: "insensitive" };
  if (color) where.color = { equals: color, mode: "insensitive" };
  if (featured === "true") where.featured = true;

  if (minPrice || maxPrice) {
    where.discountPrice = {};
    if (minPrice) where.discountPrice.gte = Number(minPrice);
    if (maxPrice) where.discountPrice.lte = Number(maxPrice);
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { fabric: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy =
    {
      price_asc: { discountPrice: "asc" },
      price_desc: { discountPrice: "desc" },
      newest: { createdAt: "desc" },
    }[sort] || { createdAt: "desc" };

  const take = Math.min(Number(limit) || 12, 48);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      total,
      page: Number(page) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  });
});

// GET /api/products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: { select: { name: true, slug: true } } },
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, data: product });
});

// GET /api/categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json({ success: true, data: categories });
});

/**
 * GET /api/home
 * Returns all categories, each with a handful of its products, in a single
 * round trip — avoids the frontend firing one request per category on load.
 */
const getHomeFeed = asyncHandler(async (req, res) => {
  const perCategoryLimit = Math.min(Number(req.query.limit) || 4, 12);

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const sections = await Promise.all(
    categories.map(async (category) => {
      const products = await prisma.product.findMany({
        where: { categoryId: category.id },
        orderBy: { createdAt: "desc" },
        take: perCategoryLimit,
      });
      return { category, products };
    })
  );

  res.json({ success: true, data: sections });
});

module.exports = { listProducts, getProductBySlug, listCategories, getHomeFeed };
