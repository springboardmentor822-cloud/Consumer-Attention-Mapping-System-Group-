import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserShield,
} from "react-icons/fa";

import { registerUser } from "../services/authService";

function RegisterForm() {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Store Manager",
  });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {

      setLoading(true);

      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setSuccess("Registration Successful!");

      setTimeout(() => {

        navigate("/login");

      }, 1500);

    } catch (err) {

      if (err.response) {

        setError(err.response.data.detail);

      } else {

        setError("Unable to connect to server.");

      }

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="login-box">

      <h2>Create Account</h2>

      <p>Register to continue</p>

      {error && (

        <div
          style={{
            background: "#ff4d4f",
            color: "#fff",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>

      )}

      {success && (

        <div
          style={{
            background: "#16a34a",
            color: "#fff",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "8px",
          }}
        >
          {success}
        </div>

      )}

      <form onSubmit={handleSubmit}>

        <div className="input-group">
          <FaUser />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <FaEnvelope />
          <input
            type="email"
            name="email"
            placeholder="Email"
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
          <FaLock />
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <span
            className="password-toggle"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="input-group">

          <FaUserShield />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option>Admin</option>
            <option>Store Manager</option>
            <option>Marketing Manager</option>
            <option>Retail Analyst</option>
          </select>

        </div>

        <button
          className="login-btn"
          disabled={loading}
        >
          {loading ? "Registering..." : "Create Account"}
        </button>

      </form>

      <div className="footer-text">

        Already have an account?

        <Link to="/login"> Login</Link>

      </div>

    </div>

  );

}

export default RegisterForm;