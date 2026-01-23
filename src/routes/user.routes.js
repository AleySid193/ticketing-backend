const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getDashboard,
  getManager,
  getAssignedTasks,
  submitAssignedTask
} = require('../controllers/user.controller');

const router = express.Router();

router.get(
  '/get-dashboard',
  authenticate,
  authorize(['user']),
  getDashboard
);

router.get(
  '/get-sidebar-manager',
  authenticate,
  authorize(['user']),
  getManager
);

router.get(
  '/get-assigned-tasks',
  authenticate,
  authorize(['user']),
  getAssignedTasks
);

router.post(
  '/submit-assigned-task',
  authenticate,
  authorize(['user']),
  submitAssignedTask
);

module.exports = router;
