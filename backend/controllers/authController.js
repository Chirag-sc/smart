const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { role, name, email, password, ...additionalData } = req.body;
    console.log('Parsed registration data:', { role, name, email, ...additionalData });

    // Check if user already exists
    const existingUser = await Student.findOne({ email }) || 
                        await Parent.findOne({ email }) || 
                        await Teacher.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    let user;

    // Create user based on role
    switch (role) {
      case 'student':
        // Validate required student fields
        if (!additionalData.usn || !additionalData.branch || !additionalData.semester) {
          return res.status(400).json({
            success: false,
            message: 'Please provide all required student information'
          });
        }

        // Check if USN already exists
        const existingUSN = await Student.findOne({ usn: additionalData.usn });
        if (existingUSN) {
          return res.status(400).json({
            success: false,
            message: 'Student with this USN already exists'
          });
        }

        try {
          user = await Student.create({
            name,
            email,
            password,
            role,
            usn: additionalData.usn,
            branch: additionalData.branch,
            semester: additionalData.semester
          });
        } catch (error) {
          console.error('Student creation error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error creating student account',
            error: error.message
          });
        }
        break;

      case 'parent':
        // Validate required parent fields
        if (!additionalData.childUSN) {
          return res.status(400).json({
            success: false,
            message: 'Please provide child USN'
          });
        }

        // Check if child exists
        const child = await Student.findOne({ usn: additionalData.childUSN });
        if (!child) {
          return res.status(400).json({
            success: false,
            message: 'No student found with the provided USN'
          });
        }

        // Check if student already has a parent
        if (child.parentId) {
          return res.status(400).json({
            success: false,
            message: 'This student already has a registered parent'
          });
        }

        try {
          // Create parent account
          user = await Parent.create({
            name,
            email,
            password,
            role,
            childUSN: additionalData.childUSN,
            children: [child._id]
          });

          // Update student's parentId and add parent's email
          await Student.findByIdAndUpdate(child._id, {
            parentId: user._id,
            parentEmail: email
          });

          // Log the successful linking
          console.log(`Successfully linked parent ${user._id} with student ${child._id}`);
        } catch (error) {
          console.error('Parent creation error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error creating parent account',
            error: error.message
          });
        }
        break;

      case 'teacher':
        // Validate required teacher fields
        if (!additionalData.facultyId || !additionalData.department || !additionalData.designation) {
          return res.status(400).json({
            success: false,
            message: 'Please provide all required teacher information'
          });
        }

        // Check if facultyId already exists
        const existingFacultyId = await Teacher.findOne({ facultyId: additionalData.facultyId });
        if (existingFacultyId) {
          return res.status(400).json({
            success: false,
            message: 'Teacher with this faculty ID already exists'
          });
        }

        try {
          user = await Teacher.create({
            name,
            email,
            password,
            role,
            facultyId: additionalData.facultyId,
            department: additionalData.department,
            designation: additionalData.designation,
            isAdmin: additionalData.isAdmin || false
          });
        } catch (error) {
          console.error('Teacher creation error:', error);
          return res.status(400).json({
            success: false,
            message: 'Error creating teacher account',
            error: error.message
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
    }

    // Create token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, twoFactorToken, backupCode } = req.body;

    // Find user by email
    const user = await Student.findOne({ email }).select('+password') ||
                 await Parent.findOne({ email }).select('+password') ||
                 await Teacher.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful password match
    await user.resetLoginAttempts();

    // Check if 2FA is enabled
    if (user.twoFactorAuth && user.twoFactorAuth.enabled) {
      // If 2FA token is not provided, require it
      if (!twoFactorToken && !backupCode) {
        return res.status(200).json({
          success: true,
          requires2FA: true,
          message: 'Please provide your 2FA code to complete login'
        });
      }

      // Verify 2FA token
      const speakeasy = require('speakeasy');
      let verified = false;

      if (backupCode) {
        // Check backup code
        const backupCodeEntry = user.twoFactorAuth.backupCodes.find(
          code => code.code === backupCode.toUpperCase() && !code.used
        );

        if (backupCodeEntry) {
          backupCodeEntry.used = true;
          verified = true;
          await user.save();
        }
      } else if (twoFactorToken) {
        // Verify TOTP token
        verified = speakeasy.totp.verify({
          secret: user.twoFactorAuth.secret,
          encoding: 'base32',
          token: twoFactorToken,
          window: 2
        });
      }

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }

      // Update last used
      user.twoFactorAuth.lastUsed = new Date();
      await user.save();
    }

    // Update last login info
    user.securitySettings.lastLogin = new Date();
    user.securitySettings.lastLoginIP = req.ip || req.connection.remoteAddress;
    await user.save();

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Try to find user in student/parent/teacher collections
  let user = await Student.findById(req.user.id);
  let role = 'student';
  if (!user) {
    user = await Parent.findById(req.user.id);
    if (user) role = 'parent';
  }
  if (!user) {
    user = await Teacher.findById(req.user.id);
    if (user) role = 'teacher';
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Build payload; for students include academic fields expected by frontend
  const base = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: role
  };

  const payload = role === 'student'
    ? {
        ...base,
        usn: user.usn,
        branch: user.branch,
        semester: user.semester,
        cgpa: user.cgpa,
        attendance: user.attendance,
      }
    : base;

  res.status(200).json({
    success: true,
    user: payload,
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await Student.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update user profile based on role
  if (user.role === 'student') {
    const updatedStudent = await Student.findByIdAndUpdate(
      user._id,
      {
        usn: req.body.usn,
        branch: req.body.branch,
        semester: req.body.semester,
        cgpa: req.body.cgpa,
        attendance: req.body.attendance
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      res.status(404);
      throw new Error('Student profile not found');
    }

    res.json({
      success: true,
      user: {
        id: updatedStudent._id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        role: updatedStudent.role,
        usn: updatedStudent.usn,
        branch: updatedStudent.branch,
        semester: updatedStudent.semester,
        cgpa: updatedStudent.cgpa,
        attendance: updatedStudent.attendance
      }
    });
  } else {
    res.status(400);
    throw new Error('Profile update not supported for this role');
  }
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile
}; 