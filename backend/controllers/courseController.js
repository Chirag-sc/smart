const Course = require('../models/Course');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const path = require('path');
const fs = require('fs');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private/Teacher,Student
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name teacherId department')
      .populate('students', 'name studentId branch semester');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching courses',
      error: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private/Teacher,Student
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name teacherId department')
      .populate('students', 'name studentId branch semester');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching course',
      error: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Teacher
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in creating course',
      error: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Teacher
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in updating course',
      error: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Teacher
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete associated study materials
    for (const material of course.studyMaterials) {
      const filePath = path.join(__dirname, '..', 'uploads', material.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in deleting course',
      error: error.message
    });
  }
};

// @desc    Add student to course
// @route   POST /api/courses/:id/students
// @access  Private/Teacher
exports.addStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const student = await Student.findById(req.body.studentId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student is already enrolled
    if (course.students.includes(student._id)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    course.students.push(student._id);
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in adding student to course',
      error: error.message
    });
  }
};

// @desc    Remove student from course
// @route   DELETE /api/courses/:id/students/:studentId
// @access  Private/Teacher
exports.removeStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const student = await Student.findById(req.params.studentId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    course.students = course.students.filter(
      student => student.toString() !== req.params.studentId
    );
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in removing student from course',
      error: error.message
    });
  }
};

// @desc    Add assignment to course
// @route   POST /api/courses/:id/assignments
// @access  Private/Teacher
exports.addAssignment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.assignments.push(req.body);
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in adding assignment',
      error: error.message
    });
  }
};

// @desc    Add exam to course
// @route   POST /api/courses/:id/exams
// @access  Private/Teacher
exports.addExam = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.exams.push(req.body);
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in adding exam',
      error: error.message
    });
  }
};

// Upload study material
exports.uploadMaterial = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const { title, description } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;
    const material = {
      title,
      description,
      filename: req.file.originalname,
      url: fileUrl,
      uploadedAt: new Date()
    };
    course.studyMaterials.push(material);
    await course.save();
    res.status(201).json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading material', error: error.message });
  }
};

// List study materials
exports.getMaterials = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, materials: course.studyMaterials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching materials', error: error.message });
  }
};

// @desc    Delete study material
// @route   DELETE /api/courses/:id/materials/:materialId
// @access  Private/Teacher
exports.deleteMaterial = async (req, res) => {
  try {
    console.log('Deleting material:', { courseId: req.params.id, materialId: req.params.materialId });
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      console.log('Course not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const material = course.studyMaterials.find(m => m._id.toString() === req.params.materialId);
    if (!material) {
      console.log('Material not found:', req.params.materialId);
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    console.log('Found material:', material);

    // Delete the file from the uploads directory
    const filePath = path.join(__dirname, '..', 'uploads', material.filename);
    console.log('Attempting to delete file:', filePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('File deleted successfully');
    } else {
      console.log('File not found in uploads directory');
    }

    // Remove the material from the course's studyMaterials array
    course.studyMaterials = course.studyMaterials.filter(m => m._id.toString() !== req.params.materialId);
    await course.save();
    console.log('Material removed from course and saved');

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error in deleteMaterial:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting material', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 