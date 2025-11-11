const Student = require('../models/Student');
const Mark = require('../models/Mark');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Teacher
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching students',
      error: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private/Teacher,Student
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if the requesting user is the student or a teacher
    if (req.user.role !== 'teacher' && req.user.id !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching student',
      error: error.message
    });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private/Teacher
const createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in creating student',
      error: error.message
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Teacher,Student
const updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if the requesting user is the student or a teacher
    if (req.user.role !== 'teacher' && req.user.id !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this student'
      });
    }

    // Prevent updating sensitive fields
    delete req.body.password;
    delete req.body.role;
    delete req.body.email;

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in updating student',
      error: error.message
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Teacher
const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    // Validate ID format (if using MongoDB)
    if (!studentId || studentId.length !== 24) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    const deleted = await Student.findByIdAndDelete(studentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Error in deleting student', error: err.message });
  }
};

// @desc    Get student's attendance
// @route   GET /api/students/:id/attendance
// @access  Private/Teacher,Student
const getStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if the requesting user is the student, a teacher, or the parent of this student
    if (
      req.user.role !== 'teacher' &&
      req.user.id !== student._id.toString() &&
      (req.user.role !== 'parent' || (student.parentId && req.user.id !== student.parentId.toString()))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attendance: student.attendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching student attendance',
      error: error.message
    });
  }
};

// @desc    Update student's attendance
// @route   PUT /api/students/:id/attendance
// @access  Private/Teacher
const updateStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.attendance = req.body.attendance;
    await student.save();

    res.status(200).json({
      success: true,
      data: {
        attendance: student.attendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in updating student attendance',
      error: error.message
    });
  }
};

// @desc    Get child's academic performance
// @route   GET /api/students/:id/performance
// @access  Private/Teacher,Student,Parent
const getChildPerformance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if the requesting user is the student, a teacher, or the parent of this student
    if (
      req.user.role !== 'teacher' &&
      req.user.id !== student._id.toString() &&
      (req.user.role !== 'parent' || (student.parentId && req.user.id !== student.parentId.toString()))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student'
      });
    }

    // For demonstration, let's return mock performance data
    // In a real application, you would fetch this from a database
    const performanceData = [
      { _id: 'math', name: 'Mathematics', marks: '90/100', grade: 'A+' },
      { _id: 'science', name: 'Science', marks: '85/100', grade: 'A' },
      { _id: 'english', name: 'English', marks: '75/100', grade: 'B+' },
    ];

    res.status(200).json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching student performance',
      error: error.message,
    });
  }
};

// @desc    Get all marks for a student
// @route   GET /api/students/:id/marks
// @access  Private/Teacher,Student,Parent
const getStudentMarks = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Authorization check
    if (
      req.user.role !== 'teacher' &&
      req.user.id !== student._id.toString() &&
      (req.user.role !== 'parent' || (student.parentId && req.user.id !== student.parentId.toString()))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these marks'
      });
    }

    const marks = await Mark.find({ student: studentId })
      .populate('course', 'code title') // Populate course info
      .select('subjectName score grade uploadedAt'); // Select relevant mark fields

    res.status(200).json({
      success: true,
      data: marks,
    });
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error in fetching student marks',
      error: error.message,
    });
  }
};

