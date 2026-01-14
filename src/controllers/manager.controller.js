const db = require('../db/database');

exports.getDashboardStats = (req, res) => {
  const managerId = req.user.id;
  const stats = {};

  db.get(`SELECT COALESCE(COUNT(*), 0) AS myResources FROM users WHERE manager_id = ?`, [managerId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.myResources = row.myResources;
    res.json(stats);
  })
};

exports.bulkCreateTasks = (req, res) => {
  const { tasks } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!Array.isArray(tasks) || tasks.length === 0) return res.status(400).json({ error: 'No tasks provided' });

  let createdCount = 0;

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, priority, points, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.serialize(() => {
    for (const task of tasks) {
      stmt.run(
        task.title,
        task.description,
        task.priority,
        task.points,
        userId,
        'created',
        function(err) {
          if (err) console.error('Insert error:', err.message, 'Task:', task);
          else createdCount++;
        }
      );
    }

    stmt.finalize(err => {
      if (err) {
        console.error('Finalize error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: `Successfully created ${createdCount} task(s)`, createdCount });
    });
  });
};