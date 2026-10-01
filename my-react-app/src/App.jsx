
import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loggedInName, setLoggedInName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setMessage("Please enter your name.");
        return;
      }

      if (password.length < 6) {
        setMessage("Password must contain at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
    }

    if (!API_URL) {
      setMessage(
        "Server URL is not configured. Please check VITE_API_URL."
      );
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin
        ? "/api/login"
        : "/api/register";

      const requestBody = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      if (isLogin) {
        // Use the actual name returned by the backend/database.
        const databaseName = data.user?.name || data.name;

        if (!databaseName) {
          setMessage(
            "Login succeeded, but the backend did not return your name."
          );
          return;
        }

        setLoggedInName(databaseName);
        setIsLoggedIn(true);
        setMessage("");
      } else {
        setMessage(data.message || "Registration Successful!");
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(
        "Cannot connect to the server. Please check your backend."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin((previous) => !previous);
    setMessage("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsLogin(true);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setLoggedInName("");
  };

  const handleForgotPassword = () => {
    setMessage("Password reset is not available yet.");
  };

  return (
    <main className="page-container">
      <section className="auth-card">
        <div className="image-panel">
          <img
            src="/react.jpg"
            alt="Abstract blue and teal artwork"
            className="side-image"
          />
        </div>

        <div className="form-panel">
          {isLoggedIn ? (
            <div className="success-screen">
              <div className="success-icon">✓</div>

              <h1>Welcome, {loggedInName}!</h1>

              <p className="form-subtitle">
                You have logged in successfully.
              </p>

              <button
                type="button"
                className="auth-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="form-content">
              <h1>
                {isLogin
                  ? "Welcome back!"
                  : "Create your account"}
              </h1>

              <p className="form-subtitle">
                {isLogin
                  ? "Sign in to continue to your account"
                  : "Get started by creating your account"}
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && (
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                )}

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                />

                {!isLogin && (
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    autoComplete="new-password"
                  />
                )}

                {isLogin && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                )}

                {message && (
                  <div
                    className={`form-message ${
                      message.toLowerCase().includes("successful")
                        ? "success-text"
                        : "error-text"
                    }`}
                    role="status"
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-button"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Please wait..."
                    : isLogin
                    ? "Login"
                    : "Register"}
                </button>
              </form>

              <p className="switch-text">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="switch-link"
                  onClick={switchMode}
                >
                  {isLogin
                    ? "Register here"
                    : "Login here"}
                </button>
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
