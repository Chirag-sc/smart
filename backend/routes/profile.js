const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadProfilePicture,
  uploadProfilePictureHandler,
  deleteProfilePicture,
  getUserPreferences,
  updateUserPreferences,
  exportUserData,
  deactivateAccount,
  deleteAccount
} = require('../controllers/profileController');

// @route   POST /api/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/picture', protect, uploadProfilePicture, uploadProfilePictureHandler);

// @route   DELETE /api/profile/picture
// @desc    Delete profile picture
// @access  Private
router.delete('/picture', protect, deleteProfilePicture);

// @route   GET /api/profile/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', protect, getUserPreferences);

// @route   PUT /api/profile/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, updateUserPreferences);

// @route   GET /api/profile/export
// @desc    Export user data
// @access  Private
router.get('/export', protect, exportUserData);

// @route   PUT /api/profile/deactivate
// @desc    Deactivate user account
// @access  Private
router.put('/deactivate', protect, deactivateAccount);

// @route   DELETE /api/profile/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, deleteAccount);

module.exports = router;
