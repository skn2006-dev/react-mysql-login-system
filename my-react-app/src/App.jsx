import { useState } from "react";
import {
  GoogleOAuthProvider,
  useGoogleLogin,
} from "@react-oauth/google";

import "./App.css";
import Dashboard from "./Dashboard";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

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
  // Normal Login / Register
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
    googleResponse
  ) => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!googleResponse?.access_token) {
        throw new Error(
          "Google sign-in did not return an access token."
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
            access_token:
              googleResponse.access_token,
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

      // Save our backend JWT
      localStorage.setItem(
        "token",
        data.token
      );

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
    setMessage("Google sign-in failed.");
  };

  // Custom Google button
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    scope: "openid profile email",
  });

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

        {/* Left Image */}
        <div className="auth-image-section">
          <img
            src="/react.jpg"
            alt="Welcome"
            className="auth-image"
          />
        </div>

        {/* Right Form */}
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

              {/* Sign In / Sign Up */}
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

            {/* Google Login */}
            {isLogin && (
              <>
                <div className="google-divider">
                  <span>OR</span>
                </div>

                {GOOGLE_CLIENT_ID ? (
                  <button
                    type="button"
                    className="custom-google-button"
                    onClick={() =>
                      googleLogin()
                    }
                    disabled={isLoading}
                  >
                    <span className="google-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M21.35 12.23c0-.79-.07-1.55-.2-2.28H12v4.31h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
                        />

                        <path
                          fill="#34A853"
                          d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.04H3.26v2.53A9.74 9.74 0 0 0 12 21.5z"
                        />

                        <path
                          fill="#FBBC05"
                          d="M6.51 13.58A5.86 5.86 0 0 1 6.2 12c0-.55.1-1.09.31-1.58V7.89H3.26A9.5 9.5 0 0 0 2.25 12c0 1.53.37 2.98 1.01 4.11l3.25-2.53z"
                        />

                        <path
                          fill="#EA4335"
                          d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.74 5.39l3.25 2.53C7.29 8.1 9.45 6.38 12 6.38z"
                        />
                      </svg>
                    </span>

                    <span>
                      Sign in with Google
                    </span>
                  </button>
                ) : (
                  <p className="auth-message">
                    Google login is not configured.
                  </p>
                )}
              </>
            )}

            {/* Switch Login / Signup */}
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
// Google OAuth Provider
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