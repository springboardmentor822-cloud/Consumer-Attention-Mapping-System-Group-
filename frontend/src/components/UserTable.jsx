import { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserShield,
} from "react-icons/fa";

import API from "../services/api";
import "../styles/StoreTable.css";
import AddUserModal from "./AddUserModal";

function UserTable() {
  // ==========================================
  // STATES
  // ==========================================

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const role = localStorage.getItem("role") || "Admin";

  // ==========================================
  // LOAD USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/users");

      const formattedUsers = response.data.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.is_active ? "Active" : "Inactive",
        created_at: user.created_at,
      }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  useEffect(() => {
    const filtered = users.filter((user) => {
      return (
        user.username
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        user.email
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        user.role
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });

    setFilteredUsers(filtered);
  }, [search, users]);

  // ==========================================
  // CREATE USER
  // ==========================================

  const createUser = async (newUser) => {
    await API.post("/users", {
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
    });
  };

  // ==========================================
  // UPDATE USER
  // ==========================================

  const updateUser = async (id, userData) => {
    await API.put(`/users/${id}`, {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      is_active: userData.status === "Active",
    });
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const deleteUser = async (id) => {
    await API.delete(`/users/${id}`);
  };
    // ==========================================
  // SAVE USER
  // ==========================================

  const saveUser = async (formData) => {
    try {
      setLoading(true);

      if (selectedUser) {
        await updateUser(selectedUser.id, formData);

        alert("User updated successfully.");
      } else {
        await createUser(formData);

        alert("User created successfully.");
      }

      await fetchUsers();

      setShowModal(false);
      setSelectedUser(null);

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
        "Unable to save user."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {

      setLoading(true);

      await deleteUser(id);

      alert("User deleted successfully.");

      await fetchUsers();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.detail ||
        "Unable to delete user."
      );

    } finally {

      setLoading(false);

    }

  };

  // ==========================================
  // OPEN ADD USER MODAL
  // ==========================================

  const handleAddUser = () => {

    setSelectedUser(null);

    setShowModal(true);

  };

  // ==========================================
  // OPEN EDIT USER MODAL
  // ==========================================

  const handleEditUser = (user) => {

    setSelectedUser(user);

    setShowModal(true);

  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {

    setSelectedUser(null);

    setShowModal(false);

  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {

    return (

      <div className="store-container">

        <div
          style={{
            padding: "50px",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          Loading Users...
        </div>

      </div>

    );

  }

  // ==========================================
  // ERROR SCREEN
  // ==========================================

  if (error) {

    return (

      <div className="store-container">

        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "red",
            fontWeight: "600",
          }}
        >
          {error}
        </div>

      </div>

    );

  }
    // ==========================================
  // UI
  // ==========================================

  return (
    <div className="store-container">

      {/* Header */}

      <div className="store-header">

        <h2>
          <FaUserShield />
          {" "}User Management
        </h2>

        {role === "Admin" && (
          <button
            className="add-store-btn"
            onClick={handleAddUser}
          >
            <FaPlus />
            {" "}Add User
          </button>
        )}

      </div>

      {/* Search */}

      <div className="search-box">

        <FaSearch />

        <input
          type="text"
          placeholder="Search Users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* User Table */}

      <table className="store-table">

        <thead>

          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>

            {role === "Admin" && (
              <th>Actions</th>
            )}

          </tr>

        </thead>

        <tbody>

          {filteredUsers.length === 0 ? (

            <tr>

              <td
                colSpan={role === "Admin" ? 5 : 4}
                style={{
                  textAlign: "center",
                  padding: "30px",
                  fontWeight: "600",
                }}
              >
                No users found.
              </td>

            </tr>

          ) : (

            filteredUsers.map((user) => (

              <tr key={user.id}>

                <td>{user.username}</td>

                <td>{user.email}</td>

                <td>

                  <span className="status active">
                    {user.role}
                  </span>

                </td>

                <td>

                  <span
                    className={
                      user.status === "Active"
                        ? "status active"
                        : "status inactive"
                    }
                  >
                    {user.status}
                  </span>

                </td>

                {role === "Admin" && (

                  <td>

                    <button
                      className="edit-btn"
                      onClick={() => handleEditUser(user)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user.id)}
                    >
                      <FaTrash />
                    </button>

                  </td>

                )}

              </tr>

            ))

          )}

        </tbody>

      </table>

      {/* Modal */}

      <AddUserModal
        isOpen={showModal}
        editUser={selectedUser}
        onClose={closeModal}
        onSave={saveUser}
      />

    </div>
  );
}

export default UserTable;