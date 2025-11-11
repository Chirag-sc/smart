const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addStudent,
  removeStudent,
  addAssignment,
  addExam,
  uploadMaterial,
  getMaterials,
  deleteMaterial
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Protect all routes
router.use(protect);

// Routes accessible by teachers and students
router
  .route('/')
  .get(authorize('teacher', 'student'), getCourses)
  .post(authorize('teacher'), createCourse);

router
  .route('/:id')
  .get(authorize('teacher', 'student'), getCourse)
  .put(authorize('teacher'), updateCourse)
  .delete(authorize('teacher'), deleteCourse);

// Student management routes
router
  .route('/:id/students')
  .post(authorize('teacher'), addStudent);

router
  .route('/:id/students/:studentId')
  .delete(authorize('teacher'), removeStudent);

// Assignment and exam routes
router
  .route('/:id/assignments')
  .post(authorize('teacher'), addAssignment);

router
  .route('/:id/exams')
  .post(authorize('teacher'), addExam);

// Study material routes
router
  .route('/:id/materials')
  .post(authorize('teacher'), upload.single('file'), uploadMaterial)
  .get(authorize('teacher', 'student'), getMaterials);

router
  .route('/:id/materials/:materialId')
  .delete(authorize('teacher'), deleteMaterial);

module.exports = router; 