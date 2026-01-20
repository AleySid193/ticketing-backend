const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getDashboardStats, bulkCreateTasks, getViewTasks, updateViewTasks
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
  bulkCreateTasks
);

module.exports = router;
