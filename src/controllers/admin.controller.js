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

exports.getDashboardChart = (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN status = 'assigned' AND is_deleted = 0 THEN 1 ELSE 0 END) AS assigned,
      SUM(CASE WHEN status = 'submitted' AND is_deleted = 0 THEN 1 ELSE 0 END) AS submitted,
      SUM(CASE WHEN status = 'approved' AND is_deleted = 0 THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'rejected' AND is_deleted = 0 THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN status = 'completed' AND is_deleted = 0 THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deleted
    FROM tasks
  `;

  db.get(query, [], (err, row) => {
    if (err) {
      console.error('Dashboard chart query error:', err);
      return res.status(500).json({ error: 'Failed to fetch dashboard chart data' });
    }

    res.json(row);
  });
};


exports.getPendingResources = (req, res) => {
  const query = `
    SELECT u.id, u.name, u.email
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.user_id IS NULL
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching pending resources:', err);
      return res.status(500).json({ error: 'Failed to fetch pending resources' });
    }

    res.json(rows);
  });
};


exports.updateResourceStatus = (req, res) => {
  const updates = req.body; // [{id: 1, status: 'manager'}, {id: 2, status: 'reject'}]

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid payload format' });
  }

  const getRoleId = (roleName, callback) => {
    if (roleName === 'reject') return callback(null, null); // no role for reject
    db.get('SELECT id FROM roles WHERE name = ?', [roleName], (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(new Error(`Invalid role: ${roleName}`));
      callback(null, row.id);
    });
  };

  const tasks = updates.map(update => new Promise((resolve, reject) => {
    getRoleId(update.status, (err, roleId) => {
      if (err) return reject(err);

      if (update.status === 'reject') {
        // DELETE the user completely
        db.run('DELETE FROM users WHERE id = ?', [update.id], function (err) {
          if (err) return reject(err);
          resolve();
        });
      } else {
        // Assign role
        db.run(
          'INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [update.id, roleId],
          function (err) {
            if (err) return reject(err);
            resolve();
          }
        );
      }
    });
  }));

  Promise.all(tasks)
    .then(() => res.json({ message: 'Resource statuses updated successfully' }))
    .catch(err => {
      console.error('Error updating resource statuses:', err);
      res.status(500).json({ error: 'Failed to update resource statuses' });
    });
};
