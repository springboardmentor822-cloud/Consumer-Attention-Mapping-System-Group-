import { useState, useEffect } from "react";
import "../styles/AddStoreModal.css";

function AddUserModal({
  isOpen,
  onClose,
  onSave,
  editUser,
}) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "Store Manager",
    status: "Active",
  });

  // ==========================================
  // LOAD EDIT DATA
  // ==========================================

  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username || "",
        email: editUser.email || "",
        password: "",
        role: editUser.role || "Store Manager",
        status: editUser.status || "Active",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "Store Manager",
        status: "Active",
      });
    }
  }, [editUser, isOpen]);

  if (!isOpen) return null;

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      alert("Username is required.");
      return;
    }

    if (!formData.email.trim()) {
      alert("Email is required.");
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Password required only while creating

    if (
      !editUser &&
      formData.password.trim().length < 6
    ) {
      alert(
        "Password must contain at least 6 characters."
      );
      return;
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay">

      <div className="modal-content">

        <h2>

          {editUser
            ? "Edit User"
            : "Add User"}

        </h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          {!editUser && (

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />

          )}

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >

            <option value="Admin">
              Admin
            </option>

            <option value="Store Manager">
              Store Manager
            </option>

            <option value="Marketing Manager">
              Marketing Manager
            </option>

            <option value="Retail Analyst">
              Retail Analyst
            </option>

          </select>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

          </select>

          <div className="modal-buttons">

            <button
              type="submit"
              className="save-btn"
            >
              {editUser
                ? "Update User"
                : "Save User"}
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddUserModal;