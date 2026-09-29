
import { useState } from "react";
import "./App.css";

function App() {
  // Form state
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle login and registration
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    // Validate registration fields
    if (!isLogin && !name.trim()) {
      setMessage("Please enter your name.");
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
      // Select the backend API
      const endpoint = isLogin
        ? "http://localhost:5000/api/login"
        : "http://localhost:5000/api/register";

      // Prepare the data
      const userData = isLogin
        ? {
            email: email.trim(),
            password: password,
          }
        : {
            name: name.trim(),
            email: email.trim(),
            password: password,
          };

      // Send data to the backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Read the backend response
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      // Display success message
      setMessage(data.message);

      if (isLogin) {
        // Login successful
        console.log("Logged in user:", data.user);

        // Clear password fields
        setPassword("");
      } else {
        // Registration successful
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage(
        "Cannot connect to the server. Please check your backend."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Switch between Login and Register
  function switchForm() {
    setIsLogin((previous) => !previous);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  }

  // Forgot password message
  function handleForgotPassword(e) {
    e.preventDefault();
    setMessage(
      "Password reset is not configured yet. Please contact support."
    );
  }

  return (
    <main className="login-page">
      <div className="login-card">

        {/* Left side image */}
        <div className="login-image">
          <img
            src="/react.jpg"
            alt="React abstract background"
          />
        </div>

        {/* Right side form */}
        <div className="login-content">
          <div className="login-form-container">

            {/* Heading */}
            <h1 className="logo">Welcome</h1>

            <h2>
              {isLogin
                ? "Sign into your account"
                : "Create your account"}
            </h2>

            {/* Login and Register form */}
            <form onSubmit={handleSubmit}>

              {/* Name field - Register only */}
              {!isLogin && (
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              {/* Email field */}
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email-address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password field */}
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    isLogin ? "current-password" : "new-password"
                  }
                  required
                />
              </div>

              {/* Confirm password - Register only */}
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

              {/* Forgot password - Login only */}
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

              {/* Success or error message */}
              {message && (
                <p
                  className="message"
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading
                  ? "Please wait..."
                  : isLogin
                    ? "Login"
                    : "Register"}
              </button>
            </form>

            {/* Switch between forms */}
            <p className="register-text">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}

              <button
                type="button"
                className="register-link"
                onClick={switchForm}
              >
                {isLogin ? "Register here" : "Login here"}
              </button>
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}

export default App;