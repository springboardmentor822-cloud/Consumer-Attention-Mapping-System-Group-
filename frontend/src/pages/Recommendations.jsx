import { useEffect, useMemo, useState } from "react";
import {
  FaLightbulb,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine,
  FaStore,
  FaBullhorn,
  FaUsers,
  FaRoute,
  FaBoxes,
  FaSyncAlt,
} from "react-icons/fa";

import API from "../services/api";

import "../styles/Recommendations.css";

// ==========================================================
// SUPPORTED ROLES
// ==========================================================

const SUPPORTED_ROLES = [
  "admin",
  "store_manager",
  "marketing_manager",
];

// ==========================================================
// ROLE INFORMATION
// ==========================================================

const ROLE_INFO = {
  admin: {
    title: "Admin Recommendations",
    subtitle:
      "Store-wide AI recommendations for operational and customer performance.",
    icon: <FaStore />,
  },

  store_manager: {
    title: "Store Manager Recommendations",
    subtitle:
      "Actionable recommendations for store operations, customer movement and shelf performance.",
    icon: <FaBoxes />,
  },

  marketing_manager: {
    title: "Marketing Manager Recommendations",
    subtitle:
      "AI recommendations focused on customer engagement, product visibility and marketing opportunities.",
    icon: <FaBullhorn />,
  },
};

// ==========================================================
// PRIORITY CONFIGURATION
// ==========================================================

const PRIORITY_CONFIG = {
  HIGH: {
    label: "High Priority",
    className: "priority-high",
    icon: <FaExclamationTriangle />,
  },

  MEDIUM: {
    label: "Medium Priority",
    className: "priority-medium",
    icon: <FaLightbulb />,
  },

  LOW: {
    label: "Low Priority",
    className: "priority-low",
    icon: <FaCheckCircle />,
  },
};

// ==========================================================
// RECOMMENDATION TYPE ICON
// ==========================================================

function getRecommendationIcon(type = "") {
  const value = type.toLowerCase();

  if (value.includes("product")) {
    return <FaBoxes />;
  }

  if (
    value.includes("customer") ||
    value.includes("behaviour") ||
    value.includes("behavior")
  ) {
    return <FaUsers />;
  }

  if (
    value.includes("journey") ||
    value.includes("zone") ||
    value.includes("transition")
  ) {
    return <FaRoute />;
  }

  if (
    value.includes("marketing") ||
    value.includes("campaign") ||
    value.includes("promotion")
  ) {
    return <FaBullhorn />;
  }

  if (
    value.includes("store") ||
    value.includes("shelf") ||
    value.includes("layout")
  ) {
    return <FaStore />;
  }

  return <FaLightbulb />;
}

// ==========================================================
// NORMALIZE ROLE
// ==========================================================

