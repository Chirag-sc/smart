const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Mark = require('../models/Mark');
const xlsx = require('xlsx');
const Attendance = require('../models/Attendance');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private/All authenticated users
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select('-password')
      .populate('courses', 'code title description department semester');

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching teachers',
      error: error.message
    });
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private/Teacher
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .select('-password')
      .populate('courses', 'code title students');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching teacher',
      error: error.message
    });
  }
};

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private/Teacher
exports.createTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.create(req.body);

    res.status(201).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in creating teacher',
      error: error.message
    });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private/Teacher
exports.updateTeacher = async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Prevent updating sensitive fields
    delete req.body.password;
    delete req.body.role;
    delete req.body.email;

    teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in updating teacher',
      error: error.message
    });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private/Teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    await teacher.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in deleting teacher',
      error: error.message
    });
  }
};

// @desc    Add course to teacher
// @route   POST /api/teachers/:id/courses
// @access  Private/Teacher
exports.addCourse = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    const course = await Course.findById(req.body.courseId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is already assigned
    if (teacher.courses.includes(course._id)) {
      return res.status(400).json({
        success: false,
        message: 'Course is already assigned to this teacher'
      });
    }

    teacher.courses.push(course._id);
    course.teacher = teacher._id;

    await teacher.save();
    await course.save();

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in adding course',
      error: error.message
    });
  }
};

// @desc    Remove course from teacher
// @route   DELETE /api/teachers/:id/courses/:courseId
// @access  Private/Teacher
exports.removeCourse = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    const course = await Course.findById(req.params.courseId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    teacher.courses = teacher.courses.filter(
      course => course.toString() !== req.params.courseId
    );
    course.teacher = undefined;

    await teacher.save();
    await course.save();

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in removing course',
      error: error.message
    });
  }
};

// @desc    Upload marks from an Excel file
// @route   POST /api/teachers/:id/upload-marks
// @access  Private/Teacher
exports.uploadMarks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty or malformed' });
    }

    const uploadedMarks = [];
    const errors = [];

    for (const row of data) {
      const { USN, 'Course Code': courseCode, 'Subject Name': subjectName, Score, Grade } = row;

      if (!USN || !courseCode || !subjectName || Score === undefined || Grade === undefined) {
        errors.push(`Missing data in row: ${JSON.stringify(row)}`);
        continue;
      }

      try {
        const student = await Student.findOne({ usn: USN });
        if (!student) {
          errors.push(`Student with USN ${USN} not found.`);
          continue;
        }

        const course = await Course.findOne({ code: courseCode });
        if (!course) {
          errors.push(`Course with code ${courseCode} not found.`);
          continue;
        }

        const mark = await Mark.create({
          student: student._id,
          course: course._id,
          subjectName,
          score: Score,
          grade: Grade,
          uploadedBy: req.user.id, // Assuming req.user.id is the teacher's ID
        });
        uploadedMarks.push(mark);
      } catch (error) {
        errors.push(`Error processing row ${JSON.stringify(row)}: ${error.message}`);
      }
    }

    if (uploadedMarks.length > 0) {
      return res.status(200).json({
        success: true,
        message: `Successfully uploaded ${uploadedMarks.length} marks.`, 
        uploadedMarks,
        errors // Return errors even if some marks were uploaded
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No marks were uploaded due to errors.',
        errors
      });
    }

  } catch (error) {
    console.error('Error uploading marks (backend detailed):', error);
    console.error('Error message (backend detailed):', error.message);
    res.status(500).json({ success: false, message: 'Server error during marks upload', error: error.message });
  }
}; 

