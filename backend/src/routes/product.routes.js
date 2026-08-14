const router = require("express").Router();
const {
  listProducts,
  getProductBySlug,
  listCategories,
  getHomeFeed,
} = require("../controllers/product.controller");

router.get("/home", getHomeFeed);
router.get("/products", listProducts);
router.get("/products/:slug", getProductBySlug);
router.get("/categories", listCategories);

module.exports = router;
