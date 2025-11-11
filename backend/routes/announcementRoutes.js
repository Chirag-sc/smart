const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  updateAnnouncement
} = require('../controllers/announcementController');

router
  .route('/')
  .get(protect, getAnnouncements)
  .post(protect, authorize('teacher'), createAnnouncement);

router
  .route('/:id')
  .put(protect, authorize('teacher'), updateAnnouncement)
  .delete(protect, authorize('teacher'), deleteAnnouncement);

module.exports = router; 