// @desc    Upload attendance from an Excel file
//          Supported formats:
//          1) Aggregate format (per row): USN, Course Code, Subject Name, Total Classes, Attended Classes
//          2) Per-date format (per row): USN, Course Code, Subject Name, <YYYY-MM-DD columns...> with values like P/A/1/0/Yes/No
// @route   POST /api/teachers/:id/upload-attendance
// @access  Private/Teacher
exports.uploadAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty or malformed' });
    }

    // Supported columns:
    // - USN, Course Code, Subject Name, Total Classes, Attended Classes
    // - OR: USN, Course Code, Subject Name, then any number of date columns (YYYY-MM-DD or DD/MM/YYYY)
    const upserts = [];
    const errors = [];

    for (const row of data) {
      const {
        USN,
        'Course Code': courseCode,
        'Subject Name': subjectName,
      } = row;

      if (!USN || !courseCode || !subjectName) {
        errors.push(`Missing required fields in row: ${JSON.stringify(row)}`);
        continue;
      }

      try {
        const student = await Student.findOne({ usn: USN });
        if (!student) {
          errors.push(`Student with USN ${USN} not found.`);
          continue;
        }

        const course = await Course.findOne({ code: courseCode });
        if (!course) {
          errors.push(`Course with code ${courseCode} not found.`);
          continue;
        }

        // Determine format
        let total = 0;
        let attended = 0;

        const hasAggregate =
          Object.prototype.hasOwnProperty.call(row, 'Total Classes') ||
          Object.prototype.hasOwnProperty.call(row, 'Attended Classes');

        if (hasAggregate) {
          total = Number(row['Total Classes'] ?? 0);
          attended = Number(row['Attended Classes'] ?? 0);
        } else {
          // Per-date format: any column header that looks like a date
          const normalizeHeader = (k) => k?.toString().replace(/\r?\n/g, ' ').trim().toLowerCase();
          const baseHeaders = new Set(['usn', 'course code', 'subject name', 'student name']);
          const isDateHeader = (key) => {
            const norm = normalizeHeader(key);
            if (baseHeaders.has(norm)) return false;

            // If Excel parsed header as a Date object
            if (key instanceof Date && !isNaN(key.getTime())) return true;

            // If Excel parsed header as a serial number
            if (typeof key === 'number') {
              try {
                const parsed = xlsx.SSF?.parse_date_code?.(key);
                if (parsed && typeof parsed.y === 'number') return true;
              } catch (_) {}
            }

            const v = key?.toString().trim();
            // YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
            const iso = /^\d{4}-\d{2}-\d{2}$/;
            const dmySlash = /^\d{2}\/\d{2}\/\d{4}$/;
            const dmyDash = /^\d{2}-\d{2}-\d{4}$/;
            if (iso.test(v) || dmySlash.test(v) || dmyDash.test(v)) return true;

            // Fallback: treat any non-base header as a date column to be safe
            return !baseHeaders.has(norm);
          };

          const normalizePresence = (val) => {
            if (val === undefined || val === null) return null;
            const s = String(val).trim().toLowerCase();
            if (s === '') return null; // not conducted
            if (['p', 'present', '1', 'yes', 'y', 'true'].includes(s)) return true;
            if (['a', 'absent', '0', 'no', 'n', 'false'].includes(s)) return false;
            // Any non-empty value counts as conducted; only count attended if truthy numeric
            if (!Number.isNaN(Number(s))) return Number(s) > 0;
            return false;
          };

          const keys = Object.keys(row).filter(isDateHeader);
          for (const k of keys) {
            const presence = normalizePresence(row[k]);
            if (presence === null) {
              // not conducted that day
              continue;
            }
            total += 1;
            if (presence === true) attended += 1;
          }
        }

        const attendanceDoc = await Attendance.findOneAndUpdate(
          { student: student._id, course: course._id, subjectName },
          {
            $set: {
              totalClasses: total,
              attendedClasses: attended,
              updatedBy: req.user.id,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        upserts.push(attendanceDoc);
      } catch (error) {
        errors.push(`Error processing row ${JSON.stringify(row)}: ${error.message}`);
      }
    }

    if (upserts.length > 0) {
      return res.status(200).json({
        success: true,
        message: `Successfully processed ${upserts.length} attendance records.`,
        data: upserts,
        errors,
      });
    }
    return res.status(400).json({ success: false, message: 'No attendance records processed.', errors });
  } catch (error) {
    console.error('Error uploading attendance:', error);
    res.status(500).json({ success: false, message: 'Server error during attendance upload', error: error.message });
  }
};

// @desc    Delete attendance records created for teacher's class
// @route   DELETE /api/teachers/:id/attendance?semester=6&courseCode=BCS601&subject=NAME
// @access  Private/Teacher
exports.deleteAttendance = async (req, res) => {
  try {
    const { semester, courseCode, subject } = req.query;

    // Scope by optional filters
    const query = {};

    if (semester) {
      const CourseModel = require('../models/Course');
      const courses = await CourseModel.find({ semester: Number(semester) }).select('_id');
      query.course = { $in: courses.map(c => c._id) };
    }

    if (courseCode) {
      const CourseModel = require('../models/Course');
      const course = await CourseModel.findOne({ code: courseCode }).select('_id');
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      query.course = course._id;
    }

    if (subject) {
      query.subjectName = subject;
    }

    const result = await Attendance.deleteMany(query);
    return res.status(200).json({ success: true, deleted: result.deletedCount || 0 });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return res.status(500).json({ success: false, message: 'Error deleting attendance', error: error.message });
  }
};

// @desc    Delete marks (optionally filter by semester/courseCode/subject)
// @route   DELETE /api/teachers/:id/marks?semester=6&courseCode=BCS601&subject=NAME
// @access  Private/Teacher
exports.deleteMarks = async (req, res) => {
  try {
    const { semester, courseCode, subject } = req.query;

    // Scope by optional filters
    const query = {};

    if (semester) {
      const CourseModel = require('../models/Course');
      const courses = await CourseModel.find({ semester: Number(semester) }).select('_id');
      query.course = { $in: courses.map(c => c._id) };
    }

    if (courseCode) {
      const CourseModel = require('../models/Course');
      const course = await CourseModel.findOne({ code: courseCode }).select('_id');
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      query.course = course._id;
    }

    if (subject) {
      query.subjectName = subject;
    }

    const result = await Mark.deleteMany(query);
    return res.status(200).json({ success: true, deleted: result.deletedCount || 0 });
  } catch (error) {
    console.error('Error deleting marks:', error);
    return res.status(500).json({ success: false, message: 'Error deleting marks', error: error.message });
  }
};