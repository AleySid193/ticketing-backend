const db = require('../db/database');

exports.assignRole = (req, res) => {
  const { userId, roleName } = req.body;

  db.get(
    `SELECT id FROM roles WHERE name = ?`,
    [roleName],
    (err, role) => {
      if (!role) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      db.run(
        `
        INSERT OR IGNORE INTO user_roles (user_id, role_id)
        VALUES (?, ?)
        `,
        [userId, role.id],
        () => {
          res.json({ message: 'Role assigned' });
        }
      );
    }
  );
};
