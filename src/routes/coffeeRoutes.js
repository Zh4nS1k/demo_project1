const express = require('express');
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

router.post('/', createCoffee);
router.get('/', getAllCoffees);
router.get('/name/:name', getCoffeeByName);
router.get('/:id', getCoffeeById);
router.put('/:id', updateCoffee);
router.delete('/:id', deleteCoffee);

module.exports = router;
