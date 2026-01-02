const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { assignRole, getDashboardStats } = require('../controllers/admin.controller');

const router = express.Router();

router.post(
  '/assign-role',
  authenticate,
  authorize(['admin']),
  assignRole
);

router.get(
  '/dashboard-stats',
  authenticate,
  authorize(['admin']),
  getDashboardStats
);

module.exports = router;
