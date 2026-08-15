const asyncHandler = require('../middleware/asyncHandler');
const Coffee = require('../models/Coffee');

// @desc    Create a new coffee
// @route   POST /api/coffees
// @access  Public
exports.createCoffee = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const exists = await Coffee.findOne({ name });
  if (exists) {
    return res.status(409).json({ success: false, message: 'Coffee with this name already exists' });
  }

  const coffee = await Coffee.create(req.body);
  res.status(201).json({ success: true, data: coffee });
});

// @desc    Get all coffees
// @route   GET /api/coffees
// @access  Public
exports.getAllCoffees = asyncHandler(async (req, res) => {
  // Optional filters
  const filter = {};
  if (req.query.milk !== undefined) filter.milk = parseInt(req.query.milk);
  if (req.query.taste) filter.taste = req.query.taste;
  if (req.query.minEnergy) filter.energy_boost = { $gte: parseInt(req.query.minEnergy) };

  const coffees = await Coffee.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, count: coffees.length, data: coffees });
});

// @desc    Get single coffee by ID
// @route   GET /api/coffees/:id
// @access  Public
exports.getCoffeeById = asyncHandler(async (req, res) => {
  const coffee = await Coffee.findById(req.params.id);
  if (!coffee) {
    return res.status(404).json({ success: false, message: 'Coffee not found' });
  }
  res.status(200).json({ success: true, data: coffee });
});

// @desc    Get coffee by name
// @route   GET /api/coffees/name/:name
// @access  Public
exports.getCoffeeByName = asyncHandler(async (req, res) => {
  const coffee = await Coffee.findOne({ name: new RegExp(req.params.name, 'i') });
  if (!coffee) {
    return res.status(404).json({ success: false, message: 'Coffee not found' });
  }
  res.status(200).json({ success: true, data: coffee });
});

// @desc    Update coffee
// @route   PUT /api/coffees/:id
// @access  Public
exports.updateCoffee = asyncHandler(async (req, res) => {
  const coffee = await Coffee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coffee) {
    return res.status(404).json({ success: false, message: 'Coffee not found' });
  }
  res.status(200).json({ success: true, data: coffee });
});

// @desc    Delete coffee
// @route   DELETE /api/coffees/:id
// @access  Public
exports.deleteCoffee = asyncHandler(async (req, res) => {
  const coffee = await Coffee.findByIdAndDelete(req.params.id);
  if (!coffee) {
    return res.status(404).json({ success: false, message: 'Coffee not found' });
  }
  res.status(200).json({ success: true, message: 'Coffee deleted successfully' });
});
