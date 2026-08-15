const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
  loginUser,
} = require('../controllers/userController');

const router = express.Router();

// @route   /api/users

router.post('/login', loginUser);
router.post('/', createUser); // public registration
router.get('/', protect, admin, getAllUsers); // admin panel listing
router.get('/username/:username', getUserByUsername);
router.get('/:id', getUserById);
router.put('/:id', protect, updateUser); // self or admin (checked in controller)
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
