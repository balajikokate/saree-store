const router = require("express").Router();
const { razorpayWebhook } = require("../controllers/webhook.controller");

router.post("/webhooks/razorpay", razorpayWebhook);

module.exports = router;
