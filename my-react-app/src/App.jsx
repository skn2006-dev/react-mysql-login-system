
import { useState } from "react";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInName, setLoggedInName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function switchForm() {
    setIsLogin((previous) => !previous);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!isLogin && !name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    if (!isLogin && password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin
        ? "/api/login"
        : "/api/register";

      const userData = isLogin
        ? {
            email: email.trim(),
            password,
          }
        : {
            name: name.trim(),
            email: email.trim(),
            password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      if (isLogin) {
        const displayName =
          data.user?.name ||
          data.user?.fullName ||
          email.trim().split("@")[0];

        setLoggedInName(displayName);
        setIsLoggedIn(true);
        setPassword("");
        setMessage("");
      } else {
        setMessage(
          data.message || "Registration successful!"
        );
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("API error:", error);
      setMessage(
        "Cannot connect to the server. Please check your backend."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setIsLogin(true);
    setLoggedInName("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    setMessage(
      "Password reset is not configured yet. Please contact support."
    );
  }

  return (
    <main className="app-container">
      <div className="auth-card">

        {/* Left side: image only */}
        <div className="image-section">
          <img
            src="/react.jpg"
            alt="Abstract teal and blue background"
            className="login-image"
          />
        </div>

        {/* Right side */}
        <div className="form-section">
          {isLoggedIn ? (
            <div className="success-content">

              {/* Success icon */}
              <div className="success-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5L10 17L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1>Welcome, {loggedInName}!</h1>

              <p className="success-subtitle">
                You have logged in successfully.
              </p>

              {/* Login success card */}
              <div className="success-message-card">
                <div className="shield-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 12L11 14.5L16 9.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2>Login Successful</h2>
                  <p>
                    Your account is ready. You can now continue
                    using the application.
                  </p>
                </div>
              </div>

              {/* Logout button */}
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10 17L15 12L10 7M15 12H3M12 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div className="form-content">

              {/* Updated login and registration headings */}
              <div className="form-heading">
                <h1>
                  {isLogin
                    ? "Welcome back!"
                    : "Create your account"}
                </h1>

                <h2>
                  {isLogin
                    ? "Sign in to continue to your account"
                    : "Get started by creating your account"}
                </h2>
              </div>

              {/* Login and registration form */}
              <form onSubmit={handleSubmit}>

                {/* Full name for registration */}
                {!isLogin && (
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                {/* Email */}
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Password"
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

                {/* Confirm password for registration */}
                {!isLogin && (
                  <div className="input-group">
                    <input
                      type="password"
                      placeholder="Confirm password"
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
                  <div className="forgot-password">
                    <a
                      href="#forgot"
                      onClick={handleForgotPassword}
                    >
                      Forgot Password?
                    </a>
                  </div>
                )}

                {/* Status message */}
                {message && (
                  <p
                    className={`message ${
                      message
                        .toLowerCase()
                        .includes("successful")
                        ? "success-message"
                        : "error-message"
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {message}
                  </p>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Please wait..."
                    : isLogin
                    ? "Login"
                    : "Register"}
                </button>
              </form>

              {/* Switch between login and registration */}
              <p className="form-footer">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}

                <button
                  type="button"
                  className="switch-link"
                  onClick={switchForm}
                >
                  {isLogin
                    ? "Register here"
                    : "Login here"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
