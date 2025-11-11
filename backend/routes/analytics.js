const express = require('express');
const router = express.Router();
const {
  getAnalyticsOverview,
  getPerformanceAnalytics,
  getAttendanceTrends,
  getCoursePerformance,
  getAtRiskStudents,
  getStudentRankings,
  getDepartmentStats,
  testAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('teacher')); // Only teachers can access analytics

// Analytics routes
router.get('/test', testAnalytics);
router.get('/overview', getAnalyticsOverview);
router.get('/performance', getPerformanceAnalytics);
router.get('/attendance-trends', getAttendanceTrends);
router.get('/course-performance', getCoursePerformance);
router.get('/at-risk-students', getAtRiskStudents);
router.get('/rankings', getStudentRankings);
router.get('/department-stats', getDepartmentStats);

module.exports = router;
