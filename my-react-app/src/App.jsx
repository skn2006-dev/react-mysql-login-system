import { useState } from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
} from "@react-oauth/google";

import "./App.css";
import Dashboard from "./Dashboard";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  // =========================
  // Login state
  // =========================

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  const [loggedInName, setLoggedInName] = useState(
    () => localStorage.getItem("userName") || ""
  );

  // =========================
  // Form state
  // =========================

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // =========================
  // Switch Login / Signup
  // =========================

  const switchMode = () => {
    setIsLogin((previous) => !previous);

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  };

  // =========================
  // Normal Login / Registration
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!email.trim() || !password) {
      setMessage(
        "Please enter your email and password."
      );
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
      setMessage(
        "Password must be at least 8 characters long."
      );
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

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      // =========================
      // Login
      // =========================

      if (isLogin) {
        if (!data.token) {
          setMessage(
            "Login succeeded, but no authentication token was returned."
          );
          return;
        }

        localStorage.setItem(
          "token",
          data.token
        );

        const databaseName =
          data.user?.name ||
          data.name ||
          email.trim().split("@")[0];

        localStorage.setItem(
          "userName",
          databaseName
        );

        setLoggedInName(databaseName);
        setIsLoggedIn(true);
        setMessage("");
      }

      // =========================
      // Registration
      // =========================

      else {
        setMessage(
          data.message ||
            "Registration successful!"
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

  // =========================
  // Google Login
  // =========================

  const handleGoogleSuccess = async (
    credentialResponse
  ) => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!credentialResponse?.credential) {
        throw new Error(
          "Google sign-in did not return a credential."
        );
      }

      const response = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential:
              credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Google sign-in failed."
        );
      }

      if (!data.token) {
        throw new Error(
          "Google login succeeded, but no authentication token was returned."
        );
      }

      // Save JWT
      localStorage.setItem(
        "token",
        data.token
      );

      // Get user name from backend
      const googleUserName =
        data.user?.name ||
        data.name ||
        "User";

      localStorage.setItem(
        "userName",
        googleUserName
      );

      setLoggedInName(googleUserName);
      setIsLoggedIn(true);
      setMessage("");
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setMessage(
        error.message ||
          "Google sign-in failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage(
      "Google sign-in failed."
    );
  };

  // =========================
  // Forgot Password
  // =========================

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMessage(
        "Please enter your email address first."
      );
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

  // =========================
  // Logout
  // =========================

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

  // =========================
  // Dashboard
  // =========================

  if (isLoggedIn) {
    return (
      <Dashboard
        userName={loggedInName || "User"}
        onLogout={handleLogout}
      />
    );
  }

  // =========================
  // Login / Signup Page
  // =========================

  return (
    <main className="auth-page">
      <section className="auth-container">

        {/* =========================
            LEFT IMAGE
        ========================= */}

        <div className="auth-image-section">
          <img
            src="/react.jpg"
            alt="Welcome"
            className="auth-image"
          />
        </div>

        {/* =========================
            RIGHT FORM
        ========================= */}

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

            {/* =========================
                FORM
            ========================= */}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >

              {/* Name */}
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

              {/* Email */}
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

              {/* Password */}
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

              {/* Confirm Password */}
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
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                    required
                  />
                </div>
              )}

              {/* Forgot Password */}
              {isLogin && (
                <div className="auth-forgot-password">
                  <button
                    type="button"
                    onClick={
                      handleForgotPassword
                    }
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Message */}
              {message && (
                <p
                  className="auth-message"
                  role="status"
                >
                  {message}
                </p>
              )}

              {/* =========================
                  SIGN IN / SIGN UP BUTTON
              ========================= */}

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

            {/* =========================
                GOOGLE LOGIN
            ========================= */}

            {isLogin && (
              <>
                <div className="google-divider">
                  <span>OR</span>
                </div>

                <div className="google-login-container">

                  {GOOGLE_CLIENT_ID ? (
                    <>
                      {/* Visible custom button */}
                      <button
                        type="button"
                        className="custom-google-button"
                        disabled={isLoading}
                      >
                        <span className="google-logo">
                          G
                        </span>

                        <span>
                          Sign in with Google
                        </span>
                      </button>

                      {/* Real Google authentication */}
                      <div className="google-login-overlay">
                        <GoogleLogin
                          onSuccess={
                            handleGoogleSuccess
                          }
                          onError={
                            handleGoogleError
                          }
                          useOneTap={false}
                          theme="outline"
                          size="large"
                          text="signin_with"
                          shape="rectangular"
                          width="100%"
                        />
                      </div>
                    </>
                  ) : (
                    <p className="auth-message">
                      Google login is not configured.
                    </p>
                  )}

                </div>
              </>
            )}

            {/* =========================
                SWITCH LOGIN / SIGNUP
            ========================= */}

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

// =========================
// GOOGLE OAUTH PROVIDER
// =========================

function AppWithGoogleProvider() {
  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID || ""}
    >
      <App />
    </GoogleOAuthProvider>
  );
}

export default AppWithGoogleProvider;