const db = require('../db/database');

exports.getDashboard = (req, res) => {
  const normalUserId = req.user.id;
  const stats = {};

  db.get(
    `SELECT COALESCE(COUNT(*), 0) AS total 
     FROM tasks 
     WHERE assigned_to = ? AND priority = "high"`,
    normalUserId,
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.high = row.total;

      db.get(
        `SELECT COALESCE(COUNT(*), 0) AS total 
         FROM tasks 
         WHERE assigned_to = ? AND status = "assigned"`,
        normalUserId,
        (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.assigned = row.total;

          db.get(
            `SELECT COALESCE(COUNT(*), 0) AS total 
             FROM tasks 
             WHERE assigned_to = ? AND status = "completed"`,
            normalUserId,
            (err, row) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.completed = row.total;

              db.get(
                `SELECT COALESCE(COUNT(*), 0) AS total 
                 FROM tasks 
                 WHERE assigned_to = ? AND status = "rejected"`,
                normalUserId,
                (err, row) => {
                  if (err) return res.status(500).json({ error: err.message });
                  stats.rejected = row.total;
                  res.json(stats);
                }
              );
            }
          );
        }
      );
    }
  );
};


exports.getManager = (req, res) => {
  const normalUserId = req.user.id;
  const data = {};

  db.get(
    `SELECT name FROM users WHERE id = (
      SELECT manager_id FROM users WHERE id = ?)`,
    normalUserId,
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      data.managerName = row.name;
      res.json(data);
});
}