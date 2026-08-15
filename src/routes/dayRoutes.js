const express = require('express');
const { body, param, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createDay,
  getAllDays,
  getDayById,
  getDaysByUsername,
  getUserSummary,
  updateDay,
  deleteDay,
} = require('../controllers/dayController');

const router = express.Router();

// @route   /api/days

const dayFieldRules = (forCreate) => [
  body('username')
    .optional(!forCreate ? { values: 'falsy' } : false)
    .isString().trim().isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters'),
  body('coffee_name')
    .optional(!forCreate ? { values: 'falsy' } : false)
    .isString().trim().notEmpty().withMessage('Coffee name is required')
    .isLength({ max: 60 }),
  body('count_of_cups')
    .optional(!forCreate ? { values: 'null' } : false)
    .isInt({ min: 1, max: 50 }).withMessage('Count of cups must be 1–50'),
  body('rating')
    .optional({ values: 'null' })
    .isInt({ min: 0, max: 5 }).withMessage('Rating must be 0–5'),
  body('date')
    .optional({ values: 'null' })
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];

// Shared query rules for paginated/sortable day listings
const dayQueryRules = [
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('page must be an integer ≥ 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
  query('sort').optional().isIn(['date', 'rating', 'cups']).withMessage('sort must be date, rating or cups'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
  query('coffee_name').optional().isString().trim().isLength({ min: 1, max: 60 }),
  query('from').optional({ values: 'falsy' }).isISO8601().withMessage('from must be an ISO 8601 date'),
  query('to').optional({ values: 'falsy' }).isISO8601().withMessage('to must be an ISO 8601 date'),
];

// Writes require login (frontend api client always attaches the Bearer token)
router.post('/', protect, dayFieldRules(true), validate, createDay);
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid day id'),
  ...dayFieldRules(false),
], validate, updateDay);
router.delete('/:id', protect, deleteDay);

// Reads stay public — summaries power the logged-in dashboard
router.get('/', [
  query('username').optional().isString().trim().isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters'),
  ...dayQueryRules,
], validate, getAllDays);
router.get('/user/:username', [
  param('username').isString().trim().isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters'),
  ...dayQueryRules,
], validate, getDaysByUsername);
router.get('/summary/:username', getUserSummary);
router.get('/:id', param('id').isMongoId().withMessage('Invalid day id'), validate, getDayById);

module.exports = router;
