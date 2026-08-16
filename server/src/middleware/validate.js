const { validationResult } = require('express-validator');
const { log } = require('../utils/log');

/**
 * Runs an express-validator chain and returns a 400 with per-field errors.
 * Usage: router.post('/', [body('x').isString()], validate, handler)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => `${e.path}: ${e.msg}`).join('; ');
  log.warn(`Validation failed — ${req.method} ${req.originalUrl} → ${details}`);

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    })),
  });
};

module.exports = validate;
