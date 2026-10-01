
import { useState } from "react";
import "./App.css";
import Dashboard from "./Dashboard";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  // Restore login state after refreshing the browser
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  // Restore the username after refreshing
  const [loggedInName, setLoggedInName] = useState(
    () => localStorage.getItem("userName") || ""
  );

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Switch between login and signup
  const switchMode = () => {
    setIsLogin((previous) => !previous);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  };

  // Login and registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (!isLogin && !name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!isLogin && password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    const endpoint = isLogin
      ? "/api/login"
      : "/api/register";

    const requestBody = isLogin
      ? {
          email: email.trim(),
          password,
        }
      : {
          name: name.trim(),
          email: email.trim(),
          password,
        };

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      if (isLogin) {
        // Require a JWT from the backend
        if (!data.token) {
          setMessage(
            "Login succeeded, but no authentication token was returned."
          );
          return;
        }

        // Save authentication token
        localStorage.setItem("token", data.token);

        // Get the user's name from the login response
        const databaseName =
          data.user?.name ||
          data.name ||
          email.trim().split("@")[0];

        // Save username for refresh persistence
        localStorage.setItem("userName", databaseName);

        setLoggedInName(databaseName);
        setIsLoggedIn(true);
        setMessage("");
      } else {
        // Registration successful
        setMessage(
          data.message ||
            "Registration successful. Please check your email if verification is required."
        );

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email address first.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to process the request."
        );
      }

      setMessage(
        data.message ||
          "If your account exists, password reset instructions will be sent."
      );
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to process your request."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Logout and clear saved login details
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");

    setIsLoggedIn(false);
    setLoggedInName("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setIsLogin(true);
  };

  // Show dashboard when logged in
  if (isLoggedIn) {
    return (
      <Dashboard
        userName={loggedInName || "User"}
        onLogout={handleLogout}
      />
    );
  }

  // Login and signup page
  return (
    <main className="auth-page">
      <section className="auth-container">
        {/* Left-side image */}
        <div className="auth-image-section">
          <img
            src="/react.jpg"
            alt="Welcome to the task management application"
            className="auth-image"
          />
        </div>

        {/* Right-side authentication form */}
        <div className="auth-form-section">
          <div className="auth-form-content">
            <h1 className="auth-welcome">
              {isLogin
                ? "Welcome Back!"
                : "Create Account"}
            </h1>

            <p className="auth-subtitle">
              {isLogin
                ? "Sign into your account"
                : "Sign up to get started"}
            </p>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              {/* Name field for signup */}
              {!isLogin && (
                <div className="auth-input-group">
                  <label htmlFor="name">
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              {/* Email field */}
              <div className="auth-input-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password field */}
              <div className="auth-input-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  required
                />
              </div>

              {/* Confirm password for signup */}
              {!isLogin && (
                <div className="auth-input-group">
                  <label htmlFor="confirmPassword">
                    Confirm Password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    autoComplete="new-password"
                    required
                  />
                </div>
              )}

              {/* Forgot password */}
              {isLogin && (
                <div className="auth-forgot-password">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Feedback message */}
              {message && (
                <p
                  className="auth-message"
                  role="status"
                >
                  {message}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="auth-submit-button"
                disabled={isLoading}
              >
                {isLoading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign In"
                    : "Sign Up"}
              </button>
            </form>

            {/* Switch between login and signup */}
            <p className="auth-switch-text">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}

              <button
                type="button"
                className="auth-switch-button"
                onClick={switchMode}
              >
                {isLogin
                  ? "Sign Up"
                  : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
