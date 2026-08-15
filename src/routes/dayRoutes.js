const express = require('express');
const {
  createDay,
  getAllDays,
  getDayById,
  getDaysByUsername,
  getUserSummary,
  updateDay,
  deleteDay,
} = require('../controllers/dayController');

const router = express.Router();

// @route   /api/days

router.post('/', createDay);
router.get('/', getAllDays);
router.get('/user/:username', getDaysByUsername);
router.get('/summary/:username', getUserSummary);
router.get('/:id', getDayById);
router.put('/:id', updateDay);
router.delete('/:id', deleteDay);

module.exports = router;
