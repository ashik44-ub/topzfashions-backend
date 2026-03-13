const express = require('express');
const router = express.Router();
const { getTimer, updateTimer } = require('../bestdeals/bestdeals.controller');

/**
 * @route   GET /api/timer
 * @desc    সব ইউজারদের জন্য টাইমার ডেটা গেট করা
 * @access  Public
 */
router.get('/timer', getTimer);

/**
 * @route   POST /api/timer/update
 * @desc    অ্যাডমিন ড্যাশবোর্ড থেকে টাইমার আপডেট করা
 * @access  Private (Admin only)
 */
router.post('/timer/update', updateTimer);

module.exports = router;