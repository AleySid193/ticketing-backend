const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { assignRole,
  getDashboardStats, 
  getDashboardChart, 
  getPendingResources, 
  updateResourceStatus,
  assignUsersToManager,
  getManagers,
  getUsers,
} = require('../controllers/admin.controller');

const router = express.Router();

router.post(
  '/assign-role',
  // authenticate,
  // authorize(['admin']),
  assignRole
);

router.get(
  '/dashboard-stats',
  // authenticate,
  // authorize(['admin']),
  getDashboardStats
);

router.get(
  '/dashboard-chart',
  // authenticate,
  // authorize(['admin']),
  getDashboardChart
);

router.get(
  '/pending-resources',
  // authenticate,
  // authorize(['admin']),
  getPendingResources
);

router.post(
  '/resource-status',
  // authenticate,
  // authorize(['admin']),
  updateResourceStatus
);


router.post(
  '/assign-users-to-manager',
  assignUsersToManager
);

router.get(
  '/get-managers',
  getManagers
);

router.get(
  '/get-users',
  getUsers
);


module.exports = router;
