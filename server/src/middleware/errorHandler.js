/**
 * Global error handling middleware.
 * Must be registered last (after all routes).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let known = statusCode !== 500; // explicit status set by a handler → operational, safe to show

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    known = true;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    known = true;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}: ${err.keyValue[field]}`;
  }

  // Mongoose cast error (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    known = true;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Unexpected errors (TypeError, Mongo internals, …) must not leak internals in prod
  if (!known && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  console.error(`[ERROR] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
