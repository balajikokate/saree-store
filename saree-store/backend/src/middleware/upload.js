const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ApiError } = require("./errorHandler");

const PRODUCTS_DIR = path.join(__dirname, "..", "..", "public", "images", "products");

function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = slugify(req.body.category || "misc");
    const dir = path.join(PRODUCTS_DIR, category);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const base = slugify(req.body.filenamePrefix || path.basename(file.originalname, ext));
    const unique = Date.now();
    cb(null, `${base}-${unique}${ext}`);
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, or WEBP images are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image — keeps uploads fast for shoppers too
});

module.exports = { upload, slugify, PRODUCTS_DIR };
