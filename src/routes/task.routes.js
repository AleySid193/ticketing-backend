const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getMyTasks,
  submitTask,
  createTask,
  reviewTask
} = require('../controllers/task.controller');

const router = express.Router();

/* USER */
router.get(
  '/my',
  authenticate,
  authorize(['user', 'manager', 'admin']),
  getMyTasks
);

router.post(
  '/submit/:taskId',
  authenticate,
  authorize(['user']),
  submitTask
);

/* MANAGER */
router.post(
  '/',
  authenticate,
  authorize(['manager', 'admin']),
  createTask
);

router.post(
  '/review/:taskId',
  authenticate,
  authorize(['manager', 'admin']),
  reviewTask
);

module.exports = router;
