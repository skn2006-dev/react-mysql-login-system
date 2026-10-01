
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: true }
    : undefined
});

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. Please log in."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token."
    });
  }
}

// Generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Login API is running"
  });
});

// Test database connection
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "OK",
      database: "Connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "Error",
      database: "Unavailable"
    });
  }
});

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields."
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid input."
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        message: "Name must be between 1 and 100 characters."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        message: "Password is too long."
      });
    }

    if (
      confirmPassword !== undefined &&
      password !== confirmPassword
    ) {
      return res.status(400).json({
        message: "Passwords do not match."
      });
    }

    // Check if email already exists
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password)
       VALUES (?, ?, ?)`,
      [cleanName, cleanEmail, hashedPassword]
    );

    res.status(201).json({
      message: "Registration successful!",
      user: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail
      }
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    res.status(500).json({
      message: "Registration failed. Please try again."
    });
  }
});

// LOGIN
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

    const cleanEmail = email.trim().toLowerCase();

    // Find user
    const [users] = await db.execute(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const user = users[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Generate JWT
    const token = generateToken(user);

    res.json({
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

    res.status(500).json({
      message: "Login failed. Please try again."
    });
  }
});

// PROTECTED DASHBOARD
app.get(
  "/api/dashboard",
  authenticateToken,
  async (req, res) => {
    try {
      const [users] = await db.execute(
        "SELECT id, name, email FROM users WHERE id = ?",
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      res.json({
        message: "Welcome to your dashboard!",
        user: users[0]
      });
    } catch (error) {
      console.error("Dashboard error:", error);

      res.status(500).json({
        message: "Unable to load dashboard."
      });
    }
  }
);

// GET USER PROFILE
app.get(
  "/api/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const [users] = await db.execute(
        "SELECT id, name, email FROM users WHERE id = ?",
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      res.json({
        user: users[0]
      });
    } catch (error) {
      console.error("Profile error:", error);

      res.status(500).json({
        message: "Unable to load profile."
      });
    }
  }
);

// LOGOUT
// JWT logout is handled client-side by removing the token.
// This endpoint confirms the logout request.
app.post("/api/logout", authenticateToken, (req, res) => {
  res.json({
    message: "Logout successful. Remove your token on the client."
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found."
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET ||
        process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters.");
    }

    await db.query("SELECT 1");
    console.log("MySQL connected successfully.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
