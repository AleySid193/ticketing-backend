const db = require('../db/database');

/* =========================
   USER: VIEW TASKS
========================= */
exports.getMyTasks = (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT * FROM tasks
    WHERE assigned_to = ?
    AND is_deleted = 0
  `;
  const params = [req.user.id];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  db.all(query, params, (_, rows) => res.json(rows));
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
    function () {
      res.json({ message: 'Task submitted' });
    }
  );
};

/* =========================
   MANAGER: CREATE TASK
========================= */
exports.createTask = (req, res) => {
  const { title, description, priority, assignedTo } = req.body;

  db.run(
    `
    INSERT INTO tasks
    (title, description, priority, status, assigned_to, created_by)
    VALUES (?, ?, ?, 'assigned', ?, ?)
    `,
    [title, description, priority, assignedTo, req.user.id],
    function () {
      res.status(201).json({ message: 'Task created' });
    }
  );
};

/* =========================
   MANAGER: APPROVE / REJECT
========================= */
exports.reviewTask = (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body; // approved | rejected

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    `
    UPDATE tasks
    SET status = ?
    WHERE id = ?
    `,
    [status, taskId],
    function () {
      res.json({ message: `Task ${status}` });
    }
  );
};
