
import { useEffect, useState } from "react";
import Calendar from "./calender";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
} from "./taskapi";
import "./Dashboard.css";

const emptyTask = {
  title: "",
  description: "",
  due_date: "",
  due_time: "",
  priority: "Medium",
  status: "Pending",
};

const pages = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tasks", label: "Tasks" },
  { id: "calendar", label: "Calendar" },
  { id: "progress", label: "Progress" },
];

function Dashboard({ userName, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({ ...emptyTask });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Unable to load tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTask((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setTask({ ...emptyTask });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!task.title.trim()) {
      setMessage("Please enter a task title.");
      return;
    }

    if (!task.due_date) {
      setMessage("Please select a due date.");
      return;
    }

    const wasEditing = editingId !== null;
    const taskData = {
      ...task,
      title: task.title.trim(),
      description: task.description.trim(),
      due_time: task.due_time || null,
    };

    try {
      setIsSaving(true);

      if (wasEditing) {
        await updateTask(editingId, taskData);
      } else {
        await addTask(taskData);
      }

      resetForm();
      await loadTasks();
      setMessage(
        wasEditing
          ? "Task updated successfully!"
          : "Task added successfully!"
      );
    } catch (error) {
      setMessage(error.message || "Unable to save task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (selectedTask) => {
    setEditingId(selectedTask.id);
    setTask({
      title: selectedTask.title || "",
      description: selectedTask.description || "",
      due_date: selectedTask.due_date
        ? String(selectedTask.due_date).slice(0, 10)
        : "",
      due_time: selectedTask.due_time
        ? String(selectedTask.due_time).slice(0, 5)
        : "",
      priority: selectedTask.priority || "Medium",
      status: selectedTask.status || "Pending",
    });
    setMessage("");
    setActivePage("tasks");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await deleteTask(id);
      setTasks((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (editingId === id) resetForm();

      setMessage("Task deleted successfully!");
    } catch (error) {
      setMessage(error.message || "Unable to delete task.");
    }
  };

  const handleStatusChange = async (selectedTask, status) => {
    try {
      await updateTask(selectedTask.id, {
        title: selectedTask.title,
        description: selectedTask.description || "",
        due_date: String(selectedTask.due_date).slice(0, 10),
        due_time: selectedTask.due_time || null,
        priority: selectedTask.priority || "Medium",
        status,
      });

      await loadTasks();
      setMessage("Task status updated!");
    } catch (error) {
      setMessage(error.message || "Unable to update task status.");
    }
  };

  const total = tasks.length;
  const pending = tasks.filter(
    (item) => item.status === "Pending"
  ).length;
  const inProgress = tasks.filter(
    (item) => item.status === "In Progress"
  ).length;
  const completed = tasks.filter(
    (item) => item.status === "Completed"
  ).length;

  const completion = total
    ? Math.round((completed / total) * 100)
    : 0;

  const pageTitle = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    calendar: "Calendar",
    progress: "Progress",
  }[activePage];

  const renderSummary = () => (
    <section className="summary-grid">
      <article className="summary-card total-card">
        <span className="summary-label">Total Tasks</span>
        <strong>{total}</strong>
        <span className="summary-note">All your tasks</span>
      </article>

      <article className="summary-card pending-card">
        <span className="summary-label">Pending</span>
        <strong>{pending}</strong>
        <span className="summary-note">Waiting to start</span>
      </article>

      <article className="summary-card progress-card">
        <span className="summary-label">In Progress</span>
        <strong>{inProgress}</strong>
        <span className="summary-note">Currently working</span>
      </article>

      <article className="summary-card completed-card">
        <span className="summary-label">Completed</span>
        <strong>{completed}</strong>
        <span className="summary-note">Tasks finished</span>
      </article>
    </section>
  );

  const renderTaskForm = () => (
    <section className="content-card">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">TASK ORGANIZER</span>
          <h2>{editingId !== null ? "Edit Task" : "Add New Task"}</h2>
          <p>Enter your task details and organize your work.</p>
        </div>
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <label>
          Task title
          <input
            type="text"
            name="title"
            placeholder="Enter task title"
            value={task.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            placeholder="Enter task description"
            rows="3"
            value={task.description}
            onChange={handleChange}
          />
        </label>

        <div className="form-row">
          <label>
            Due date
            <input
              type="date"
              name="due_date"
              value={task.due_date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Due time
            <input
              type="time"
              name="due_time"
              value={task.due_time}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Priority
            <select
              name="priority"
              value={task.priority}
              onChange={handleChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <label>
            Status
            <select
              name="status"
              value={task.status}
              onChange={handleChange}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
        </div>

        {message && (
          <p className="dashboard-message" role="status">
            {message}
          </p>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : editingId !== null
                ? "Update Task"
                : "Add Task"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="secondary-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );

  const renderTaskList = (items, showHeading = true) => {
    const filteredItems = items.filter((item) => {
      if (activePage !== "tasks" || !searchTerm.trim()) {
        return true;
      }

      const searchableText = [
        item.title,
        item.description,
        item.status,
        item.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm.trim().toLowerCase());
    });

    return (
      <section className="content-card">
        {showHeading && (
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">YOUR WORK</span>
              <h2>All Tasks</h2>
              <p>Review, update or remove your tasks.</p>
            </div>

            <span className="task-count">
              {filteredItems.length} tasks
            </span>
          </div>
        )}

        {activePage === "tasks" && (
          <div className="task-search">
            <input
              type="search"
              placeholder="Search tasks by title, description, status or priority..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search tasks"
            />
          </div>
        )}

        {isLoading ? (
          <p className="empty-message">Loading tasks...</p>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            <h3>
              {searchTerm.trim()
                ? "No matching tasks found"
                : "No tasks found"}
            </h3>
            <p>
              {searchTerm.trim()
                ? "Try another search term."
                : "Add a task to see it here."}
            </p>

            {!searchTerm.trim() && (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setActivePage("tasks");
                  resetForm();
                }}
              >
                Create a task
              </button>
            )}
          </div>
        ) : (
          <div className="task-list">
            {filteredItems.map((item) => {
              const priority = (
                item.priority || "Medium"
              ).toLowerCase();

              const status = (item.status || "Pending")
                .toLowerCase()
                .replace(/\s+/g, "-");

              return (
                <article className="task-card" key={item.id}>
                  <div className="task-card-main">
                    <div className="task-title-row">
                      <h3>{item.title}</h3>
                      <span
                        className={`priority-badge priority-${priority}`}
                      >
                        {item.priority || "Medium"}
                      </span>
                    </div>

                    {item.description && (
                      <p className="task-description">
                        {item.description}
                      </p>
                    )}

                    <div className="task-meta">
                      <span>
                        <strong>Due:</strong>{" "}
                        {String(item.due_date || "").slice(0, 10)}
                      </span>

                      {item.due_time && (
                        <span>
                          <strong>Time:</strong>{" "}
                          {String(item.due_time).slice(0, 5)}
                        </span>
                      )}
                    </div>

                    <label className="status-control">
                      Status
                      <select
                        className={`status-select status-${status}`}
                        value={item.status || "Pending"}
                        onChange={(event) =>
                          handleStatusChange(item, event.target.value)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </label>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const renderDashboardPage = () => (
    <>
      {renderSummary()}

      <section className="content-card overview-card">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">OVERVIEW</span>
            <h2>Welcome back, {userName || "User"}!</h2>
            <p>Here's a quick look at your task activity.</p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              resetForm();
              setActivePage("tasks");
            }}
          >
            + Add Task
          </button>
        </div>

        <div className="overview-progress">
          <div className="progress-label">
            <span>Overall completion</span>
            <strong>{completion}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </section>

      {renderTaskList(tasks.slice(0, 3), true)}

      {tasks.length > 3 && (
        <button
          type="button"
          className="text-button"
          onClick={() => setActivePage("tasks")}
        >
          View all tasks →
        </button>
      )}
    </>
  );

  const renderTasksPage = () => (
    <>
      {renderTaskForm()}
      {renderTaskList(tasks)}
    </>
  );

  const renderCalendarPage = () => (
    <section className="content-card calendar-page-card">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">PLAN YOUR SCHEDULE</span>
          <h2>Task Calendar</h2>
          <p>View your calendar and keep track of your schedule.</p>
        </div>
      </div>

      <div className="calendar-content">
        <Calendar tasks={tasks} />
      </div>
    </section>
  );

  const renderProgressPage = () => (
    <>
      {renderSummary()}

      <section className="content-card progress-page-card">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">YOUR PERFORMANCE</span>
            <h2>Task Progress</h2>
            <p>Track how your tasks are progressing.</p>
          </div>
        </div>

        <div className="overall-progress">
          <div className="overall-progress-top">
            <span>Overall completion</span>
            <strong>{completion}%</strong>
          </div>

          <div className="progress-track large-track">
            <div
              className="progress-fill"
              style={{ width: `${completion}%` }}
            />
          </div>

          <p>
            {completed} of {total} tasks completed
          </p>
        </div>

        <div className="progress-breakdown">
          <div className="breakdown-row">
            <div className="breakdown-title">
              <span className="legend-dot dot-pending" />
              <span>Pending</span>
              <strong>{pending}</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill fill-pending"
                style={{
                  width: `${total ? (pending / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="breakdown-row">
            <div className="breakdown-title">
              <span className="legend-dot dot-progress" />
              <span>In Progress</span>
              <strong>{inProgress}</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill fill-progress"
                style={{
                  width: `${total ? (inProgress / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="breakdown-row">
            <div className="breakdown-title">
              <span className="legend-dot dot-completed" />
              <span>Completed</span>
              <strong>{completed}</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill fill-completed"
                style={{
                  width: `${total ? (completed / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="brand-area">
            <div className="brand-mark">T</div>
            <div>
              <span className="brand-caption">TASK MANAGER</span>
              <h1>{pageTitle}</h1>
              <p>Hello, {userName || "User"}!</p>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </header>

        <nav
          className="dashboard-navigation"
          aria-label="Main navigation"
        >
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`navigation-button ${
                activePage === page.id ? "active" : ""
              }`}
              aria-current={
                activePage === page.id ? "page" : undefined
              }
              onClick={() => {
                setActivePage(page.id);
                setMessage("");
              }}
            >
              {page.label}
            </button>
          ))}
        </nav>

        <div className="page-content">
          {activePage === "dashboard" && renderDashboardPage()}
          {activePage === "tasks" && renderTasksPage()}
          {activePage === "calendar" && renderCalendarPage()}
          {activePage === "progress" && renderProgressPage()}
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
