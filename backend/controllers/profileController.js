const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for single profile picture upload
const uploadProfilePicture = upload.single('profilePicture');

// @desc    Upload profile picture
// @route   POST /api/profile/picture
// @access  Private
const uploadProfilePictureHandler = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Find user by role - try all models
    let user = null;
    let role = 'student';
    
    // Try Student first
    user = await Student.findById(req.user.id);
    if (user) {
      role = 'student';
    } else {
      // Try Parent
      user = await Parent.findById(req.user.id);
      if (user) {
        role = 'parent';
      } else {
        // Try Teacher
        user = await Teacher.findById(req.user.id);
        if (user) {
          role = 'teacher';
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `profile-${user._id}-${Date.now()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Process image with sharp (resize, compress, convert to WebP)
    await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Delete old profile picture if exists
    if (user.profilePicture && user.profilePicture.filename) {
      const oldFilePath = path.join(uploadsDir, user.profilePicture.filename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user profile picture
    user.profilePicture = {
      url: `/uploads/profile-pictures/${filename}`,
      filename: filename,
      uploadedAt: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
});

// @desc    Delete profile picture
// @route   DELETE /api/profile/picture
// @access  Private
const deleteProfilePicture = asyncHandler(async (req, res) => {
  try {
    // Find user by role - try all models
    let user = null;
    let role = 'student';
    
    // Try Student first
    user = await Student.findById(req.user.id);
    if (user) {
      role = 'student';
    } else {
      // Try Parent
      user = await Parent.findById(req.user.id);
      if (user) {
        role = 'parent';
      } else {
        // Try Teacher
        user = await Teacher.findById(req.user.id);
        if (user) {
          role = 'teacher';
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete file from filesystem
    if (user.profilePicture && user.profilePicture.filename) {
      const filepath = path.join(__dirname, '../uploads/profile-pictures', user.profilePicture.filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Clear profile picture from database
    user.profilePicture = {
      url: null,
      filename: null,
      uploadedAt: null
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    console.error('Profile picture deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile picture',
      error: error.message
    });
  }
});

// @desc    Get user preferences
// @route   GET /api/profile/preferences
// @access  Private
const getUserPreferences = asyncHandler(async (req, res) => {
  try {
    // Find user by role - try all models
    let user = null;
    let role = 'student';
    
    // Try Student first
    user = await Student.findById(req.user.id);
    if (user) {
      role = 'student';
    } else {
      // Try Parent
      user = await Parent.findById(req.user.id);
      if (user) {
        role = 'parent';
      } else {
        // Try Teacher
        user = await Teacher.findById(req.user.id);
        if (user) {
          role = 'teacher';
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences,
        notificationPreferences: user.notificationPreferences,
        privacySettings: user.privacySettings,
        profilePicture: user.profilePicture,
        personalInfo: user.personalInfo
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching preferences',
      error: error.message
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/profile/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  try {
    const { preferences, notificationPreferences, privacySettings, personalInfo } = req.body;

    // Find user by role - try all models
    let user = null;
    let role = 'student';
    
    // Try Student first
    user = await Student.findById(req.user.id);
    if (user) {
      role = 'student';
    } else {
      // Try Parent
      user = await Parent.findById(req.user.id);
      if (user) {
        role = 'parent';
      } else {
        // Try Teacher
        user = await Teacher.findById(req.user.id);
        if (user) {
          role = 'teacher';
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    if (notificationPreferences) {
      user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };
    }

    if (privacySettings) {
      user.privacySettings = { ...user.privacySettings, ...privacySettings };
    }

    if (personalInfo) {
      user.personalInfo = { ...user.personalInfo, ...personalInfo };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences,
        notificationPreferences: user.notificationPreferences,
        privacySettings: user.privacySettings,
        personalInfo: user.personalInfo
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
});

// @desc    Export user data
// @route   GET /api/profile/export
// @access  Private
const exportUserData = asyncHandler(async (req, res) => {
  try {
    // Find user by role - try all models
    let user = null;
    let role = 'student';
    
    // Try Student first
    user = await Student.findById(req.user.id);
    if (user) {
      role = 'student';
    } else {
      // Try Parent
      user = await Parent.findById(req.user.id);
      if (user) {
        role = 'parent';
      } else {
        // Try Teacher
        user = await Teacher.findById(req.user.id);
        if (user) {
          role = 'teacher';
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare export data
    const exportData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      profile: {
        profilePicture: user.profilePicture,
        personalInfo: user.personalInfo,
        preferences: user.preferences,
        notificationPreferences: user.notificationPreferences,
        privacySettings: user.privacySettings
      },
      exportDate: new Date().toISOString(),
      exportVersion: '1.0'
    };

    res.status(200).json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
});

// @desc    Deactivate user account
// @route   PUT /api/profile/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
  try {
    // Find user by role - try all models
    let user = null;
    let role = 'student';
    
    // Try Student first
    user = await Student.findById(req.user.id);
    if (user) {
      role = 'student';
    } else {
      // Try Parent
      user = await Parent.findById(req.user.id);
      if (user) {
        role = 'parent';
      } else {
        // Try Teacher
        user = await Teacher.findById(req.user.id);
        if (user) {
          role = 'teacher';
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add deactivation flag
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating account',
      error: error.message
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/profile/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  try {
    // Find user by role - try all models
    let user = null;
    let role = 'student';
    
    // Try Student first
    user = await Student.findById(req.user.id);
    if (user) {
      role = 'student';
    } else {
      // Try Parent
      user = await Parent.findById(req.user.id);
      if (user) {
        role = 'parent';
      } else {
        // Try Teacher
        user = await Teacher.findById(req.user.id);
        if (user) {
          role = 'teacher';
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user account
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
});

module.exports = {
  uploadProfilePicture,
  uploadProfilePictureHandler,
  deleteProfilePicture,
  getUserPreferences,
  updateUserPreferences,
  exportUserData,
  deactivateAccount,
  deleteAccount
};
