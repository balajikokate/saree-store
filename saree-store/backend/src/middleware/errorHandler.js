class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 404 handler for unmatched routes
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler — keep this as the LAST middleware in app.js
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.message || "Internal server error",
  };
  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV === "development" && err.stack) {
    payload.stack = err.stack;
  }
  if (statusCode >= 500) {
    console.error(err);
  }
  res.status(statusCode).json(payload);
}

module.exports = { ApiError, notFound, errorHandler };
