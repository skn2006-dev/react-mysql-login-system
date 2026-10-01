
import { useState } from "react";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
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
        setMessage(data.message || "Login successful!");
        console.log("Logged in user:", data.user);
        setPassword("");
      } else {
        setMessage("Registration successful!");
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

  function handleForgotPassword(e) {
    e.preventDefault();
    setMessage(
      "Password reset is not configured yet. Please contact support."
    );
  }

  return (
    <main className="app-container">
      <div className="auth-card">
        {/* Left image section */}
        <div className="image-section">
          <img
            src="/react.jpg"
            alt="Abstract background"
            className="login-image"
          />
        </div>

        {/* Right login and registration section */}
        <div className="form-section">
          <div className="form-content">
            {/* Both headings are centered here */}
            <div className="form-heading">
              <h1>Welcome</h1>
              <h2>
                {isLogin
                  ? "Sign into your account"
                  : "Create your account"}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
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

              {message && (
                <p
                  className={
                    message.toLowerCase().includes("successful")
                      ? "message success-message"
                      : "message error-message"
                  }
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              )}

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

            <p className="form-footer">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}

              <button
                type="button"
                className="switch-link"
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