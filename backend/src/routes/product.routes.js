const router = require("express").Router();
const { requireCustomer } = require("../middleware/customerAuth");
const {
  listProducts,
  getProductBySlug,
  listCategories,
  getHomeFeed,
} = require("../controllers/product.controller");
const { listReviews, createOrUpdateReview } = require("../controllers/review.controller");
const { getSettings } = require("../controllers/settings.controller");
const { submitInquiry } = require("../controllers/wholesale.controller");

router.get("/home", getHomeFeed);
router.get("/products", listProducts);
router.get("/products/:slug", getProductBySlug);
router.get("/categories", listCategories);

router.get("/products/:slug/reviews", listReviews);
router.post("/products/:slug/reviews", requireCustomer, createOrUpdateReview);

router.get("/settings", getSettings);
router.post("/wholesale", submitInquiry);

module.exports = router;
