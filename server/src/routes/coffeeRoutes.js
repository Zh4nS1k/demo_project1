const express = require('express');
const { body, param, query } = require('express-validator');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createCoffee,
  getAllCoffees,
  getCoffeeById,
  getCoffeeByName,
  updateCoffee,
  deleteCoffee,
} = require('../controllers/coffeeController');

const router = express.Router();

// @route   /api/coffees

const TASTES = [
  'sweet', 'bitter', 'sour', 'salty', 'umami',
  'nutty', 'chocolate', 'fruity', 'floral', 'caramel', 'spicy', 'earthy',
];

const coffeeFieldRules = (forCreate) => [
  body('name')
    .optional(!forCreate ? { values: 'falsy' } : false)
    .isString().trim().notEmpty().withMessage('Coffee name is required')
    .isLength({ max: 60 }),
  body('taste')
    .optional(!forCreate ? { values: 'falsy' } : false)
    .isIn(TASTES).withMessage(`Taste must be one of: ${TASTES.join(', ')}`),
  body('energy_boost')
    .optional(!forCreate ? { values: 'null' } : false)
    .isInt({ min: 1, max: 10 }).withMessage('Energy boost must be 1–10'),
  body('milk')
    .optional()
    .isIn([0, 1]).withMessage('Milk must be 0 (no milk) or 1 (with milk)'),
];

// Reads stay public — the coffee browser page needs them
router.get('/', [
  query('taste').optional().isIn(TASTES).withMessage(`taste must be one of: ${TASTES.join(', ')}`),
  query('milk').optional().isIn(['0', '1']).withMessage('milk must be 0 or 1'),
  query('minEnergy').optional().isInt({ min: 1, max: 10 }).withMessage('minEnergy must be 1–10'),
], validate, getAllCoffees);
router.get('/name/:name', getCoffeeByName);
router.get('/:id', param('id').isMongoId().withMessage('Invalid coffee id'), validate, getCoffeeById);

// Writes are admin-only
router.post('/', protect, admin, coffeeFieldRules(true), validate, createCoffee);
router.put('/:id', protect, admin, [
  param('id').isMongoId().withMessage('Invalid coffee id'),
  ...coffeeFieldRules(false),
], validate, updateCoffee);
router.delete('/:id', protect, admin, deleteCoffee);

module.exports = router;