function getCurrentRole() {
  try {
    const storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    const role = (
      storedUser.role ||
      localStorage.getItem("role") ||
      "admin"
    )
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (SUPPORTED_ROLES.includes(role)) {
      return role;
    }

    return "admin";
  } catch (error) {
    console.error("Role loading error:", error);
    return "admin";
  }
}

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function Recommendations() {
  const [cameraId] = useState(1);

  const [role, setRole] = useState(getCurrentRole());

  const [recommendations, setRecommendations] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  // ========================================================
  // ROLE
  // ========================================================

  useEffect(() => {
    const currentRole = getCurrentRole();

    setRole(currentRole);
  }, []);

  // ========================================================
  // LOAD RECOMMENDATIONS
  // ========================================================

  useEffect(() => {
    loadRecommendations();
  }, [cameraId, role]);

  async function loadRecommendations() {
    try {
      setLoading(true);
      setError("");

      console.log(
        `Loading recommendations for role: ${role}`
      );

      const response = await API.get(
        `/analytics/recommendations/${cameraId}?role=${encodeURIComponent(
          role
        )}`
      );

      console.log(
        "Recommendation API Response:",
        response.data
      );

      const data = response.data || {};

      // ------------------------------------------------------
      // Recommendations
      // ------------------------------------------------------

      const receivedRecommendations =
        Array.isArray(data.recommendations)
          ? data.recommendations
          : [];

      // ------------------------------------------------------
      // Summary
      // ------------------------------------------------------

      const receivedSummary = data.summary || {};

      setRecommendations(receivedRecommendations);

      setSummary({
        total:
          receivedSummary.total ??
          receivedRecommendations.length,

        high:
          receivedSummary.high ??
          receivedRecommendations.filter(
            (item) =>
              String(item.priority || "").toUpperCase() ===
              "HIGH"
          ).length,

        medium:
          receivedSummary.medium ??
          receivedRecommendations.filter(
            (item) =>
              String(item.priority || "").toUpperCase() ===
              "MEDIUM"
          ).length,

        low:
          receivedSummary.low ??
          receivedRecommendations.filter(
            (item) =>
              String(item.priority || "").toUpperCase() ===
              "LOW"
          ).length,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Recommendation loading error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load recommendations."
      );

      setRecommendations([]);

      setSummary({
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  // ========================================================
  // SORT RECOMMENDATIONS
  // ========================================================

  const sortedRecommendations = useMemo(() => {
    const priorityOrder = {
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    return [...recommendations].sort((a, b) => {
      const priorityA =
        priorityOrder[
          String(a.priority || "").toUpperCase()
        ] || 4;

      const priorityB =
        priorityOrder[
          String(b.priority || "").toUpperCase()
        ] || 4;

      return priorityA - priorityB;
    });
  }, [recommendations]);

  // ========================================================
  // ROLE DISPLAY
  // ========================================================

  const roleInfo =
    ROLE_INFO[role] || ROLE_INFO.admin;

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="recommendations-page">
        <div className="recommendations-loading">
          <FaSyncAlt className="loading-icon" />

          <h2>
            Loading Recommendations...
          </h2>

          <p>
            AI is analyzing current store
            behaviour and analytics.
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <div className="recommendations-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="recommendations-header">

        <div className="recommendation-title-section">

          <div className="recommendation-main-icon">
            {roleInfo.icon}
          </div>

          <div>

            <h1>
              Recommendation & Optimization
            </h1>

            <p>
              {roleInfo.subtitle}
            </p>

          </div>

        </div>

        <div className="recommendation-role-badge">

          <span>
            {roleInfo.icon}
          </span>

          <strong>
            {role === "admin"
              ? "Administrator"
              : role === "store_manager"
              ? "Store Manager"
              : "Marketing Manager"}
          </strong>

        </div>

      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="recommendation-error">

          <FaExclamationTriangle />

          <span>
            {error}
          </span>

          <button
            onClick={loadRecommendations}
          >
            Retry
          </button>

        </div>
      )}

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="recommendation-summary">

        {/* TOTAL */}

        <div className="recommendation-stat-card total-card">

          <div className="stat-icon">
            <FaLightbulb />
          </div>

          <div className="stat-content">

            <span>
              Total Recommendations
            </span>

            <strong>
              {summary.total}
            </strong>

          </div>

        </div>

        {/* HIGH */}

        <div className="recommendation-stat-card high-card">

          <div className="stat-icon">
            <FaExclamationTriangle />
          </div>

          <div className="stat-content">

            <span>
              High Priority
            </span>

            <strong>
              {summary.high}
            </strong>

          </div>

        </div>

        {/* MEDIUM */}

        <div className="recommendation-stat-card medium-card">

          <div className="stat-icon">
            <FaLightbulb />
          </div>

          <div className="stat-content">

            <span>
              Medium Priority
            </span>

            <strong>
              {summary.medium}
            </strong>

          </div>

        </div>

        {/* LOW */}

        <div className="recommendation-stat-card low-card">

          <div className="stat-icon">
            <FaCheckCircle />
          </div>

          <div className="stat-content">

            <span>
              Low Priority
            </span>

            <strong>
              {summary.low}
            </strong>

          </div>

        </div>

      </div>

      {/* ==================================================
          ACTIONABLE RECOMMENDATIONS
      ================================================== */}

      <div className="recommendation-section">

        <div className="section-heading">

          <div>

            <h2>
              Actionable Recommendations
            </h2>

            <p>
              AI-generated actions for improving
              store performance and customer
              engagement.
            </p>

          </div>

          <button
            className="refresh-recommendations-btn"
            onClick={loadRecommendations}
          >
            <FaSyncAlt />
            Refresh
          </button>

        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {sortedRecommendations.length === 0 ? (

          <div className="recommendation-empty">

            <FaCheckCircle />

            <h3>
              No Recommendations Available
            </h3>

            <p>
              There are currently no actionable
              recommendations for this role.
            </p>

          </div>

        ) : (

          <div className="recommendations-list">

            {sortedRecommendations.map(
              (recommendation, index) => {

                const priority =
                  String(
                    recommendation.priority ||
                      "LOW"
                  ).toUpperCase();

                const priorityConfig =
                  PRIORITY_CONFIG[
                    priority
                  ] ||
                  PRIORITY_CONFIG.LOW;

                return (

                  <div
                    className={`recommendation-card ${priorityConfig.className}`}
                    key={
                      recommendation.id ||
                      `${recommendation.type}-${index}`
                    }
                  >

                    {/* ==================================
                        CARD HEADER
                    ================================== */}

                    <div className="recommendation-card-header">

                      <div className="recommendation-type-icon">

                        {getRecommendationIcon(
                          recommendation.type
                        )}

                      </div>

                      <div className="recommendation-card-title">

                        <h3>
                          {recommendation.type ||
                            "Store Optimization"}
                        </h3>

                        {recommendation.target && (
                          <span>
                            Target:{" "}
                            {recommendation.target}
                          </span>
                        )}

                      </div>

                      <div
                        className={`priority-badge ${priorityConfig.className}`}
                      >

                        {priorityConfig.icon}

                        <span>
                          {priorityConfig.label}
                        </span>

                      </div>

                    </div>

                    {/* ==================================
                        RECOMMENDED ACTION
                    ================================== */}

                    <div className="recommendation-detail">

                      <div className="detail-label">
                        Recommended Action
                      </div>

                      <div className="detail-value action-value">
                        {recommendation.action ||
                          "Review the available analytics and optimize the identified area."}
                      </div>

                    </div>

                    {/* ==================================
                        REASON
                    ================================== */}

                    <div className="recommendation-detail">

                      <div className="detail-label">
                        Reason
                      </div>

                      <div className="detail-value">
                        {recommendation.reason ||
                          "The recommendation was generated from available customer and store analytics."}
                      </div>

                    </div>

                    {/* ==================================
                        EXPECTED IMPACT
                    ================================== */}

                    <div className="recommendation-detail">

                      <div className="detail-label">
                        Expected Impact
                      </div>

                      <div className="detail-value impact-value">
                        {recommendation.expected_impact ||
                          "Improve store performance and customer engagement."}
                      </div>

                    </div>

                    {/* ==================================
                        SOURCE
                    ================================== */}

                    <div className="recommendation-card-footer">

                      <span>
                        Source:{" "}
                        {recommendation.source ||
                          "Recommendation Engine"}
                      </span>

                      {recommendation.shelf_id && (
                        <span>
                          Shelf:{" "}
                          {recommendation.shelf_id}
                        </span>
                      )}

                      {recommendation.product_sku && (
                        <span>
                          SKU:{" "}
                          {recommendation.product_sku}
                        </span>
                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* ==================================================
          ROLE INFORMATION
      ================================================== */}

      <div className="recommendation-engine-card">

        <div className="engine-icon">
          <FaChartLine />
        </div>

        <div>

          <h3>
            Recommendation Engine
          </h3>

          <p>
            Recommendations are generated from
            the system's customer behaviour,
            journey, zone-transition and store
            analytics.
          </p>

          <p className="role-note">

            Current view:
            {" "}
            <strong>
              {role === "admin"
                ? "Administrator"
                : role === "store_manager"
                ? "Store Manager"
                : "Marketing Manager"}
            </strong>

          </p>

        </div>

      </div>

      {/* ==================================================
          LAST UPDATED
      ================================================== */}

      {lastUpdated && (

        <div className="recommendations-updated">

          Last updated:{" "}

          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}

        </div>

      )}

    </div>
  );
}