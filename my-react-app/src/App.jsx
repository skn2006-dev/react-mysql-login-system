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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    // Registration validation
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
      const endpoint = isLogin
        ? "http://localhost:5000/api/login"
        : "http://localhost:5000/api/register";

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

      // LOGIN SUCCESS
      if (isLogin) {
        setMessage("Login successful!");
        setPassword("");
      }

      // REGISTRATION SUCCESS
      else {
        setMessage("Registration successful!");

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

  function switchForm() {
    setIsLogin((previous) => !previous);

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
    <main className="login-page">
      <div className="login-card">

        {/* LEFT IMAGE */}
        <div className="login-image">
          <img
            src="/react.jpg"
            alt="React background"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="login-content">
          <div className="login-form-container">

            {/* WELCOME */}
            <h1 className="logo">
              Welcome
            </h1>

            {/* TITLE */}
            <h2>
              {isLogin
                ? "Sign into your account"
                : "Create your account"}
            </h2>

            <form onSubmit={handleSubmit}>

              {/* NAME - REGISTER */}
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

              {/* EMAIL */}
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email-address"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              {/* PASSWORD */}
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

              {/* CONFIRM PASSWORD - REGISTER */}
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

              {/* FORGOT PASSWORD */}
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

              {/* MESSAGE */}
              {message && (
                <p
                  className="message"
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              )}

              {/* BUTTON */}
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

            {/* SWITCH LOGIN / REGISTER */}
            <p className="register-text">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}

              <button
                type="button"
                className="register-link"
                onClick={switchForm}
              >
                {isLogin
                  ? "Register here"
                  : "Login here"}
              </button>
            </p>

          </div>
        </div>

      </div>
    </main>
  );
}

export default App;