const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { assignRole } = require('../controllers/admin.controller');

const router = express.Router();

router.post(
  '/assign-role',
  authenticate,
  authorize(['admin']),
  assignRole
);

module.exports = router;
