const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { requireCustomer } = require("../middleware/customerAuth");
const { signup, login, logout, me } = require("../controllers/customerAuth.controller");
const {
  updateProfile,
  changePassword,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listMyOrders,
  getMyOrder,
} = require("../controllers/account.controller");

// Slow down signup/login abuse (credential stuffing, fake account spam)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
});

// -------------------- Public auth routes --------------------
router.post("/auth/signup", authLimiter, signup);
router.post("/auth/login", authLimiter, login);
router.post("/auth/logout", logout);

// -------------------- Protected account routes --------------------
router.get("/auth/me", requireCustomer, me);

router.patch("/account/profile", requireCustomer, updateProfile);
router.post("/account/change-password", requireCustomer, changePassword);

router.get("/account/addresses", requireCustomer, listAddresses);
router.post("/account/addresses", requireCustomer, createAddress);
router.put("/account/addresses/:id", requireCustomer, updateAddress);
router.delete("/account/addresses/:id", requireCustomer, deleteAddress);

router.get("/account/orders", requireCustomer, listMyOrders);
router.get("/account/orders/:orderNumber", requireCustomer, getMyOrder);

module.exports = router;
