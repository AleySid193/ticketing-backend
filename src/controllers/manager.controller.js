const db = require('../db/database');
const util = require('util');

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

exports.getViewTasks = (req, res) => {
  const managerId = req.user.id;
  db.all(`SELECT id, title, description, priority, points FROM tasks WHERE (is_deleted = 0 AND created_by = ?)`, 
    managerId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  })
};

exports.getAssignTasks = async (req, res) => {
  const managerId = req.user.id;
  const dbAll = util.promisify(db.all).bind(db);

  try {
    const tasks = await dbAll(
      `SELECT id, title, description, priority, points 
       FROM tasks 
       WHERE is_deleted = 0 AND created_by = ? AND status = "created"`,
      managerId
    );

    const myResources = await dbAll(
      `SELECT id, name FROM users WHERE manager_id = ?`,
      managerId
    );

    res.json({ Tasks: tasks, myResources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateViewTasks = (req, res) => {
  const { tasks = [], deletedTasksIds = [] } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!Array.isArray(tasks) || !Array.isArray(deletedTasksIds)) {
    return res.status(400).json({ error: 'Invalid payload format' });
  }

  let updatedCount = 0;
  let deletedCount = 0;

  /* ---------- UPDATE TASKS ---------- */
  const updateTasks = () =>
    new Promise((resolve, reject) => {
      if (tasks.length === 0) return resolve();

      const stmt = db.prepare(`
        UPDATE tasks
        SET
          title = ?,
          description = ?,
          priority = ?,
          points = ?
        WHERE id = ?
          AND created_by = ?
          AND is_deleted = 0
      `);

      try {
        for (const task of tasks) {
          if (
            !task.id ||
            !task.title?.trim() ||
            !task.description?.trim() ||
            !['high', 'medium', 'low'].includes(task.priority) ||
            task.points < 10 ||
            task.points > 100
          ) {
            throw new Error(`Invalid task data (id: ${task.id})`);
          }

          stmt.run(
            task.title.trim(),
            task.description.trim(),
            task.priority,
            task.points,
            task.id,
            userId,
            function (err) {
              if (err) return reject(err);
              updatedCount += this.changes;
            }
          );
        }

        stmt.finalize(resolve);
      } catch (err) {
        stmt.finalize();
        reject(err);
      }
    });

  /* ---------- DELETE TASKS ---------- */
  const deleteTasks = () =>
    new Promise((resolve, reject) => {
      if (deletedTasksIds.length === 0) return resolve();

      const placeholders = deletedTasksIds.map(() => '?').join(',');

      db.run(
        `
        UPDATE tasks
        SET is_deleted = 1
        WHERE id IN (${placeholders})
          AND created_by = ?
          AND is_deleted = 0
      `,
        [...deletedTasksIds, userId],
        function (err) {
          if (err) return reject(err);
          deletedCount = this.changes;
          resolve();
        }
      );
    });

  /* ---------- EXECUTION ---------- */
  Promise.all([updateTasks(), deleteTasks()])
    .then(() => {
      res.json({
        message: 'Tasks processed successfully',
        updatedCount,
        deletedCount,
      });
    })
    .catch(err => {
      console.error('Update view tasks error:', err);
      res.status(400).json({
        error: err.message || 'Failed to update tasks',
      });
    });
};

exports.updateAssignTasks = (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid payload format' });
  }

  const assignTasksPromises = updates.map(({ taskId, resourceId }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE tasks
        SET assigned_to = ?, status = 'assigned'
        WHERE id = ?
        `,
        [resourceId, taskId],
        err => (err ? reject(err) : resolve())
      );
    });
  });

  Promise.all(assignTasksPromises)
    .then(() =>
      res.json({ message: 'Task assignments updated successfully' })
    )
    .catch(err => {
      console.error('Error updating task assignments:', err);
      res.status(500).json({ error: 'Failed to update task assignments' });
    });
};

exports.getReviewTasks = (req, res) => {
  const managerId = req.user?.id;
  db.all(`SELECT id, title, description, points, priority FROM tasks WHERE (is_deleted = 0 AND created_by = ? AND status = "submitted")`, 
    managerId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  })
};

exports.updateReviewTasks = (req, res) => {
  const update = req.body;
  db.all(`UPDATE tasks SET status = ? WHERE (is_deleted = 0 AND id = ?)`, 
  update.status, update.id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Task status updated successfully' });
  })
};