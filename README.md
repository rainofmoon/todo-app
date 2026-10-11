const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

async function fetchTodos() {
  const response = await fetch(`/api/todos?filter=${currentFilter}`);
  const todos = await response.json();
  renderTodos(todos);
}

function renderTodos(todos) {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No todos here yet.';
    todoList.appendChild(empty);
  }

  todos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = `todo-item ${todo.completed ? 'completed' : ''}`;

    item.innerHTML = `
      <div class="todo-main">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} aria-label="Toggle todo status" />
        <span class="todo-title">${escapeHtml(todo.title)}</span>
      </div>
      <div class="todo-actions">
        <button class="todo-edit" type="button">Edit</button>
        <button class="todo-delete" type="button">Delete</button>
      </div>
    `;

    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', async () => {
      await updateTodo(todo.id, { completed: checkbox.checked });
      await fetchTodos();
    });

    const editButton = item.querySelector('.todo-edit');
    editButton.addEventListener('click', async () => {
      const newTitle = prompt('Edit todo:', todo.title);
      if (newTitle === null) return;

      const trimmed = newTitle.trim();
      if (!trimmed) {
        alert('Todo title cannot be empty');
        return;
      }

      await updateTodo(todo.id, { title: trimmed });
      await fetchTodos();
    });

    const deleteButton = item.querySelector('.todo-delete');
    deleteButton.addEventListener('click', async () => {
      await deleteTodo(todo.id);
      await fetchTodos();
    });

    todoList.appendChild(item);
  });

  const activeCount = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;
}

async function createTodo(title) {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create todo');
  }

  return data;
}

async function updateTodo(id, changes) {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(changes),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update todo');
  }

  return data;
}

async function deleteTodo(id) {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete todo');
  }

  return data;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

todoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = todoInput.value.trim();

  if (!title) {
    alert('Please enter a todo title');
    return;
  }

  try {
    await createTodo(title);
    todoInput.value = '';
    await fetchTodos();
  } catch (error) {
    alert(error.message);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    await fetchTodos();
  });
});

fetchTodos();
