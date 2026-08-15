const express = require('express');
const { protect, admin } = require('../middleware/auth');
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

// Reads stay public — the home page coffee picker needs them
router.get('/', getAllCoffees);
router.get('/name/:name', getCoffeeByName);
router.get('/:id', getCoffeeById);

// Writes are admin-only
router.post('/', protect, admin, createCoffee);
router.put('/:id', protect, admin, updateCoffee);
router.delete('/:id', protect, admin, deleteCoffee);

module.exports = router;
