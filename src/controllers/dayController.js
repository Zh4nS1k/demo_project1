const asyncHandler = require('../middleware/asyncHandler');
const Day = require('../models/Day');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MS = 86400000;

/** 'YYYY-MM-DD' → UTC epoch ms (safe, no TZ drift). */
function dayToUtc(s) {
  return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
}

/** Shift a 'YYYY-MM-DD' string by ±n days. */
function shiftDay(s, delta) {
  return new Date(dayToUtc(s) + delta * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Build activity insights from per-day aggregation rows.
 * All day boundaries are UTC (consistent with the $dateToString grouping).
 */
function buildInsights(byDay, caffeineByDay, todayStr) {
  // ── Streaks ──
  const daySet = new Set(byDay.map((d) => d._id));
  const dayList = [...daySet].sort();

  let longest = 0;
  let run = 0;
  for (let i = 0; i < dayList.length; i++) {
    run = i > 0 && dayToUtc(dayList[i]) - dayToUtc(dayList[i - 1]) === DAY_MS ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Current streak: counts back from today, or yesterday if today has no log yet
  const yesterdayStr = shiftDay(todayStr, -1);
  let current = 0;
  let cursor = daySet.has(todayStr) ? todayStr : yesterdayStr;
  while (daySet.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }

  // ── Most active weekday (by cups, ties broken by entries) ──
  const byDow = {};
  for (const d of byDay) {
    const k = d.dow; // Mongo $dayOfWeek: 1=Sunday … 7=Saturday
    byDow[k] = byDow[k] || { dow: k, cups: 0, entries: 0 };
    byDow[k].cups += d.cups;
    byDow[k].entries += d.entries;
  }
  let top = null;
  for (const v of Object.values(byDow)) {
    if (!top || v.cups > top.cups || (v.cups === top.cups && v.entries > top.entries)) top = v;
  }
  const mostActiveWeekday = top
    ? { day: WEEKDAYS[top.dow - 1], cups: top.cups, entries: top.entries }
    : null;

  // ── Caffeine trend (cups × energy_boost, zero-filled per day) ──
  const buildTrend = (n) => {
    const daily = [];
    for (let i = n - 1; i >= 0; i--) {
      const ds = shiftDay(todayStr, -i);
      daily.push({ date: ds, caffeine: caffeineByDay[ds] || 0 });
    }
    return { daily, total: daily.reduce((s, d) => s + d.caffeine, 0) };
  };

  return {
    streaks: { current, longest },
    most_active_weekday: mostActiveWeekday,
    caffeine_trend: { last7: buildTrend(7), last30: buildTrend(30) },
  };
}

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

// @desc    Leaderboard — top users by total cups in a recent period
// @route   GET /api/days/leaderboard?period=week|month
// @access  Public (aggregate data only — no PII)
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const days = req.query.period === 'month' ? 30 : 7;
  const since = new Date(Date.now() - days * 86400000);

  const rows = await Day.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: '$username',
        cups: { $sum: '$count_of_cups' },
        entries: { $sum: 1 },
        rated: { $push: '$rating' },
        unique: { $addToSet: '$coffee_name' },
      },
    },
    {
      $addFields: {
        unique_coffees: { $size: '$unique' },
        ratedList: { $filter: { input: '$rated', as: 'r', cond: { $gt: ['$$r', 0] } } },
      },
    },
    {
      $addFields: {
        avg_rating: {
          $cond: [
            { $gt: [{ $size: '$ratedList' }, 0] },
            { $round: [{ $avg: '$ratedList' }, 1] },
            null,
          ],
        },
      },
    },
    { $sort: { cups: -1, entries: -1 } },
    { $limit: 50 },
    // Display name only — never expose the full user document
    {
      $lookup: { from: 'users', localField: '_id', foreignField: 'username', as: 'user' },
    },
    {
      $addFields: {
        name: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, '$_id'] },
      },
    },
    {
      $project: {
        _id: 0,
        username: '$_id',
        name: 1,
        cups: 1,
        entries: 1,
        avg_rating: 1,
        unique_coffees: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    period: req.query.period || 'week',
    count: rows.length,
    data: rows,
  });
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

  // ─── Insight inputs: per-day rows + caffeine per day ───
  const byDay = await Day.aggregate([
    { $match: { username: req.params.username } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        cups: { $sum: '$count_of_cups' },
        entries: { $sum: 1 },
        dow: { $first: { $dayOfWeek: '$date' } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(shiftDay(todayStr, -29) + 'T00:00:00.000Z');
  const caffeineAgg = await Day.aggregate([
    { $match: { username: req.params.username, date: { $gte: thirtyDaysAgo } } },
    // Join energy_boost via coffee name; unknown coffees (deleted) contribute 0
    {
      $lookup: { from: 'coffees', localField: 'coffee_name', foreignField: 'name', as: 'coffee' },
    },
    {
      $addFields: {
        energy: { $ifNull: [{ $arrayElemAt: ['$coffee.energy_boost', 0] }, 0] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        caffeine: { $sum: { $multiply: ['$count_of_cups', '$energy'] } },
      },
    },
  ]);
  const caffeineByDay = Object.fromEntries(caffeineAgg.map((r) => [r._id, r.caffeine]));
  const insights = buildInsights(byDay, caffeineByDay, todayStr);

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
        ...insights,
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
      ...insights,
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
