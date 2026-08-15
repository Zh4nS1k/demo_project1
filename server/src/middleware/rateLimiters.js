const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter — 10 attempts per 15 minutes per IP.
 * Successful logins don't count against the budget (skipSuccessfulRequests),
 * so only failures lock you out.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many failed login attempts — try again in 15 minutes',
  },
});

module.exports = { loginLimiter };
