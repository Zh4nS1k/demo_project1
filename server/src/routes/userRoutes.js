const express = require('express');
const { body, param } = require('express-validator');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiters');
const {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getPublicUser,
  updateUser,
  deleteUser,
  loginUser,
} = require('../controllers/userController');

const router = express.Router();

// @route   /api/users

const usernameRules = () =>
  body('username')
    .isString()
    .trim()
    .matches(/^[\w.-]+$/).withMessage('Username may only contain letters, numbers, ., - and _')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters');

const emailRules = () =>
  body('email')
    .isString()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 254 });

const passwordRules = (required) =>
  required
    ? body('password')
        .isString()
        .isLength({ min: 6, max: 128 }).withMessage('Password must be 6–128 characters')
    : body('password')
        .optional()
        .isString()
        .isLength({ min: 6, max: 128 }).withMessage('Password must be 6–128 characters');

router.post(
  '/login',
  loginLimiter,
  [
    emailRules(),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

router.post(
  '/',
  [
    usernameRules(),
    emailRules(),
    passwordRules(true),
    body('name').isString().trim().notEmpty().withMessage('Name is required')
      .isLength({ max: 60 }),
    body('age').optional({ values: 'null' }).isInt({ min: 0, max: 150 })
      .withMessage('Age must be 0–150'),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('favourite_coffee').optional().isString().trim().isLength({ max: 60 }),
  ],
  validate,
  createUser
);

router.get('/', protect, admin, getAllUsers);
router.get(
  '/public/:username',
  param('username').isString().trim().isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters'),
  validate,
  getPublicUser
);
router.get('/username/:username', getUserByUsername);
router.get('/:id', param('id').isMongoId().withMessage('Invalid user id'), validate, getUserById);

router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    usernameRules().optional({ values: 'falsy' }),
    emailRules().optional({ values: 'falsy' }),
    passwordRules(false),
    body('name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 60 }),
    body('age').optional({ values: 'null' }).isInt({ min: 0, max: 150 }),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('favourite_coffee').optional({ values: 'falsy' }).isString().trim().isLength({ max: 60 }),
    // Role changes are enforced admin-only in the controller
    body('role').optional().isIn(['user', 'admin']),
  ],
  validate,
  updateUser
);

router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
