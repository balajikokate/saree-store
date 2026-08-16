const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { requireAdmin } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { login, logout, me, unlockLockout } = require("../controllers/auth.controller");
const {
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
} = require("../controllers/admin.controller");
const { listCoupons, createCoupon, updateCoupon, deleteCoupon } = require("../controllers/coupon.controller");
const { listAllReviews, deleteReview } = require("../controllers/review.controller");
const { listInquiries } = require("../controllers/wholesale.controller");
const { updateSettings } = require("../controllers/settings.controller");

// Slow down brute-force login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again in a few minutes." },
});

router.post("/admin/login", loginLimiter, login);
router.post("/admin/logout", logout);
router.post("/admin/unlock-lockout", loginLimiter, unlockLockout);

// Everything below this line requires a valid admin session
router.use("/admin", requireAdmin);

router.get("/admin/me", me);
router.get("/admin/stats", getDashboardStats);

router.get("/admin/products", listAllProducts);
router.get("/admin/products/:id", getProductById);
router.post("/admin/products", createProduct);
router.put("/admin/products/:id", updateProduct);
router.delete("/admin/products/:id", deleteProduct);

router.get("/admin/categories", listCategoriesAdmin);
router.post("/admin/categories", createCategory);

router.post("/admin/upload-image", upload.single("image"), uploadImage);

router.get("/admin/orders", listOrders);
router.get("/admin/orders/:id", getOrderById);
router.patch("/admin/orders/:id/status", updateOrderStatus);
router.get("/admin/orders/:id/invoice", downloadOrderInvoice);

router.get("/admin/coupons", listCoupons);
router.post("/admin/coupons", createCoupon);
router.put("/admin/coupons/:id", updateCoupon);
router.delete("/admin/coupons/:id", deleteCoupon);

router.get("/admin/reviews", listAllReviews);
router.delete("/admin/reviews/:id", deleteReview);

router.get("/admin/wholesale-inquiries", listInquiries);

router.patch("/admin/settings", updateSettings);

module.exports = router;
