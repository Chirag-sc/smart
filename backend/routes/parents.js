const express = require('express');
const router = express.Router();
const {
  getParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
  addChild,
  removeChild
} = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Routes accessible by teachers only
router
  .route('/')
  .get(authorize('teacher'), getParents)
  .post(authorize('teacher'), createParent);

router
  .route('/:id')
  .get(authorize('teacher', 'parent'), getParent)
  .put(authorize('teacher', 'parent'), updateParent)
  .delete(authorize('teacher'), deleteParent);

// Child management routes
router
  .route('/:id/children')
  .post(authorize('teacher'), addChild);

router
  .route('/:id/children/:studentId')
  .delete(authorize('teacher'), removeChild);

module.exports = router; 