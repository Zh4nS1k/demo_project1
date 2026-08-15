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

// @desc    Get all coffees (with community stats: avg rating, cups logged)
// @route   GET /api/coffees?taste=&milk=&minEnergy=
// @access  Public
exports.getAllCoffees = asyncHandler(async (req, res) => {
  // Optional filters (validated at route level)
  const filter = {};
  if (req.query.milk !== undefined) filter.milk = parseInt(req.query.milk, 10);
  if (req.query.taste) filter.taste = req.query.taste;
  if (req.query.minEnergy) filter.energy_boost = { $gte: parseInt(req.query.minEnergy, 10) };

  const coffees = await Coffee.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'days',
        localField: 'name',
        foreignField: 'coffee_name',
        as: 'logs',
      },
    },
    {
      $addFields: {
        // Only rated entries (rating > 0) count toward the average
        rated: {
          $filter: { input: '$logs', as: 'l', cond: { $gt: ['$$l.rating', 0] } },
        },
      },
    },
    {
      $addFields: {
        avg_rating: {
          $cond: [
            { $gt: [{ $size: '$rated' }, 0] },
            { $round: [{ $avg: '$rated.rating' }, 1] },
            null,
          ],
        },
        total_cups: { $sum: '$logs.count_of_cups' },
        total_entries: { $size: '$logs' },
      },
    },
    { $project: { logs: 0, rated: 0 } },
    { $sort: { name: 1 } },
  ]);

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
