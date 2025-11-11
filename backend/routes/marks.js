const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// GET /api/marks/teacher/:teacherId
router.get('/teacher/:teacherId', authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    // Find marks uploaded by this teacher
    const marks = await Mark.find({ uploadedBy: teacherId })
      .populate('student', 'name usn')
      .populate('course', 'code title semester');
    res.json({ data: marks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch marks', error: err.message });
  }
});

// GET /api/marks/semester/:semester - Get all marks for a specific semester
router.get('/semester/:semester', authorize('teacher'), async (req, res) => {
  try {
    const semester = Number(req.params.semester);
    
    // Find all courses in this semester
    const courses = await Course.find({ semester }).select('_id code title');
    const courseIds = courses.map(c => c._id);
    
    // Find all marks for courses in this semester
    const marks = await Mark.find({ course: { $in: courseIds } })
      .populate('student', 'name usn')
      .populate('course', 'code title semester')
      .lean();
    
    // Add percentage calculation for each mark
    const marksWithPercentage = marks.map(mark => ({
      ...mark,
      percentage: Math.round((mark.score / 100) * 100) // Assuming score is out of 100, adjust as needed
    }));
    
    res.json({ success: true, data: marksWithPercentage });
  } catch (err) {
    console.error('Error fetching semester marks:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch semester marks', error: err.message });
  }
});

module.exports = router;
