const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  addCourse,
  removeCourse,
  uploadMarks,
  uploadAttendance,
  deleteAttendance,
  deleteMarks
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Store file in memory as a buffer
const upload = multer({ storage: storage });

// Protect all routes
router.use(protect);

// GET route accessible by all authenticated users (students, teachers, parents)
// POST route only accessible by teachers
router
  .route('/')
  .get(getTeachers) // Removed authorize('teacher') to allow students to view teachers
  .post(authorize('teacher'), createTeacher);

router
  .route('/:id')
  .get(authorize('teacher'), getTeacher)
  .put(authorize('teacher'), updateTeacher)
  .delete(authorize('teacher'), deleteTeacher);

// Course management routes
router
  .route('/:id/courses')
  .post(authorize('teacher'), addCourse);

router
  .route('/:id/courses/:courseId')
  .delete(authorize('teacher'), removeCourse);

// Upload marks route
router
  .route('/:id/upload-marks')
  .post(authorize('teacher'), upload.single('file'), uploadMarks);

// Upload attendance route
router
  .route('/:id/upload-attendance')
  .post(authorize('teacher'), upload.single('file'), uploadAttendance);

// Delete attendance records (by semester or all)
router
  .route('/:id/attendance')
  .delete(authorize('teacher'), deleteAttendance);

// Delete marks records (by semester or all)
router
  .route('/:id/marks')
  .delete(authorize('teacher'), deleteMarks);

module.exports = router; 