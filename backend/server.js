
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5177",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5177",
  FRONTEND_URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10kb" }));

// MySQL connection
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
    : undefined
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helpers
function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return { token, tokenHash };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function sendVerificationEmail(email, name, token) {
  const backendUrl =
    process.env.BACKEND_URL || `http://localhost:${PORT}`;

  const verificationUrl =
    `${backendUrl}/api/verify-email?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: `"Authentication System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email address",
    text:
      `Hello ${name},\n\n` +
      `Please verify your email by opening this link:\n` +
      `${verificationUrl}\n\n` +
      `This link expires in 24 hours.\n` +
      `If you did not create this account, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2>Verify your email address</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Thank you for registering. Click below to verify your email.</p>
        <p style="margin:28px 0">
          <a href="${verificationUrl}"
             style="background:#2563eb;color:white;padding:12px 22px;
                    text-decoration:none;border-radius:6px;display:inline-block">
            Verify Email
          </a>
        </p>
        <p>This link expires in 24 hours and can only be used once.</p>
        <p>If you did not create this account, ignore this email.</p>
      </div>
    `
  });
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue."
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");
    return res.status(500).json({
      message: "Server authentication is not configured."
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your session is invalid or expired. Please log in again."
    });
  }
}

// Validate task fields
function validateTask(body, partial = false) {
  const {
    title,
    description,
    due_date,
    due_time,
    priority,
    status
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

  if (typeof description === "string" && description.length > 5000) {
    return "Description must be at most 5000 characters.";
  }

  if (!partial || due_date !== undefined) {
    if (
      typeof due_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
      Number.isNaN(Date.parse(`${due_date}T00:00:00`))
    ) {
      return "Please provide a valid due date in YYYY-MM-DD format.";
    }
  }

  if (
    due_time !== undefined &&
    due_time !== null &&
    due_time !== "" &&
    !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(due_time)
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
    !["Pending", "In Progress", "Completed"].includes(status)
  ) {
    return "Status must be Pending, In Progress, or Completed.";
  }

  return null;
}

// Health check
app.get("/", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.send("Backend and MySQL are connected!");
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).send("Database connection failed.");
  }
});

// Register
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
        message: "Please fill in all fields."
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length > 100 || cleanEmail.length > 150) {
      return res.status(400).json({
        message: "Name or email is too long."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    if (
      password.length < 6 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Password must be at least 6 characters and no more than 72 bytes."
      });
    }

    const [existingUsers] = await db.execute(
      "SELECT id, email_verified FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      if (!existingUsers[0].email_verified) {
        return res.status(409).json({
          message: "This email is already registered but not verified. Please use the resend verification option.",
          needsVerification: true
        });
      }

      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { token, tokenHash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await db.execute(
      `INSERT INTO users
       (name, email, password, email_verified,
        verification_token_hash, verification_expires_at)
       VALUES (?, ?, ?, FALSE, ?, ?)`,
      [cleanName, cleanEmail, hashedPassword, tokenHash, expiresAt]
    );

    try {
      await sendVerificationEmail(cleanEmail, cleanName, token);
    } catch (emailError) {
      console.error("Verification email error:", emailError);
      return res.status(201).json({
        message: "Account created, but the verification email could not be sent. Please use the resend verification option.",
        needsVerification: true,
        emailSent: false,
        userId: result.insertId
      });
    }

    return res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      needsVerification: true,
      emailSent: true
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    return res.status(500).json({
      message: "Something went wrong during registration."
    });
  }
});

