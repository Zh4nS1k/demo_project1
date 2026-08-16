const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Full self-view of a user — what register/login/update return to the client.
 * Includes private fields (email, age, …): only ever sent to the user themselves
 * or to admins (getAllUsers is admin-gated).
 */
const selfView = (u) => ({
  id: u._id,
  username: u.username,
  email: u.email,
  name: u.name,
  age: u.age,
  gender: u.gender,
  favourite_coffee: u.favourite_coffee,
  role: u.role,
  member_since: u.createdAt,
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
exports.createUser = asyncHandler(async (req, res) => {
  const { username, email, password, name, age, gender, favourite_coffee } = req.body;

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: exists.email === email ? 'Email already registered' : 'Username already taken',
    });
  }

  const user = await User.create({
    username,
    email,
    password,
    name,
    age,
    gender,
    favourite_coffee,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: selfView(user),
    token,
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments();

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: users,
  });
});

/** Privacy-safe projection for public user reads — never email/age/gender/password. */
const publicView = (u) => ({
  id: u._id,
  username: u.username,
  name: u.name,
  member_since: u.createdAt,
});

// @desc    Get single user by ID (public, sanitized)
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, data: publicView(user) });
});

// @desc    Get public profile by username — powers read-only public stats page
// @route   GET /api/users/public/:username
// @access  Public
exports.getPublicUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select(
    'username name createdAt'
  );
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({
    success: true,
    data: { username: user.username, name: user.name, member_since: user.createdAt },
  });
});

// @desc    Get user by username (public, sanitized)
// @route   GET /api/users/username/:username
// @access  Public
exports.getUserByUsername = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, data: publicView(user) });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (self or admin)
exports.updateUser = asyncHandler(async (req, res) => {
  const isSelf = req.user && req.user._id.toString() === req.params.id;
  const isAdmin = req.user && req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res
      .status(403)
      .json({ success: false, message: 'Not allowed to update this user' });
  }

  const { password, role, ...updateData } = req.body;

  // Role changes are admin-only
  if (role && isAdmin) updateData.role = role;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  Object.assign(user, updateData);
  if (password) user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    data: selfView(user),
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.user && req.user._id.toString() === req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account',
    });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: selfView(user),
    token,
  });
});
