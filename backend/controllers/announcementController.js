const Announcement = require('../models/Announcement');
const asyncHandler = require('express-async-handler');

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private (Teachers only)
exports.createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, date } = req.body;
  const teacherId = req.user._id;

  const announcement = await Announcement.create({
    title,
    content,
    date,
    teacherId
  });

  res.status(201).json({
    success: true,
    data: announcement
  });
});

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find()
    .sort({ date: -1 })
    .populate('teacherId', 'name');

  res.status(200).json({
    success: true,
    data: announcements
  });
});

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Teachers only)
exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  // Check if the user is the teacher who created the announcement
  if (announcement.teacherId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this announcement');
  }

  await Announcement.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private (Teachers only)
exports.updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  // Check if the user is the teacher who created the announcement
  if (announcement.teacherId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this announcement');
  }

  const updatedAnnouncement = await Announcement.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedAnnouncement
  });
}); 