import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  FaTachometerAlt,
  FaUsers,
  FaStore,
  FaCamera,
  FaChartBar,
  FaRobot,
  FaFire,
  FaFileAlt,
  FaBell,
  FaSignOutAlt,
  FaCircle,
  FaUserCircle,
  FaExchangeAlt,
  FaCog,
  FaBoxes,
  FaShoppingCart,
  FaRoute,
  FaChartLine,
  FaProjectDiagram,
} from "react-icons/fa";

import "../styles/Sidebar.css";

import { useLanguage } from "../context/LanguageContext";
import { translations } from "../data/language";

export default function Sidebar() {

  const location = useLocation();

  const navigate = useNavigate();

  /* ==============================
     LANGUAGE
  ============================== */

  const { language } = useLanguage();

  const t = translations[language];

  /* ==============================
     USER
  ============================== */

  const storedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const role = (
    storedUser.role ||
    localStorage.getItem("role") ||
    "guest"
  )
    .toLowerCase()
    .replace(/\s+/g, "_");

  const username =
    storedUser.username ||
    storedUser.name ||
    "Guest User";

  /* ==============================
     ROLE LABELS
  ============================== */

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

  };

  const displayRole =
    ROLE_LABELS[role] || "Guest";

  /* ==============================
     LOGOUT
  ============================== */

  const logout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem("role");

    navigate("/login");

  };

  /* ==============================
     MENU ITEM
  ============================== */

  const menuItem = (
    path,
    icon,
    title
  ) => (

    <Link
      key={path}
      to={path}
      className={`menu-item ${
        location.pathname === path
          ? "active"
          : ""
      }`}
    >

      <span className="menu-icon">

        {icon}

      </span>

      <span>

        {title}

      </span>

    </Link>

  );

  // ==========================================
  // ROLE BASED MENUS
  // ==========================================

  const MENUS = {

  // ======================================
  // ADMIN
  // ======================================

  admin: [

    ["/dashboard", <FaTachometerAlt />, t.dashboard],

    ["/users", <FaUsers />, t.users],

    ["/stores", <FaStore />, t.stores],

    [
    "/store-architecture",
    <FaStore />,
    t.storeArchitecture
    ],

    ["/shelves", <FaBoxes />, t.shelves],

    ["/products", <FaShoppingCart />, t.products],

    ["/cameras", <FaCamera />, t.cameraMonitoring],

    ["/analytics", <FaChartBar />, t.analytics],

    [
      "/trajectory-analysis",
      <FaProjectDiagram />,
      t.trajectoryAnalytics,
    ],

    [
      "/zone-transition",
      <FaExchangeAlt />,
      t.zoneTransition,
    ],

    [
      "/customer-behaviour",
      <FaUsers />,
      t.customerBehaviour,
    ],

    [
      "/heatmap",
      <FaFire />,
      t.heatmap,
    ],

    [
      "/ai-dashboard",
      <FaRobot />,
      t.aiDashboard,
    ],

    [
      "/reports",
      <FaFileAlt />,
      t.reports,
    ],

    [
      "/notifications",
      <FaBell />,
      t.notifications,
    ],

    [
      "/settings",
      <FaCog />,
      t.settings,
    ],

  ],

  // ======================================
  // STORE MANAGER
  // ======================================

  store_manager: [

    [
      "/dashboard",
      <FaTachometerAlt />,
      t.dashboard,
    ],

    ["/stores", <FaStore />, t.stores],
    
    [
    "/store-architecture",
    <FaStore />,
    t.storeArchitecture
    ],
    [
      "/shelves",
      <FaBoxes />,
      t.shelves,
    ],

    [
      "/customer-journey",
      <FaRoute />,
      t.customerJourney,
    ],

    [
      "/cameras",
      <FaCamera />,
      t.liveCameras,
    ],

    [
      "/analytics",
      <FaChartBar />,
      t.analytics,
    ],

    [
      "/heatmap",
      <FaFire />,
      t.heatmap,
    ],

    [
      "/reports",
      <FaFileAlt />,
      t.reports,
    ],

    [
      "/notifications",
      <FaBell />,
      t.notifications,
    ],

    [
      "/settings",
      <FaCog />,
      t.settings,
    ],

  ],

  // ======================================
  // MARKETING MANAGER
  // ======================================

  marketing_manager: [

    [
      "/dashboard",
      <FaTachometerAlt />,
      t.dashboard,
    ],

    [
      "/analytics",
      <FaChartBar />,
      t.analytics,
    ],

    [
      "/customer-behaviour",
      <FaUsers />,
      t.customerBehaviour,
    ],

    [
      "/reports",
      <FaFileAlt />,
      t.reports,
    ],

    [
      "/notifications",
      <FaBell />,
      t.notifications,
    ],

    [
      "/settings",
      <FaCog />,
      t.settings,
    ],

  ],

  // ======================================
  // RETAIL ANALYST
  // ======================================

  retail_analyst: [

    [
      "/dashboard",
      <FaTachometerAlt />,
      t.dashboard,
    ],

    [
      "/analytics",
      <FaChartBar />,
      t.analytics,
    ],

    [
      "/trajectory-analysis",
      <FaProjectDiagram />,
      t.trajectoryAnalytics,
    ],

    [
      "/zone-transition",
      <FaExchangeAlt />,
      t.zoneTransition,
    ],

    [
      "/customer-behaviour",
      <FaUsers />,
      t.customerBehaviour,
    ],

    [
      "/customer-insights",
      <FaUsers />,
      t.customerInsights,
    ],

    [
      "/dwell-time",
      <FaChartLine />,
      t.dwellTime,
    ],

    [
      "/product-performance",
      <FaShoppingCart />,
      t.productPerformance,
    ],

    [
      "/ai-insights",
      <FaRobot />,
      t.aiInsights,
    ],

    [
      "/reports",
      <FaFileAlt />,
      t.reports,
    ],

    [
      "/notifications",
      <FaBell />,
      t.notifications,
    ],

    [
      "/settings",
      <FaCog />,
      t.settings,
    ],

  ],

};
return (

  <aside className="sidebar">

    <div className="sidebar-top">

      {/* =======================================
          LOGO
      ======================================= */}

      <div className="logo">

        <div className="logo-icon">

          AI

        </div>

        <div>

          <h2>

            AI Retail

          </h2>

          <p>

            Consumer Attention Mapping

          </p>

        </div>

      </div>

      {/* =======================================
          USER PROFILE
      ======================================= */}

      <div className="sidebar-profile">

        <div className="profile-avatar">

          <FaUserCircle />

        </div>

        <div className="profile-info">

          <h3>

            {username}

          </h3>

          <p>

            {displayRole}

          </p>

          <div className="online-status">

            <FaCircle />

            <span>

              {t.online}

            </span>

          </div>

        </div>

      </div>

      {/* =======================================
          MENU
      ======================================= */}

      <div className="menu">

        {(MENUS[role] || []).map(

          ([path, icon, title]) =>

            menuItem(path, icon, title)

        )}

      </div>

    </div>

    {/* =======================================
        FOOTER
    ======================================= */}

    <div className="sidebar-footer">

      <button
        className="logout-btn"
        onClick={logout}
      >

        <FaSignOutAlt />

        <span>

          {t.logout}

        </span>

      </button>

    </div>

  </aside>

);

}

