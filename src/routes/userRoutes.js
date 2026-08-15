const express = require('express');
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
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/username/:username', getUserByUsername);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
