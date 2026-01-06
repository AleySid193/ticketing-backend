const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.env.DB_STORAGE);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log(`SQLite connected at: ${dbPath}`);
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');

  /* =========================
     USERS
     ========================= */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,

      role TEXT NOT NULL
        CHECK (role IN ('pending', 'user', 'manager', 'admin'))
        DEFAULT 'pending',

      manager_id INTEGER NULL,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (manager_id) REFERENCES users(id)
    )
  `);

  /* =========================
     TASKS
     ========================= */
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      title TEXT NOT NULL,
      description TEXT,

      priority TEXT NOT NULL
        CHECK (priority IN ('low', 'medium', 'high')),

      status TEXT NOT NULL
        CHECK (status IN (
          'assigned',
          'submitted',
          'approved',
          'rejected',
          'completed'
        )),

      assigned_to INTEGER,
      created_by INTEGER NOT NULL,

      points INTEGER,
      is_deleted INTEGER DEFAULT 0,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  /* =========================
     INDEXES (important)
     ========================= */
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by)`);
});

module.exports = db;
