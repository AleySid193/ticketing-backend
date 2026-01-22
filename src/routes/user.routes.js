const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getDashboard,
  getManager
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

module.exports = router;
