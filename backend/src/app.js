const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const path = require("path");

const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// --- Security & core middleware ---
// Helmet's default cross-origin resource policy blocks images from being
// loaded by a different origin (e.g. your Vercel frontend) — relax it just
// for static assets so product photos display correctly cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Gzip/Brotli-compress JSON and static responses — meaningfully cuts
// transfer size and speeds up perceived load time on slower connections.
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Serve product images: put files under backend/public/images/products/<category-slug>/
// and reference them in the DB as "/images/products/<category-slug>/<filename>"
app.use("/images", express.static(path.join(__dirname, "..", "public", "images"), {
  maxAge: "7d",
}));

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow no-origin requests (curl, server-to-server, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// General API rate limit
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- Health check (for uptime monitors / Render health checks) ---
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// --- Routes ---
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api", adminRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