// @desc    Import students from CSV/Excel file
// @route   POST /api/students/import
// @access  Private/Teacher
const importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const errors = [];
    const successCount = [];
    const defaultPassword = 'password123'; // Default password for imported students

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.Name || !row.Email || !row.USN) {
          errors.push(`Row ${i + 2}: Missing required fields (Name, Email, USN)`);
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ 
          $or: [{ email: row.Email }, { usn: row.USN }] 
        });

        if (existingStudent) {
          errors.push(`Row ${i + 2}: Student with email ${row.Email} or USN ${row.USN} already exists`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create student
        const studentData = {
          name: row.Name,
          email: row.Email,
          password: hashedPassword,
          usn: row.USN,
          branch: row.Branch || '',
          semester: row.Semester || 1,
          cgpa: row.CGPA || '',
          attendance: row.Attendance || '',
          role: 'student'
        };

        const student = await Student.create(studentData);
        successCount.push({
          name: student.name,
          email: student.email,
          usn: student.usn
        });

      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed. ${successCount.length} students imported successfully.`,
      data: {
        imported: successCount,
        errors: errors,
        totalProcessed: data.length,
        successCount: successCount.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing students',
      error: error.message
    });
  }
};

// @desc    Get student's own attendance for a semester
// @route   GET /api/student/attendance/semester/:semester
// @access  Private/Student
const getMyAttendance = async (req, res) => {
  try {
    const { semester } = req.params;
    const studentId = req.user.id;

    // Find courses in this semester
    const courses = await Course.find({ semester: Number(semester) }).select('_id code title');
    const courseIds = courses.map(c => c._id);

    const records = await Attendance.find({ student: studentId, course: { $in: courseIds } })
      .populate('course', 'code title semester')
      .lean();

    // Group by subjectName for convenience in UI
    const bySubject = {};
    records.forEach(record => {
      const key = record.subjectName;
      if (!bySubject[key]) {
        bySubject[key] = {
          subjectName: record.subjectName,
          course: record.course,
          totalClasses: 0,
          attendedClasses: 0,
          percentage: 0
        };
      }
      bySubject[key].totalClasses += record.totalClasses;
      bySubject[key].attendedClasses += record.attendedClasses;
    });

    // Calculate percentages
    Object.values(bySubject).forEach(subject => {
      subject.percentage = subject.totalClasses > 0 
        ? Math.round((subject.attendedClasses / subject.totalClasses) * 100) 
        : 0;
    });

    res.status(200).json({
      success: true,
      data: Object.values(bySubject)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
};

// @desc    Get student's own marks
// @route   GET /api/student/marks
// @access  Private/Student
const getMyMarks = async (req, res) => {
  try {
    const studentId = req.user.id;

    const marks = await Mark.find({
      student: studentId
    }).populate('course', 'code title');

    res.status(200).json({
      success: true,
      data: marks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching marks',
      error: error.message
    });
  }
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  getStudentAttendance,
  updateStudentAttendance,
  getChildPerformance,
  getStudentMarks,
  getSemesterAttendance,
  getMyAttendance,
  getMyMarks
};

// @desc    Get attendance for a student grouped by subject for a semester
// @route   GET /api/students/:id/attendance/semester/:semester
// @access  Private/Teacher,Student,Parent
async function getSemesterAttendance(req, res) {
  try {
    const studentId = req.params.id;
    const semester = req.params.semester;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Authorization
    if (
      req.user.role !== 'teacher' &&
      req.user.id !== student._id.toString() &&
      (req.user.role !== 'parent' || (student.parentId && req.user.id !== student.parentId.toString()))
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to access attendance' });
    }

    // Find courses in this semester
    const courses = await Course.find({ semester: Number(semester) }).select('_id code title');
    const courseIds = courses.map(c => c._id);

    const records = await Attendance.find({ student: studentId, course: { $in: courseIds } })
      .populate('course', 'code title semester')
      .lean();

    // Group by subjectName for convenience in UI
    const bySubject = {};
    for (const rec of records) {
      const key = `${rec.subjectName}::${rec.course?._id}`;
      bySubject[key] = {
        subjectName: rec.subjectName,
        course: rec.course,
        totalClasses: rec.totalClasses,
        attendedClasses: rec.attendedClasses,
        percentage: rec.totalClasses > 0 ? Math.round((rec.attendedClasses / rec.totalClasses) * 100) : 0,
      };
    }

    res.status(200).json({ success: true, data: Object.values(bySubject) });
  } catch (error) {
    console.error('Error fetching semester attendance:', error);
    res.status(500).json({ success: false, message: 'Error fetching semester attendance', error: error.message });
  }
}