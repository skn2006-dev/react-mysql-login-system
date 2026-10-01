
const API_URL = import.meta.env.VITE_API_URL;

// Get the saved login token
const getToken = () => localStorage.getItem("token");

// Common function for sending requests to the backend
const taskRequest = async (endpoint, options = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in again.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Task request failed.");
  }

  return data;
};

// Get all tasks for the logged-in user
export const getTasks = async () => {
  const data = await taskRequest("/api/tasks");
  return data.tasks || [];
};

// Add a new task
export const addTask = async (task) => {
  return taskRequest("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
};

// Update an existing task
export const updateTask = async (id, task) => {
  return taskRequest(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
};

// Delete a task
export const deleteTask = async (id) => {
  return taskRequest(`/api/tasks/${id}`, {
    method: "DELETE",
  });
};
