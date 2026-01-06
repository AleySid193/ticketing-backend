const db = require('../db/database');

/* =========================
   USER: VIEW TASKS
========================= */
exports.getMyTasks = (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT *
    FROM tasks
    WHERE assigned_to = ?
      AND is_deleted = 0
  `;
  const params = [req.user.id];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

/* =========================
   USER: SUBMIT TASK
========================= */
exports.submitTask = (req, res) => {
  const { taskId } = req.params;

  db.run(
    `
    UPDATE tasks
    SET status = 'submitted'
    WHERE id = ? AND assigned_to = ?
    `,
    [taskId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(403).json({ error: 'You can only submit your own tasks' });

      res.json({ message: 'Task submitted' });
    }
  );
};

/* =========================
   MANAGER: CREATE TASK
========================= */
exports.createTask = (req, res) => {
  const { title, description, priority, assignedTo } = req.body;

  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Only managers can create tasks' });
  }

  // Validate assigned user belongs to this manager
  db.get(
    `SELECT id FROM users WHERE id = ? AND manager_id = ?`,
    [assignedTo, req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: 'Assigned user is not under your management' });

      db.run(
        `
        INSERT INTO tasks
        (title, description, priority, status, assigned_to, created_by)
        VALUES (?, ?, ?, 'assigned', ?, ?)
        `,
        [title, description, priority, assignedTo, req.user.id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ message: 'Task created', taskId: this.lastID });
        }
      );
    }
  );
};

/* =========================
   MANAGER: APPROVE / REJECT TASK
========================= */
exports.reviewTask = (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Only managers can review tasks' });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Only allow manager to approve tasks created by themselves
  db.run(
    `
    UPDATE tasks
    SET status = ?
    WHERE id = ? AND created_by = ?
    `,
    [status, taskId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(403).json({ error: 'You can only review tasks created by you' });

      res.json({ message: `Task ${status}` });
    }
  );
};
