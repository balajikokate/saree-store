const Razorpay = require("razorpay");

// Lazily construct the client on first use instead of at module load time.
// This means a missing key only breaks the /checkout route when it's
// actually called, instead of crashing the entire server on startup —
// every other route (products, categories, etc.) keeps working.
let razorpayInstance = null;

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error(
      "Payments are not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env, then restart the server."
    );
    err.statusCode = 503;
    throw err;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

module.exports = { getRazorpay };
