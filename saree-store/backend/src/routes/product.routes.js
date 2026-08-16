const router = require("express").Router();
const { requireCustomer } = require("../middleware/customerAuth");
const { cacheControl } = require("../middleware/cacheControl");
const {
  listProducts,
  getProductBySlug,
  listCategories,
  getHomeFeed,
} = require("../controllers/product.controller");
const { listReviews, createOrUpdateReview } = require("../controllers/review.controller");
const { getSettings } = require("../controllers/settings.controller");
const { submitInquiry } = require("../controllers/wholesale.controller");

// Short public cache on read-only catalog data — meaningfully speeds up
// repeat navigation (e.g. Shop -> Product -> back to Shop) without risking
// noticeable staleness; an admin edit shows up again within ~60s.
router.get("/home", cacheControl(60), getHomeFeed);
router.get("/products", cacheControl(30), listProducts);
router.get("/products/:slug", cacheControl(60), getProductBySlug);
router.get("/categories", cacheControl(300), listCategories); // categories change rarely
router.get("/settings", cacheControl(300), getSettings); // theme changes rarely

router.get("/products/:slug/reviews", listReviews);
router.post("/products/:slug/reviews", requireCustomer, createOrUpdateReview);

router.post("/wholesale", submitInquiry);

module.exports = router;
