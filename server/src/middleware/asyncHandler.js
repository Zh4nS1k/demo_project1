/**
 * Global async handler wrapper.
 * Catches rejected promises from async route handlers and forwards to error middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
