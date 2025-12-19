const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
};

/* =========================
   ROLE GUARD
========================= */
exports.authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    const userRoles = req.user.roles || [];

    const allowed = requiredRoles.some(role =>
      userRoles.includes(role)
    );

    if (!allowed) return res.sendStatus(403);

    next();
  };
};
