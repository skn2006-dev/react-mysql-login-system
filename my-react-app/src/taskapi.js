const API_URL = import.meta.env.VITE_API_URL;

// Get the saved login token
const getToken = () => localStorage.getItem("token");

// Common function for sending requests to the backend
const taskRequest = async (endpoint, options = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in again.");
  }

  const isFormData = options.body instanceof FormData;

  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  // IMPORTANT:
  // Do NOT manually set Content-Type for FormData.
  // The browser automatically adds multipart/form-data
  // with the correct boundary.
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Task request failed."
    );
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
  const formData = new FormData();

  formData.append("title", task.title);
  formData.append(
    "description",
    task.description || ""
  );
  formData.append("due_date", task.due_date);
  formData.append(
    "due_time",
    task.due_time || ""
  );
  formData.append(
    "priority",
    task.priority || "Medium"
  );
  formData.append(
    "status",
    task.status || "Pending"
  );

  // Add image only if the user selected one
  if (task.imageFile) {
    formData.append(
      "image",
      task.imageFile
    );
  }

  return taskRequest("/api/tasks", {
    method: "POST",
    body: formData,
  });
};

// Update an existing task
export const updateTask = async (id, task) => {
  const formData = new FormData();

  formData.append("title", task.title);
  formData.append(
    "description",
    task.description || ""
  );
  formData.append("due_date", task.due_date);
  formData.append(
    "due_time",
    task.due_time || ""
  );
  formData.append(
    "priority",
    task.priority || "Medium"
  );
  formData.append(
    "status",
    task.status || "Pending"
  );

  // Add a new image if selected
  if (task.imageFile) {
    formData.append(
      "image",
      task.imageFile
    );
  }

  // Tell backend to remove existing image
  if (task.removeImage) {
    formData.append(
      "removeImage",
      "true"
    );
  }

  return taskRequest(
    `/api/tasks/${id}`,
    {
      method: "PUT",
      body: formData,
    }
  );
};

// Delete a task
export const deleteTask = async (id) => {
  return taskRequest(
    `/api/tasks/${id}`,
    {
      method: "DELETE",
    }
  );
};

// Get the URL of a task image
export const getTaskImageUrl = (id) => {
  return `${API_URL}/api/tasks/${id}/image`;
};