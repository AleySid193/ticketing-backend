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

  try {
    // Check if email already exists
    db.get(`SELECT id FROM users WHERE email = ?`, [email], async (err, existingUser) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (existingUser) {
        return res.status(409).json({ error: 'Email is already in use' });
      }

      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      // Insert new user
      db.run(
        `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
        [name, email, hashed],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          res.status(201).json({
            message: 'User created. Await role assignment by admin.'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error' });
  }
};


/* =========================
   LOGIN (FETCH SINGLE ROLE)
========================= */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (!user) {
      // Email not found
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Password incorrect
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Login successful → generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });
};

