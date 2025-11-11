const express = require('express');
const router = express.Router();
const {
  getMyAttendance,
  getMyMarks
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Student-specific routes (students can access their own data)
router.get('/attendance/semester/:semester', authorize('student'), getMyAttendance);
router.get('/marks', authorize('student'), getMyMarks);

module.exports = router;
