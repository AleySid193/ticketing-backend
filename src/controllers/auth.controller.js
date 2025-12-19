const db = require('../db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

/* =========================
   SIGNUP (NO ROLE HERE)
========================= */
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    `
    INSERT INTO users (name, email, password)
    VALUES (?, ?, ?)
    `,
    [name, email, hashed],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'User already exists' });
      }

      res.status(201).json({
        message: 'User created. Await role assignment by admin.'
      });
    }
  );
};

/* =========================
   LOGIN (FETCH ROLES)
========================= */
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Fetch roles
      db.all(
        `
        SELECT r.name
        FROM roles r
        JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = ?
        `,
        [user.id],
        (err, roles) => {
          const roleNames = roles.map(r => r.name);

          const token = jwt.sign(
            {
              id: user.id,
              roles: roleNames
            },
            JWT_SECRET,
            { expiresIn: '1d' }
          );

          res.json({
            token,
            roles: roleNames
          });
        }
      );
    }
  );
};
