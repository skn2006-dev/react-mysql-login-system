const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// =========================
// CORS
// =========================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5177",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5177",
  FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));

// =========================
// MYSQL CONNECTION
// =========================

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,

  ssl: process.env.DB_HOST?.includes("aivencloud.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

// =========================
// JWT AUTHENTICATION
// =========================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      message: "Server authentication is not configured.",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      message:
        "Your session is invalid or expired. Please log in again.",
    });
  }
}

// =========================
// TASK VALIDATION
// =========================

function validateTask(body, partial = false) {
  const {
    title,
    description,
    due_date,
    due_time,
    priority,
    status,
  } = body;

  if (!partial || title !== undefined) {
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 255
    ) {
      return "Task title is required and must be at most 255 characters.";
    }
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "Description must be text.";
  }

  if (description?.length > 5000) {
    return "Description must be at most 5000 characters.";
  }

  if (!partial || due_date !== undefined) {
    if (
      typeof due_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
      Number.isNaN(
        Date.parse(`${due_date}T00:00:00`)
      )
    ) {
      return "Please provide a valid due date in YYYY-MM-DD format.";
    }
  }

  if (
    due_time !== undefined &&
    due_time !== null &&
    due_time !== "" &&
    !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(
      due_time
    )
  ) {
    return "Please provide a valid time.";
  }

  if (
    priority !== undefined &&
    !["Low", "Medium", "High"].includes(priority)
  ) {
    return "Priority must be Low, Medium, or High.";
  }

  if (
    status !== undefined &&
    !["Pending", "In Progress", "Completed"].includes(
      status
    )
  ) {
    return "Status must be Pending, In Progress, or Completed.";
  }

  return null;
}

// =========================
// HEALTH CHECK
// =========================

app.get("/", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.send("Backend and MySQL are connected!");
  } catch (error) {
    console.error(
      "Database connection error:",
      error
    );

    res.status(500).send(
      "Database connection failed."
    );
  }
});

// =========================
// REGISTER
// =========================

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanName.length > 100 ||
      cleanEmail.length > 150
    ) {
      return res.status(400).json({
        message: "Name or email is too long.",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (
      password.length < 6 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters and no more than 72 bytes.",
      });
    }

    // Check existing user
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    // Email verification is no longer required.
    const [result] = await db.execute(
      `INSERT INTO users
       (name, email, password, email_verified)
       VALUES (?, ?, ?, TRUE)`,
      [
        cleanName,
        cleanEmail,
        hashedPassword,
      ]
    );

    return res.status(201).json({
      message: "Registration successful!",
      user: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    return res.status(500).json({
      message:
        "Something went wrong during registration.",
    });
  }
});

// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Please enter your email and password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        message:
          "Server authentication is not configured.",
      });
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    const [users] = await db.execute(
      `SELECT id, name, email, password
       FROM users
       WHERE email = ?`,
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login successful!",
      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong during login.",
    });
  }
});

// =========================
// GET ALL TASKS
// =========================

app.get(
  "/api/tasks",
  authenticateToken,
  async (req, res) => {
    try {
      const [tasks] = await db.execute(
        `SELECT
           id,
           title,
           description,
           due_date,
           due_time,
           priority,
           status,
           created_at,
           updated_at
         FROM tasks
         WHERE user_id = ?
         ORDER BY due_date ASC,
                  due_time ASC,
                  id DESC`,
        [req.user.id]
      );

      return res.json({
        tasks,
      });
    } catch (error) {
      console.error(
        "Get tasks error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve tasks.",
      });
    }
  }
);

// =========================
// CREATE TASK
// =========================

app.post(
  "/api/tasks",
  authenticateToken,
  async (req, res) => {
    try {
      const validationError =
        validateTask(req.body);

      if (validationError) {
        return res.status(400).json({
          message: validationError,
        });
      }

      const {
        title,
        description = "",
        due_date,
        due_time = null,
        priority = "Medium",
        status = "Pending",
      } = req.body;

      const [result] = await db.execute(
        `INSERT INTO tasks
         (
           user_id,
           title,
           description,
           due_date,
           due_time,
           priority,
           status
         )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          title.trim(),
          description,
          due_date,
          due_time || null,
          priority,
          status,
        ]
      );

      const [tasks] = await db.execute(
        `SELECT
           id,
           title,
           description,
           due_date,
           due_time,
           priority,
           status,
           created_at,
           updated_at
         FROM tasks
         WHERE id = ?
           AND user_id = ?`,
        [
          result.insertId,
          req.user.id,
        ]
      );

      return res.status(201).json({
        message: "Task saved successfully!",
        task: tasks[0],
      });
    } catch (error) {
      console.error(
        "Create task error:",
        error
      );

      return res.status(500).json({
        message: "Unable to save task.",
      });
    }
  }
);

// =========================
// UPDATE TASK
// =========================

app.put(
  "/api/tasks/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const taskId = Number(
        req.params.id
      );

      if (
        !Number.isSafeInteger(taskId) ||
        taskId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid task ID.",
        });
      }

      const validationError =
        validateTask(req.body);

      if (validationError) {
        return res.status(400).json({
          message: validationError,
        });
      }

      const {
        title,
        description = "",
        due_date,
        due_time = null,
        priority = "Medium",
        status = "Pending",
      } = req.body;

      const [result] = await db.execute(
        `UPDATE tasks
         SET
           title = ?,
           description = ?,
           due_date = ?,
           due_time = ?,
           priority = ?,
           status = ?
         WHERE id = ?
           AND user_id = ?`,
        [
          title.trim(),
          description,
          due_date,
          due_time || null,
          priority,
          status,
          taskId,
          req.user.id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      const [tasks] = await db.execute(
        `SELECT
           id,
           title,
           description,
           due_date,
           due_time,
           priority,
           status,
           created_at,
           updated_at
         FROM tasks
         WHERE id = ?
           AND user_id = ?`,
        [
          taskId,
          req.user.id,
        ]
      );

      return res.json({
        message:
          "Task updated successfully!",
        task: tasks[0],
      });
    } catch (error) {
      console.error(
        "Update task error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update task.",
      });
    }
  }
);

// =========================
// DELETE TASK
// =========================

app.delete(
  "/api/tasks/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const taskId = Number(
        req.params.id
      );

      if (
        !Number.isSafeInteger(taskId) ||
        taskId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid task ID.",
        });
      }

      const [result] = await db.execute(
        `DELETE FROM tasks
         WHERE id = ?
           AND user_id = ?`,
        [
          taskId,
          req.user.id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      return res.json({
        message:
          "Task deleted successfully!",
      });
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete task.",
      });
    }
  }
);

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `Backend running on port ${PORT}`
  );
});