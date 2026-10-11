const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'todos.db');
const db = new sqlite3.Database(dbPath);

function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        }
      );
    });
  });
}

function getTodos(filter = 'all') {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM todos ORDER BY created_at DESC';

    if (filter === 'active') {
      query = 'SELECT * FROM todos WHERE completed = 0 ORDER BY created_at DESC';
    } else if (filter === 'completed') {
      query = 'SELECT * FROM todos WHERE completed = 1 ORDER BY created_at DESC';
    }

    db.all(query, [], (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      const todos = rows.map((row) => ({
        id: row.id,
        title: row.title,
        completed: Boolean(row.completed),
        created_at: row.created_at,
      }));

      resolve(todos);
    });
  });
}

function createTodo(title) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO todos (title, completed) VALUES (?, 0)';
    db.run(sql, [title], function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        id: this.lastID,
        title,
        completed: false,
      });
    });
  });
}

function updateTodo(id, updates) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }

    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }

    if (fields.length === 0) {
      resolve(null);
      return;
    }

    values.push(id);
    const sql = `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`;

    db.run(sql, values, (error) => {
      if (error) {
        reject(error);
        return;
      }

      db.get('SELECT * FROM todos WHERE id = ?', [id], (fetchError, row) => {
        if (fetchError) {
          reject(fetchError);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        resolve({
          id: row.id,
          title: row.title,
          completed: Boolean(row.completed),
          created_at: row.created_at,
        });
      });
    });
  });
}

function deleteTodo(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM todos WHERE id = ?', [id], function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this.changes > 0);
    });
  });
}

module.exports = {
  initDb,
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
};
