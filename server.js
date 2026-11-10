const express = require('express');
const path = require('path');
const {
  initDb,
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Todo API is running' });
});

app.get('/api/todos', async (req, res) => {
  try {
    const filter = (req.query.filter || 'all').toString();
    const todos = await getTodos(filter);
    res.json(todos);
    console.log('Fetched todos:', todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Todo title is required' });
    }

    const todo = await createTodo(title.trim());
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    const data = {};
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Todo title cannot be empty' });
      }
      data.title = title.trim();
    }

    if (completed !== undefined) {
      data.completed = Boolean(completed);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const todo = await updateTodo(Number(id), data);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteTodo(Number(id));

    if (!deleted) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Failed to delete todo' });
  }
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Todo app running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
