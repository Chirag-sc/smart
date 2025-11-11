const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  getSemesterAttendance,
  getStudentMarks,
  getStudentAttendance
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Apply authentication to all routes
router.use(protect);

// Teacher/Admin only routes
router.get('/', authorize('teacher', 'admin'), getStudents);
router.get('/:id/attendance/semester/:semester', authorize('teacher', 'admin'), getSemesterAttendance);
router.get('/:id', getStudent); // Allow students, parents, and teachers to access individual student
router.post('/', authorize('teacher', 'admin'), createStudent);
router.post('/import', authorize('teacher', 'admin'), upload.single('file'), importStudents);
router.put('/:id', authorize('teacher', 'admin'), updateStudent);
router.delete('/:id', authorize('teacher', 'admin'), deleteStudent);

// Marks route - accessible by teachers, students, and parents
router.get('/:id/marks', getStudentMarks);

// Attendance route - accessible by teachers, students, and parents
router.get('/:id/attendance', getStudentAttendance);

module.exports = router;