// Verify email
app.get("/api/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).send(
        "<h2>Invalid verification link</h2><p>Please request a new verification email.</p>"
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [users] = await db.execute(
      `SELECT id FROM users
       WHERE verification_token_hash = ?
         AND verification_expires_at > NOW()
         AND email_verified = FALSE`,
      [tokenHash]
    );

    if (users.length === 0) {
      return res.status(400).send(`
        <h2>Verification link invalid or expired</h2>
        <p>Please return to the application and request a new verification email.</p>
        <a href="${escapeHtml(FRONTEND_URL)}">Go to login</a>
      `);
    }

    await db.execute(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token_hash = NULL,
           verification_expires_at = NULL
       WHERE id = ?`,
      [users[0].id]
    );

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Email Verified</title></head>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:60px 20px">
          <h2>Email verified successfully!</h2>
          <p>Your account is now verified. You can log in.</p>
          <a href="${escapeHtml(FRONTEND_URL)}"
             style="display:inline-block;background:#2563eb;color:white;
                    padding:12px 24px;border-radius:6px;text-decoration:none">
            Go to Login
          </a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).send(
      "Something went wrong during email verification."
    );
  }
});

// Resend verification email
app.post("/api/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Please enter your email address."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await db.execute(
      `SELECT id, name, email, email_verified
       FROM users WHERE email = ?`,
      [cleanEmail]
    );

    const genericMessage =
      "If your account exists and needs verification, a verification email will be sent.";

    if (users.length === 0 || users[0].email_verified) {
      return res.json({ message: genericMessage });
    }

    const user = users[0];
    const { token, tokenHash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.execute(
      `UPDATE users
       SET verification_token_hash = ?,
           verification_expires_at = ?
       WHERE id = ? AND email_verified = FALSE`,
      [tokenHash, expiresAt, user.id]
    );

    await sendVerificationEmail(user.email, user.name, token);
    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      message: "Unable to send verification email right now. Please try again later."
    });
  }
});

// Login
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
        message: "Please enter your email and password."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({
        message: "Server authentication is not configured."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await db.execute(
      `SELECT id, name, email, password, email_verified
       FROM users WHERE email = ?`,
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in. You can request a new verification email.",
        needsVerification: true
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Something went wrong during login."
    });
  }
});

// Get all tasks belonging to the logged-in user
app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.execute(
      `SELECT id, title, description, due_date, due_time,
              priority, status, created_at, updated_at
       FROM tasks
       WHERE user_id = ?
       ORDER BY due_date ASC, due_time ASC, id DESC`,
      [req.user.id]
    );

    return res.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({
      message: "Unable to retrieve tasks."
    });
  }
});

// Create a task
app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const validationError = validateTask(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const {
      title,
      description = "",
      due_date,
      due_time = null,
      priority = "Medium",
      status = "Pending"
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO tasks
       (user_id, title, description, due_date, due_time, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title.trim(),
        description,
        due_date,
        due_time || null,
        priority,
        status
      ]
    );

    const [tasks] = await db.execute(
      `SELECT id, title, description, due_date, due_time,
              priority, status, created_at, updated_at
       FROM tasks WHERE id = ? AND user_id = ?`,
      [result.insertId, req.user.id]
    );

    return res.status(201).json({
      message: "Task saved successfully!",
      task: tasks[0]
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({
      message: "Unable to save task."
    });
  }
});

// Update a task
app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isSafeInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        message: "Invalid task ID."
      });
    }

    const validationError = validateTask(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const {
      title,
      description = "",
      due_date,
      due_time = null,
      priority = "Medium",
      status = "Pending"
    } = req.body;

    const [result] = await db.execute(
      `UPDATE tasks
       SET title = ?, description = ?, due_date = ?, due_time = ?,
           priority = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        title.trim(),
        description,
        due_date,
        due_time || null,
        priority,
        status,
        taskId,
        req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task not found."
      });
    }

    const [tasks] = await db.execute(
      `SELECT id, title, description, due_date, due_time,
              priority, status, created_at, updated_at
       FROM tasks WHERE id = ? AND user_id = ?`,
      [taskId, req.user.id]
    );

    return res.json({
      message: "Task updated successfully!",
      task: tasks[0]
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({
      message: "Unable to update task."
    });
  }
});

// Delete a task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isSafeInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        message: "Invalid task ID."
      });
    }

    const [result] = await db.execute(
      "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task not found."
      });
    }

    return res.json({
      message: "Task deleted successfully!"
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({
      message: "Unable to delete task."
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
