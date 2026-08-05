import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserShield,
} from "react-icons/fa";

import { loginUser } from "../services/authService";

function LoginForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin",
    remember: false,
  });

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberEmail");

    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        remember: true,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizeRole = (role) => {
    return (role || "")
      .toLowerCase()
      .replace(/\s+/g, "_");
  };

  const redirectDashboard = () => {
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      const backendRole = normalizeRole(response.user.role);
      const selectedRole = normalizeRole(formData.role);

      if (backendRole !== selectedRole) {
        setError("Selected role does not match your account.");
        setLoading(false);
        return;
      }

      // Save Login Details
      localStorage.setItem("token", response.access_token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("role", backendRole);

      if (formData.remember) {
        localStorage.setItem("rememberEmail", formData.email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      redirectDashboard();
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data.detail ||
            err.response.data.error ||
            "Login Failed."
        );
      } else {
        setError("Unable to connect to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box">
      <h2>Welcome Back</h2>

      <p>Sign in to continue</p>

      {error && (
        <div
          style={{
            background: "#ef4444",
            color: "#fff",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <FaEnvelope />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <FaLock />

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <span
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="input-group">
          <FaUserShield />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="admin">Admin</option>

            <option value="store_manager">
              Store Manager
            </option>

            <option value="marketing_manager">
              Marketing Manager
            </option>

            <option value="retail_analyst">
              Retail Analyst
            </option>
          </select>
        </div>

        <div className="options">
          <label>
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
            />

            Remember Me
          </label>

          <Link to="/forgot-password">
            Forgot Password?
          </Link>
        </div>

        <button
          className="login-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="footer-text">
        Don't have an account?

        <Link to="/register">
          Register
        </Link>
      </div>
    </div>
  );
}

export default LoginForm;