import {
  FaSearch,
  FaBell,
  FaRobot,
  FaMoon,
} from "react-icons/fa";

import "../styles/Navbar.css";

function Navbar() {

  const today = new Date();

  const date = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (

    <header className="navbar">

      {/* ===========================
          LEFT
      ============================ */}

      <div className="navbar-left">

        <div className="search-bar">

          <FaSearch />

          <input
            type="text"
            placeholder="Search stores, shelves, products..."
          />

        </div>

      </div>

      {/* ===========================
          RIGHT
      ============================ */}

      <div className="navbar-right">

        {/* AI Status */}

        <div className="status-box">

          <FaRobot />

          <span>AI Online</span>

        </div>

        {/* Date */}

        <div className="date-box">

          {date}

        </div>

        {/* Theme */}

        <button
          className="theme-btn"
          title="Theme"
        >

          <FaMoon />

        </button>

        {/* Notifications */}

        <button
          className="notification"
          title="Notifications"
        >

          <FaBell />

          <span className="badge">

            5

          </span>

        </button>

      </div>

    </header>

  );

}

export default Navbar;