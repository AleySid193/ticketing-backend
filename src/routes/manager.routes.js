const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getDashboardStats, bulkCreateTasks
} = require('../controllers/manager.controller');

const router = express.Router();

router.get(
  '/dashboard-stats',
  authenticate,
  authorize(['manager']),
  getDashboardStats
);

router.post(
  '/create-tasks',
  authenticate,
  authorize(['manager']),
  bulkCreateTasks
);

module.exports = router;
