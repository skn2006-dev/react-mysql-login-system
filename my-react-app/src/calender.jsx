
import { useMemo, useState } from "react";
import "./calender.css";

function Calendar({ tasks, onSelectDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const taskDates = useMemo(() => {
    const dates = {};

    tasks.forEach((task) => {
      if (!task.due_date) return;

      const dateKey = String(task.due_date).slice(0, 10);
      dates[dateKey] = (dates[dateKey] || 0) + 1;
    });

    return dates;
  }, [tasks]);

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const changeMonth = (amount) => {
    setCurrentDate(new Date(year, month + amount, 1));
  };

  const selectDay = (day) => {
    if (!day) return;

    const dateKey = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");

    setSelectedDate(dateKey);
    onSelectDate?.(dateKey);
  };

  const selectedTasks = tasks.filter(
    (task) =>
      task.due_date &&
      String(task.due_date).slice(0, 10) === selectedDate
  );

  const today = new Date().toLocaleDateString("en-CA");

  return (
    <section className="calendar-card">
      <div className="calendar-header">
        <div>
          <h2>Task Calendar</h2>
          <p>View your tasks by date</p>
        </div>

        <div className="calendar-navigation">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>

          <strong>{monthName}</strong>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (day) => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          )
        )}

        {calendarDays.map((day, index) => {
          if (!day) {
            return (
              <div
                className="calendar-day calendar-empty"
                key={`empty-${index}`}
              />
            );
          }

          const dateKey = [
            year,
            String(month + 1).padStart(2, "0"),
            String(day).padStart(2, "0"),
          ].join("-");

          const taskCount = taskDates[dateKey] || 0;
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;

          return (
            <button
              type="button"
              className={[
                "calendar-day",
                isToday ? "calendar-today" : "",
                isSelected ? "calendar-selected" : "",
                taskCount ? "calendar-has-tasks" : "",
              ].join(" ")}
              key={dateKey}
              onClick={() => selectDay(day)}
              aria-label={`${dateKey}, ${taskCount} tasks`}
              aria-pressed={isSelected}
            >
              <span>{day}</span>
              {taskCount > 0 && (
                <span className="calendar-task-count">
                  {taskCount} {taskCount === 1 ? "task" : "tasks"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="calendar-selected-tasks">
        <h3>
          Tasks for{" "}
          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric",
              year: "numeric",
            }
          )}
        </h3>

        {selectedTasks.length === 0 ? (
          <p className="calendar-no-tasks">
            No tasks scheduled for this date.
          </p>
        ) : (
          <ul>
            {selectedTasks.map((task) => (
              <li key={task.id}>
                <strong>{task.title}</strong>
                <span>{task.status || "Pending"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Calendar;
