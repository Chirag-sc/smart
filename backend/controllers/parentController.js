const Parent = require('../models/Parent');
const Student = require('../models/Student');

// @desc    Get all parents
// @route   GET /api/parents
// @access  Private/Teacher
exports.getParents = async (req, res) => {
  try {
    const parents = await Parent.find().select('-password');

    res.status(200).json({
      success: true,
      count: parents.length,
      data: parents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching parents',
      error: error.message
    });
  }
};

// @desc    Get single parent
// @route   GET /api/parents/:id
// @access  Private/Teacher,Parent
exports.getParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id)
      .select('-password')
      .populate('children', 'name studentId branch semester section cgpa attendance usn');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Check if the requesting user is the parent or a teacher
    if (req.user.role !== 'teacher' && req.user.id !== parent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this parent'
      });
    }

    res.status(200).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in fetching parent',
      error: error.message
    });
  }
};

// @desc    Create new parent
// @route   POST /api/parents
// @access  Private/Teacher
exports.createParent = async (req, res) => {
  try {
    const parent = await Parent.create(req.body);

    res.status(201).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in creating parent',
      error: error.message
    });
  }
};

// @desc    Update parent
// @route   PUT /api/parents/:id
// @access  Private/Teacher,Parent
exports.updateParent = async (req, res) => {
  try {
    let parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Check if the requesting user is the parent or a teacher
    if (req.user.role !== 'teacher' && req.user.id !== parent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this parent'
      });
    }

    // Prevent updating sensitive fields
    delete req.body.password;
    delete req.body.role;
    delete req.body.email;

    parent = await Parent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in updating parent',
      error: error.message
    });
  }
};

// @desc    Delete parent
// @route   DELETE /api/parents/:id
// @access  Private/Teacher
exports.deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    await parent.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in deleting parent',
      error: error.message
    });
  }
};

// @desc    Add child to parent
// @route   POST /api/parents/:id/children
// @access  Private/Teacher
exports.addChild = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    const student = await Student.findById(req.body.studentId);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student is already added
    if (parent.children.includes(student._id)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already added to this parent'
      });
    }

    parent.children.push(student._id);
    student.parentId = parent._id;

    await parent.save();
    await student.save();

    res.status(200).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in adding child',
      error: error.message
    });
  }
};

// @desc    Remove child from parent
// @route   DELETE /api/parents/:id/children/:studentId
// @access  Private/Teacher
exports.removeChild = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    const student = await Student.findById(req.params.studentId);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    parent.children = parent.children.filter(
      child => child.toString() !== student._id.toString()
    );
    student.parentId = undefined;

    await parent.save();
    await student.save();

    res.status(200).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in removing child',
      error: error.message
    });
  }
}; 