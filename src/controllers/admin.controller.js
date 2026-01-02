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


exports.getDashboardStats = (req, res) => {
  const stats = {};

  // Total users
  db.get(`SELECT COUNT(*) AS total FROM users`, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalUsers = row.total;

    // Managers count
    db.get(
      `
      SELECT COUNT(*) AS total
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'manager'
      `,
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.managers = row.total;

        // Resources (users)
        db.get(
          `
          SELECT COUNT(*) AS total
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.name = 'user'
          `,
          (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.resources = row.total;

            return res.json(stats);
          }
        );
      }
    );
  });
};

