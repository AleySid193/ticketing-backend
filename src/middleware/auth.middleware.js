const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

/* =========================
   AUTHENTICATION
========================= */
exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return res.sendStatus(401); // Unauthorized

  try {
    req.user = jwt.verify(token, JWT_SECRET); // payload should have { id, role }
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.sendStatus(403); // Forbidden
  }
};

/* =========================
   ROLE GUARD
========================= */
exports.authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user.role; // single role string

    if (!requiredRoles.includes(userRole)) {
      return res.sendStatus(403); // Forbidden
    }

    next();
  };
};
