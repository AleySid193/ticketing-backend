const db = require('../db/database');

exports.assignRole = (req, res) => {
  const { userId, role } = req.body;

  const allowedRoles = ['user', 'manager', 'admin'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  db.run(
    `
    UPDATE users
    SET role = ?
    WHERE id = ?
    `,
    [role, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Role assigned successfully' });
    }
  );
};



exports.getDashboardStats = (req, res) => {
  const stats = {};

  db.get(`SELECT COALESCE(COUNT(*), 0) AS total FROM users`, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalUsers = row.total;

    db.get(
      `SELECT COALESCE(COUNT(*), 0) AS total FROM users WHERE role = 'manager'`,
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalManagers = row.total;

        db.get(
          `SELECT COALESCE(COUNT(*), 0) AS total FROM users WHERE role = 'user'`,
          (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalUsersRoleUser = row.total;

            res.json(stats);
          }
        );
      }
    );
  });
};


exports.getDashboardChart = (req, res) => {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN status = 'assigned' THEN 1 END), 0) AS assigned,
      COALESCE(SUM(CASE WHEN status = 'submitted' THEN 1 END), 0) AS submitted,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 END), 0) AS approved,
      COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 END), 0) AS rejected,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 END), 0) AS completed,
      COALESCE(SUM(CASE WHEN is_deleted = 1 THEN 1 END), 0) AS deleted
    FROM tasks
  `;

  db.get(query, (err, row) => {
    if (err) {
      console.error('Dashboard chart query error:', err);
      return res.status(500).json({ error: 'Failed to fetch dashboard chart data' });
    }

    res.json(row);
  });
};


exports.getPendingResources = (req, res) => {
  const query = `
    SELECT id, name, email
    FROM users
    WHERE role = 'pending'
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching pending resources:', err);
      return res.status(500).json({ error: 'Failed to fetch pending resources' });
    }

    res.json(rows);
  });
};

exports.getUsers = (req, res) => {
  const query = `
    SELECT id, name, email, manager_id
    FROM users
    WHERE role = 'user' OR role = 'manager'
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching resources:', err);
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }

    res.json(rows);
  });
};

exports.getManagers = (req, res) => {
  const query = `
    SELECT id, name, email
    FROM users
    WHERE role = 'manager'
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching managers:', err);
      return res.status(500).json({ error: 'Failed to fetch managers' });
    }

    res.json(rows);
  });
};


exports.updateResourceStatus = (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid payload format' });
  }

  const allowedRoles = ['user', 'manager'];

  const tasks = updates.map(update => {
    return new Promise((resolve, reject) => {
      if (update.status === 'reject') {
        db.run(
          'DELETE FROM users WHERE id = ?',
          [update.id],
          err => (err ? reject(err) : resolve())
        );
      } else {
        if (!allowedRoles.includes(update.status)) {
          return reject(new Error(`Invalid role: ${update.status}`));
        }

        db.run(
          `
          UPDATE users
          SET role = ?
          WHERE id = ?
          `,
          [update.status, update.id],
          err => (err ? reject(err) : resolve())
        );
      }
    });
  });

  Promise.all(tasks)
    .then(() => res.json({ message: 'Resource statuses updated successfully' }))
    .catch(err => {
      console.error('Error updating resource statuses:', err);
      res.status(500).json({ error: 'Failed to update resource statuses' });
    });
};


exports.assignUsersToManager = (req, res) => {
  const { userIds, managerId } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'No users selected for assignment' });
  }

  // If managerId is not null, validate it
  const validateManager = () => {
    return new Promise((resolve, reject) => {
      if (!managerId) return resolve(); // null means unassign
      db.get(
        `SELECT id FROM users WHERE id = ? AND role = 'manager'`,
        [managerId],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(new Error('Invalid manager selected'));
          resolve();
        }
      );
    });
  };

  // Perform bulk update
  const bulkUpdate = () => {
    return new Promise((resolve, reject) => {
      const placeholders = userIds.map(() => '?').join(',');
      const sql = `
        UPDATE users
        SET manager_id = ?
        WHERE id IN (${placeholders})
      `;

      db.run(sql, [managerId, ...userIds], function (err) {
        if (err) return reject(err);
        resolve(this.changes); // number of rows updated
      });
    });
  };

  validateManager()
    .then(bulkUpdate)
    .then(updatedCount => {
      res.json({
        message: `Successfully updated ${updatedCount} user(s)`,
      });
    })
    .catch(err => {
      console.error('Bulk assignment error:', err);
      res.status(400).json({ error: err.message || 'Bulk assignment failed' });
    });
};

exports.getAllResources = (req, res) => {
  const query = `
    SELECT id, name, email, manager_id
    FROM users
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching resources:', err);
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }

    res.json(rows);
  });
};