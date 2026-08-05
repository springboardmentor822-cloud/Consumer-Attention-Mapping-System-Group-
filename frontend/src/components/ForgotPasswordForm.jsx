import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";

function ForgotPasswordForm() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    if (
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

    setMessage("Password reset successfully.");

    setTimeout(() => {

      navigate("/login");

    }, 1500);

  };

  return (

    <div className="login-box">

      <h2>Reset Password</h2>

      <p>Create a new password</p>

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

      {message && (
        <div
          style={{
            background: "#16a34a",
            color: "#fff",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "15px",
          }}
        >
          {message}
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
            type="password"
            name="password"
            placeholder="New Password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <button className="login-btn">

          Reset Password

        </button>

      </form>

      <div className="footer-text">

        <Link to="/login">

          Back to Login

        </Link>

      </div>

    </div>

  );

}

export default ForgotPasswordForm;