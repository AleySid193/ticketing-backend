const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { 
  getDashboardStats, 
  bulkCreateTasks, 
  getViewTasks, 
  updateViewTasks, 
  getAssignTasks, 
  updateAssignTasks, 
  getReviewTasks, 
  updateReviewTasks
} = require('../controllers/manager.controller');

const router = express.Router();

router.get(
  '/dashboard-stats',
  authenticate,
  authorize(['manager']),
  getDashboardStats
);

router.get(
  '/get-view-tasks',
  authenticate,
  authorize(['manager']),
  getViewTasks
);

router.post(
  '/create-tasks',
  authenticate,
  authorize(['manager']),
  bulkCreateTasks
);

router.post(
  '/update-view-tasks',
  authenticate,
  authorize(['manager']),
  updateViewTasks
);

router.get(
  '/get-assign-tasks',
  authenticate,
  authorize(['manager']),
  getAssignTasks
);

router.get(
  '/get-review-tasks',
  authenticate,
  authorize(['manager']),
  getReviewTasks
);

router.post(
  '/update-assign-tasks',
  authenticate,
  authorize(['manager']),
  updateAssignTasks
);

router.post(
  '/update-review-tasks',
  authenticate,
  authorize(['manager']),
  updateReviewTasks
);

module.exports = router;
