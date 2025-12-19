const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
  path.join(__dirname, 'todo.db'),
  (err) => {
    if (err) console.error(err);
    else console.log('SQLite connected');
  }
);

db.serialize(() => {
  /* =========================
     USERS
  ========================= */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* =========================
     ROLES
  ========================= */
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  /* =========================
     USER ↔ ROLE (MANY-TO-MANY)
  ========================= */
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
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
      priority TEXT CHECK(priority IN ('low','medium','high')) NOT NULL,
      status TEXT CHECK(status IN (
        'assigned',
        'submitted',
        'approved',
        'rejected',
        'completed'
      )) NOT NULL,
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
     SEED ROLES (IDEMPOTENT)
  ========================= */
  db.run(`INSERT OR IGNORE INTO roles (name) VALUES ('admin')`);
  db.run(`INSERT OR IGNORE INTO roles (name) VALUES ('manager')`);
  db.run(`INSERT OR IGNORE INTO roles (name) VALUES ('user')`);
});

module.exports = db;
