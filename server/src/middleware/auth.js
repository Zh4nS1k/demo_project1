const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** RFC 6750-style 401 helper: always sends WWW-Authenticate so clients can react properly. */
function unauthorized(res, message, errorType = null) {
  const challenge = errorType
    ? `Bearer error="${errorType}"`
    : 'Bearer';
  return res.status(401).set('WWW-Authenticate', challenge).json({
    success: false,
    message,
  });
}

/**
 * Protect routes — verifies the Bearer JWT and attaches req.user.
 * 401 = who are you (no/bad/expired token). Never 403.
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return unauthorized(res, 'Not authenticated — missing token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return unauthorized(res, 'User no longer exists', 'invalid_token');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Session expired — please log in again', 'invalid_token');
    }
    return unauthorized(res, 'Invalid token', 'invalid_token');
  }
};

/**
 * Admin only — must run after protect.
 * 403 = we know who you are, but you can't do that.
 */
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Admin access required',
  });
};
