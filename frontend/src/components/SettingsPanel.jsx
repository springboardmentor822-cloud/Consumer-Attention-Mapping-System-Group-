import { useEffect, useState } from "react";
import {
  FaCog,
  FaMoon,
  FaGlobe,
  FaUserCircle,
  FaSave,
} from "react-icons/fa";

import "../styles/SettingsPanel.css";

import { useLanguage } from "../context/LanguageContext";
import { translations } from "../data/language";

function SettingsPanel() {

  const { language, changeLanguage } = useLanguage();

  const t = translations[language];

  // ==========================================
  // Logged-in User
  // ==========================================

  const storedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const username =
    storedUser.username ||
    storedUser.name ||
    "Guest User";

  const role =
    storedUser.role || "guest";

  const ROLE_LABELS = {

    admin:
      language === "Hindi"
        ? "प्रशासक"
        : "Administrator",

    store_manager:
      language === "Hindi"
        ? "स्टोर प्रबंधक"
        : "Store Manager",

    marketing_manager:
      language === "Hindi"
        ? "मार्केटिंग प्रबंधक"
        : "Marketing Manager",

    retail_analyst:
      language === "Hindi"
        ? "रिटेल विश्लेषक"
        : "Retail Analyst",

    guest:
      language === "Hindi"
        ? "अतिथि"
        : "Guest",

  };

  // ==========================================
  // States
  // ==========================================

  const [darkMode, setDarkMode] = useState(

    JSON.parse(
      localStorage.getItem("darkMode") ?? "true"
    )

  );

  const [saved, setSaved] = useState(false);

  // ==========================================
  // Dark Mode
  // ==========================================

  useEffect(() => {

    document.body.classList.toggle(
      "light-theme",
      !darkMode
    );

  }, [darkMode]);

  // ==========================================
  // Save Settings
  // ==========================================

  const handleSave = () => {

    localStorage.setItem(
      "darkMode",
      JSON.stringify(darkMode)
    );

    localStorage.setItem(
      "language",
      language
    );

    setSaved(true);

    setTimeout(() => {

      setSaved(false);

    }, 2500);

  };

  return (

    <div className="settings-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="settings-header">

        <h1>

          <FaCog />

          {t.settings}

        </h1>

        <p>

          {t.settingsDescription}

        </p>

      </div>

      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}

      {saved && (

        <div className="settings-success">

          ✓ {t.settingsSaved}

        </div>

      )}

      <div className="settings-grid">

        {/* =====================================
            ACCOUNT
        ===================================== */}

        <div className="settings-card">

          <h2>

            <FaUserCircle />

            {t.account}

          </h2>

          <div className="profile-box">

            <p>

              <strong>

                {t.username}

              </strong>

              <span>

                {username}

              </span>

            </p>

            <p>

              <strong>

                {t.role}

              </strong>

              <span>

                {ROLE_LABELS[role] || role}

              </span>

            </p>

          </div>

        </div>

        {/* =====================================
            APPEARANCE
        ===================================== */}

        <div className="settings-card">

          <h2>

            <FaMoon />

            {t.appearance}

          </h2>

          <div className="setting-row">

            <span>

              {t.darkmode}

            </span>

            <input
              type="checkbox"
              checked={darkMode}
              onChange={() =>
                setDarkMode(!darkMode)
              }
            />

          </div>

        </div>

        {/* =====================================
            LANGUAGE
        ===================================== */}

        <div className="settings-card">

          <h2>

            <FaGlobe />

            {t.language}

          </h2>

          <div className="setting-row">

            <span>

              {t.language}

            </span>

            <select

              value={language}

              onChange={(e) =>
                changeLanguage(
                  e.target.value
                )
              }

            >

              <option value="English">

                {t.english}

              </option>

              <option value="Hindi">

                {t.hindi}

              </option>

            </select>

          </div>

        </div>
                {/* =====================================
            SYSTEM INFORMATION
        ===================================== */}

        <div className="settings-card">

          <h2>

            <FaCog />

            {t.systemInformation}

          </h2>

          <div className="profile-box">

            <p>

              <strong>

                {t.project}

              </strong>

              <span>

                AI Consumer Attention Mapping

              </span>

            </p>

            <p>

              <strong>

                {t.version}

              </strong>

              <span>

                v1.0.0

              </span>

            </p>

            <p>

              <strong>

                {t.status}

              </strong>

              <span
                style={{
                  color: "#22C55E",
                  fontWeight: "600",
                }}
              >

                ● {t.online}

              </span>

            </p>

          </div>

        </div>

      </div>

      {/* =====================================
          ACTIONS
      ===================================== */}

      <div className="settings-actions">

        <button
          className="save-settings-btn"
          onClick={handleSave}
        >

          <FaSave />

          {t.save}

        </button>

      </div>

    </div>

  );

}

export default SettingsPanel;