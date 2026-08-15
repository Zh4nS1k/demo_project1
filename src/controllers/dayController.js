const asyncHandler = require('../middleware/asyncHandler');
const Day = require('../models/Day');

/** Whitelisted sort keys — client-facing name → mongoose field */
const SORT_FIELDS = {
  date: 'date',
  rating: 'rating',
  cups: 'count_of_cups',
};

/**
 * Shared query parsing for day listings: filters + pagination + sorting.
 * Query params are validated at the route level; this clamps values defensively.
 */
function parseDayQuery(req) {
  const filter = {};

  // Optional filters
  if (req.query.username) filter.username = req.query.username;
  if (req.query.coffee_name) filter.coffee_name = req.query.coffee_name;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const page = Math.min(10000, Math.max(1, parseInt(req.query.page, 10) || 1));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const sortField = SORT_FIELDS[req.query.sort] || 'date';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  return { filter, page, limit, sort: { [sortField]: sortOrder } };
}

/** Shared paginated listing response (matches /api/users shape). */
async function listDays(req, res, forceFilter = {}) {
  const { filter, page, limit, sort } = parseDayQuery(req);
  Object.assign(filter, forceFilter);

  const skip = (page - 1) * limit;
  const [days, total] = await Promise.all([
    Day.find(filter).skip(skip).limit(limit).sort(sort),
    Day.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: days.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: days,
  });
}

// @desc    Create a day entry (log coffee consumption)
// @route   POST /api/days
// @access  Public
exports.createDay = asyncHandler(async (req, res) => {
  const day = await Day.create(req.body);
  res.status(201).json({ success: true, data: day });
});

// @desc    Get all day entries
// @route   GET /api/days
// @access  Public
// @query   username, coffee_name, from, to, page, limit, sort (date|rating|cups), order (asc|desc)
exports.getAllDays = asyncHandler(async (req, res) => {
  await listDays(req, res);
});

// @desc    Get day entry by ID
// @route   GET /api/days/:id
// @access  Public
exports.getDayById = asyncHandler(async (req, res) => {
  const day = await Day.findById(req.params.id);
  if (!day) {
    return res.status(404).json({ success: false, message: 'Day entry not found' });
  }
  res.status(200).json({ success: true, data: day });
});

// @desc    Get days for a username (paginated, sortable)
// @route   GET /api/days/user/:username
// @access  Public
// @query   page, limit, sort (date|rating|cups), order (asc|desc)
exports.getDaysByUsername = asyncHandler(async (req, res) => {
  await listDays(req, res, { username: req.params.username });
});

// @desc    Get daily coffee summary for a user (total cups)
// @route   GET /api/days/summary/:username
// @access  Public
exports.getUserSummary = asyncHandler(async (req, res) => {
  const summary = await Day.aggregate([
    { $match: { username: req.params.username } },
    {
      $group: {
        _id: null,
        total_cups: { $sum: '$count_of_cups' },
        total_entries: { $sum: 1 },
        unique_coffees: { $addToSet: '$coffee_name' },
        avg_rating: { $avg: '$rating' },
      },
    },
  ]);

  // Per-coffee breakdown
  const byCoffee = await Day.aggregate([
    { $match: { username: req.params.username } },
    {
      $group: {
        _id: '$coffee_name',
        total_cups: { $sum: '$count_of_cups' },
        entries: { $sum: 1 },
        avg_rating: { $avg: '$rating' },
      },
    },
    { $sort: { total_cups: -1 } },
  ]);

  // Per-day average rating
  const ratingBreakdown = await Day.aggregate([
    { $match: { username: req.params.username } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  if (summary.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        username: req.params.username,
        total_cups: 0,
        total_entries: 0,
        unique_coffees: [],
        avg_rating: 0,
        by_coffee: [],
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      username: req.params.username,
      total_cups: summary[0].total_cups,
      total_entries: summary[0].total_entries,
      unique_coffees: summary[0].unique_coffees,
      avg_rating: Math.round((summary[0].avg_rating || 0) * 10) / 10,
      by_coffee: byCoffee.map((c) => ({
        coffee_name: c._id,
        total_cups: c.total_cups,
        entries: c.entries,
        avg_rating: Math.round((c.avg_rating || 0) * 10) / 10,
      })),
      rating_breakdown: ratingBreakdown.map((r) => ({ rating: r._id, count: r.count })),
    },
  });
});

// @desc    Update day entry
// @route   PUT /api/days/:id
// @access  Public
exports.updateDay = asyncHandler(async (req, res) => {
  const day = await Day.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!day) {
    return res.status(404).json({ success: false, message: 'Day entry not found' });
  }
  res.status(200).json({ success: true, data: day });
});

// @desc    Delete day entry
// @route   DELETE /api/days/:id
// @access  Public
exports.deleteDay = asyncHandler(async (req, res) => {
  const day = await Day.findByIdAndDelete(req.params.id);
  if (!day) {
    return res.status(404).json({ success: false, message: 'Day entry not found' });
  }
  res.status(200).json({ success: true, message: 'Day entry deleted successfully' });
});
