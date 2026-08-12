import { useEffect, useState } from "react";

import API from "../services/api";
import { useCamera } from "../context/CameraContext";

import CameraSelector from "../components/CameraSelector";
import StatCard from "../components/StatCard";
import SalesChart from "../components/SalesChart";
import AIInsightsModern from "../components/AIInsightsModern";

import {
  FaStore,
  FaBoxes,
  FaVideo,
  FaUsers,
  FaUserShield,
  FaLayerGroup,
  FaShoppingBasket,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaBrain,
  FaBroadcastTower,
  FaRobot,
  FaUserTie,
  FaBullhorn,
  FaServer,
  FaEye,
  FaChartBar,
} from "react-icons/fa";

import "../styles/Dashboard.css";
import "../styles/Cards.css";
import "../styles/M4Dashboard.css";


/* ==========================================================
   PROJECT CONFIGURATION
========================================================== */

const PROJECT_CONFIG = {
  shelves: 5,
  products: 10,
  cameras: 2,

  users: {
    admin: 1,
    store_manager: 1,
    marketing_manager: 1,
    retail_analyst: 1,
  },
};


/* ==========================================================
   GET CURRENT USER
========================================================== */

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    return {};
  }
}


/* ==========================================================
   NORMALIZE ROLE
========================================================== */

function normalizeRole(user) {
  return (
    user?.role ||
    localStorage.getItem("role") ||
    "guest"
  )
    .toLowerCase()
    .replace(/\s+/g, "_");
}


/* ==========================================================
   FORMAT DWELL TIME
========================================================== */

function formatDwell(seconds) {
  const value = Number(seconds || 0);

  if (!value) {
    return "0m 0s";
  }

  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);

  return `${mins}m ${secs}s`;
}


/* ==========================================================
   EXTRACT LIVE CAMERA DATA
   Supports multiple possible backend response structures.
========================================================== */

function extractLiveStats(responseData, cameraId) {
  if (!responseData) {
    return {};
  }

  const cameraKey = String(cameraId);

  /* ---------------------------------------------
     Direct response
  --------------------------------------------- */

  if (
    responseData.current_persons !== undefined ||
    responseData.shelf_a_percent !== undefined ||
    responseData.shelf_a !== undefined
  ) {
    return responseData;
  }


  /* ---------------------------------------------
     Numeric camera key
     { "1": {...}, "2": {...} }
  --------------------------------------------- */

  if (responseData[cameraKey]) {
    return responseData[cameraKey];
  }


  /* ---------------------------------------------
     Camera key
     { camera_1: {...} }
  --------------------------------------------- */

  if (responseData[`camera_${cameraKey}`]) {
    return responseData[`camera_${cameraKey}`];
  }


  /* ---------------------------------------------
     Cameras object
  --------------------------------------------- */

  if (
    responseData.cameras &&
    responseData.cameras[cameraKey]
  ) {
    return responseData.cameras[cameraKey];
  }


  /* ---------------------------------------------
     live_stats object
  --------------------------------------------- */

  if (responseData.live_stats) {

    if (
      responseData.live_stats[cameraKey]
    ) {
      return responseData.live_stats[cameraKey];
    }

    if (
      responseData.live_stats[
        `camera_${cameraKey}`
      ]
    ) {
      return responseData.live_stats[
        `camera_${cameraKey}`
      ];
    }

    return responseData.live_stats;
  }


  /* ---------------------------------------------
     dashboard summary
  --------------------------------------------- */

  if (responseData.dashboard_summary) {
    return responseData.dashboard_summary;
  }


  return responseData;
}


/* ==========================================================
   GET SHELF VALUE
   First uses calculated percentage.
   Then calculates percentage from raw zone counts.
========================================================== */

function getShelfPercentage(
  liveData,
  dashboardData,
  shelfLetter
) {
  const percentageKey =
    `shelf_${shelfLetter.toLowerCase()}_percent`;

  const rawKey =
    `shelf_${shelfLetter.toLowerCase()}`;


  /* ---------------------------------------------
     1. Direct percentage
  --------------------------------------------- */

  const directPercentage =
    liveData?.[percentageKey] ??
    dashboardData?.[percentageKey];


  if (
    directPercentage !== undefined &&
    directPercentage !== null &&
    Number.isFinite(Number(directPercentage))
  ) {
    return Number(directPercentage);
  }


  /* ---------------------------------------------
     2. Raw shelf count
  --------------------------------------------- */

  const shelfCount =
    liveData?.[rawKey] ??
    dashboardData?.[rawKey];


  if (
    shelfCount !== undefined &&
    shelfCount !== null
  ) {

    const shelfA =
      Number(
        liveData?.shelf_a ??
        dashboardData?.shelf_a ??
        0
      );

    const shelfB =
      Number(
        liveData?.shelf_b ??
        dashboardData?.shelf_b ??
        0
      );

    const shelfC =
      Number(
        liveData?.shelf_c ??
        dashboardData?.shelf_c ??
        0
      );

    const shelfD =
      Number(
        liveData?.shelf_d ??
        dashboardData?.shelf_d ??
        0
      );

    const shelfE =
      Number(
        liveData?.shelf_e ??
        dashboardData?.shelf_e ??
        0
      );

    const checkout =
      Number(
        liveData?.checkout ??
        dashboardData?.checkout ??
        0
      );


    const total =
      shelfA +
      shelfB +
      shelfC +
      shelfD +
      shelfE +
      checkout;


    if (total > 0) {

      return Number(
        (
          Number(shelfCount) /
          total *
          100
        ).toFixed(1)
      );

    }
  }


  /* ---------------------------------------------
     3. No backend data
  --------------------------------------------- */

  return null;
}


/* ==========================================================
   STORE MANAGER DASHBOARD
========================================================== */

function StoreManagerDashboard({
  dashboardData,
  liveData,
  selectedCamera,
  lastRefresh,
}) {

  /* ========================================================
     SHELF DATA
  ======================================================== */

  const shelves = [
    {
      name: "Shelf A",
      value: getShelfPercentage(
        liveData,
        dashboardData,
        "A"
      ),
    },
    {
      name: "Shelf B",
      value: getShelfPercentage(
        liveData,
        dashboardData,
        "B"
      ),
    },
    {
      name: "Shelf C",
      value: getShelfPercentage(
        liveData,
        dashboardData,
        "C"
      ),
    },
    {
      name: "Shelf D",
      value: getShelfPercentage(
        liveData,
        dashboardData,
        "D"
      ),
    },
    {
      name: "Shelf E",
      value: getShelfPercentage(
        liveData,
        dashboardData,
        "E"
      ),
    },
  ];


  const attentionScore =
    liveData?.attention_score ??
    dashboardData?.attention_score ??
    0;


  const currentPersons =
    liveData?.current_persons ??
    dashboardData?.current_persons ??
    0;


  const totalCustomers =
    liveData?.total_customers ??
    dashboardData?.total_customers ??
    0;


  const productInteractions =
    liveData?.product_interactions ??
    dashboardData?.product_interactions ??
    0;


  const averageDwell =
    liveData?.average_dwell ??
    dashboardData?.average_dwell ??
    0;


  const trackedPaths =
    liveData?.tracked_paths ??
    dashboardData?.tracked_paths ??
    totalCustomers;


  const congestion =
    liveData?.store_congestion ??
    dashboardData?.store_congestion ??
    "Normal";


  const engagement =
    liveData?.engagement_level ??
    dashboardData?.engagement_level ??
    "Monitoring";


  const recommendation =
    liveData?.ai_recommendation ??
    dashboardData?.ai_recommendation ??
    "Monitoring customer behaviour.";


  return (
    <main className="dashboard-content m4-dashboard">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="m4-dashboard-header">

        <div>

          <div className="m4-eyebrow">

            <FaStore />

            STORE MANAGER

          </div>


          <h1>
            Store Manager Dashboard
          </h1>


          <p>
            Real-time store performance,
            customer traffic and engagement overview.
          </p>

        </div>


        <div className="m4-header-actions">

          <div className="m4-live-indicator">

            <span className="m4-live-dot"></span>

            Live Analytics

          </div>


          <CameraSelector />

        </div>

      </section>


      {/* ======================================================
          STATUS STRIP
      ====================================================== */}

      <section className="m4-status-strip">

        <div className="m4-status-item">

          <FaBroadcastTower />

          <div>

            <span>
              Active Camera
            </span>

            <strong>
              Camera {selectedCamera}
            </strong>

          </div>

        </div>


        <div className="m4-status-item">

          <FaRobot />

          <div>

            <span>
              AI Engine
            </span>

            <strong>
              {dashboardData?.system_status ||
                "Running"}
            </strong>

          </div>

        </div>


        <div className="m4-status-item">

          <FaVideo />

          <div>

            <span>
              Camera Stream
            </span>

            <strong>
              {dashboardData?.camera_status ||
                "Online"}
            </strong>

          </div>

        </div>


        <div className="m4-status-item">

          <FaChartLine />

          <div>

            <span>
              Store Traffic
            </span>

            <strong>
              {congestion}
            </strong>

          </div>

        </div>


        <div className="m4-status-item">

          <FaClock />

          <div>

            <span>
              Updated
            </span>

            <strong>
              {lastRefresh.toLocaleTimeString()}
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <section className="cards m4-kpi-grid">

        <StatCard
          title="Current Customers"
          value={currentPersons}
          icon={<FaUsers />}
          color="#0ea5e9"
        />


        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={<FaUsers />}
          color="#22c55e"
        />


        <StatCard
          title="Shelves"
          value={PROJECT_CONFIG.shelves}
          icon={<FaLayerGroup />}
          color="#14b8a6"
        />


        <StatCard
          title="Products"
          value={PROJECT_CONFIG.products}
          icon={<FaBoxes />}
          color="#6366f1"
        />


        <StatCard
          title="Interactions"
          value={productInteractions}
          icon={<FaShoppingBasket />}
          color="#ec4899"
        />


        <StatCard
          title="Attention Score"
          value={`${attentionScore}%`}
          icon={<FaBrain />}
          color="#f97316"
        />


        <StatCard
          title="Average Dwell"
          value={formatDwell(averageDwell)}
          icon={<FaClock />}
          color="#9333ea"
        />


        <StatCard
          title="Tracked Paths"
          value={trackedPaths}
          icon={<FaChartLine />}
          color="#0891b2"
        />

      </section>


      {/* ======================================================
          STORE TRAFFIC
      ====================================================== */}

      <section className="m4-section">

        <div className="m4-section-heading">

          <div>

            <span className="m4-section-label">
              REAL-TIME MONITORING
            </span>

            <h2>
              Store Traffic Monitoring
            </h2>

            <p>
              Live customer activity from
              the selected camera.
            </p>

          </div>


          <div className="m4-metric-pill">

            <FaUsers />

            {currentPersons}

            <span>
              current
            </span>

          </div>

        </div>


        <div className="m4-traffic-grid">

          <div className="m4-panel">

            <div className="m4-panel-header">

              <div>

                <h3>
                  Customer Traffic
                </h3>

                <p>
                  Current camera activity
                </p>

              </div>

              <FaChartLine />

            </div>


            <div className="m4-big-number">

              {currentPersons}

              <span>
                customers currently detected
              </span>

            </div>


            <div className="m4-traffic-details">

              <div>

                <span>
                  Total tracked
                </span>

                <strong>
                  {totalCustomers}
                </strong>

              </div>


              <div>

                <span>
                  Traffic
                </span>

                <strong>
                  {congestion}
                </strong>

              </div>


              <div>

                <span>
                  Attention
                </span>

                <strong>
                  {attentionScore}%
                </strong>

              </div>

            </div>

          </div>


          <div className="m4-panel">

            <div className="m4-panel-header">

              <div>

                <h3>
                  Customer Analytics
                </h3>

                <p>
                  Live analytics trend
                </p>

              </div>

              <FaChartBar />

            </div>


            <div className="m4-chart-wrapper">

              <SalesChart
                data={{
                  ...dashboardData,
                  ...liveData,
                }}
              />

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          PRODUCT ENGAGEMENT + SHELF PERFORMANCE
      ====================================================== */}

      <section className="m4-two-column">

        {/* PRODUCT ENGAGEMENT */}

        <div className="m4-panel">

          <div className="m4-panel-header">

            <div>

              <h3>
                Product Engagement Insights
              </h3>

              <p>
                Engagement activity across the
                {PROJECT_CONFIG.products} configured products.
              </p>

            </div>


            <div className="m4-panel-icon product">

              <FaShoppingBasket />

            </div>

          </div>


          <div className="m4-product-summary">

            <div className="m4-product-total">

              <strong>
                {PROJECT_CONFIG.products}
              </strong>

              <span>
                Products
              </span>

            </div>


            <div className="m4-product-total">

              <strong>
                {liveData?.products_detected ??
                  dashboardData?.products_detected ??
                  0}
              </strong>

              <span>
                Detected
              </span>

            </div>


            <div className="m4-product-total">

              <strong>
                {productInteractions}
              </strong>

              <span>
                Interactions
              </span>

            </div>

          </div>


          <div className="m4-engagement-bar">

            <div>

              <span>
                Engagement activity
              </span>

              <strong>
                {engagement}
              </strong>

            </div>


            <div className="m4-progress">

              <div
                style={{
                  width: `${Math.min(
                    Number(attentionScore) || 0,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>


          <div className="m4-insight-row">

            <FaEye />

            <span>
              Product interaction monitoring is active.
            </span>

          </div>

        </div>


        {/* SHELF PERFORMANCE */}

        <div className="m4-panel">

          <div className="m4-panel-header">

            <div>

              <h3>
                Shelf Performance
              </h3>

              <p>
                Live customer activity across all
                five shelf zones.
              </p>

            </div>


            <div className="m4-panel-icon shelf">

              <FaLayerGroup />

            </div>

          </div>


          <div className="m4-shelf-list">

            {shelves.map((shelf) => {

              const hasData =
                shelf.value !== null &&
                shelf.value !== undefined;


              const safeValue =
                hasData
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        Number(shelf.value)
                      )
                    )
                  : 0;


              return (

                <div
                  className="m4-shelf-row"
                  key={shelf.name}
                >

                  <div className="m4-shelf-name">

                    <span>
                      {shelf.name}
                    </span>


                    <strong>
                      {hasData
                        ? `${safeValue}%`
                        : "No data"}
                    </strong>

                  </div>


                  <div className="m4-progress shelf">

                    <div
                      style={{
                        width: hasData
                          ? `${safeValue}%`
                          : "0%",
                      }}
                    />

                  </div>

                </div>

              );

            })}

          </div>


          <div className="m4-shelf-note">

            <FaLayerGroup />

            <span>
              Values are calculated from the
              live AI zone analytics.
            </span>

          </div>

        </div>

      </section>


      {/* ======================================================
          AI INSIGHTS
      ====================================================== */}

      <section className="dashboard-ai-insights">

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              🤖 AI Insights
            </h2>

          </div>


          <AIInsightsModern
            data={{
              ...dashboardData,
              ...liveData,
              ai_recommendation:
                recommendation,
              engagement_level:
                engagement,
            }}
          />

        </div>

      </section>


      {/* ======================================================
          AI RECOMMENDATION
      ====================================================== */}

      <section className="m4-panel m4-recommendation-panel">

        <div className="m4-panel-header">

          <div>

            <h3>
              AI Recommendation Engine
            </h3>

            <p>
              Current recommendation generated
              from customer behaviour analytics.
            </p>

          </div>


          <FaBrain />

        </div>


        <div className="m4-recommendation-content">

          <div>

            <strong>
              Recommendation Status
            </strong>

            <span>
              Active
            </span>

          </div>


          <p>
            {recommendation}
          </p>

        </div>

      </section>


      {/* ======================================================
          DASHBOARD FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <div>

          <strong>
            AI Consumer Attention Mapping System
          </strong>

        </div>


        <div>

          {PROJECT_CONFIG.shelves} Shelves
          {" | "}
          {PROJECT_CONFIG.products} Products
          {" | "}
          {PROJECT_CONFIG.cameras} Cameras

        </div>


        <div>

          Last Updated:&nbsp;

          {lastRefresh.toLocaleString()}

        </div>

      </footer>

    </main>
  );
}


/* ==========================================================
   ADMIN DASHBOARD
========================================================== */

function AdminDashboard({
  dashboardData,
  liveData,
  selectedCamera,
  lastRefresh,
}) {

  const users = [
    {
      role: "Administrator",
      count: PROJECT_CONFIG.users.admin,
      icon: <FaUserShield />,
    },
    {
      role: "Store Manager",
      count: PROJECT_CONFIG.users.store_manager,
      icon: <FaUserTie />,
    },
    {
      role: "Marketing Manager",
      count: PROJECT_CONFIG.users.marketing_manager,
      icon: <FaBullhorn />,
    },
    {
      role: "Retail Analyst",
      count: PROJECT_CONFIG.users.retail_analyst,
      icon: <FaChartLine />,
    },
  ];


  const currentPersons =
    liveData?.current_persons ??
    dashboardData?.current_persons ??
    0;


  const totalCustomers =
    liveData?.total_customers ??
    dashboardData?.total_customers ??
    0;


  const attentionScore =
    liveData?.attention_score ??
    dashboardData?.attention_score ??
    0;


  return (
    <main className="dashboard-content m4-dashboard">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="m4-dashboard-header">

        <div>

          <div className="m4-eyebrow admin">

            <FaUserShield />

            ADMINISTRATOR

          </div>


          <h1>
            Administrator Dashboard
          </h1>


          <p>
            Platform administration, user management,
            camera management and system monitoring.
          </p>

        </div>


        <div className="m4-live-indicator">

          <span className="m4-live-dot"></span>

          Platform Monitoring

        </div>

      </section>


      {/* ======================================================
          ADMIN KPI
      ====================================================== */}

      <section className="cards m4-kpi-grid">

        <StatCard
          title="Total Users"
          value="4"
          icon={<FaUsers />}
          color="#2563eb"
        />


        <StatCard
          title="Shelves"
          value="5"
          icon={<FaLayerGroup />}
          color="#14b8a6"
        />


        <StatCard
          title="Products"
          value="10"
          icon={<FaBoxes />}
          color="#22c55e"
        />


        <StatCard
          title="Cameras"
          value="2"
          icon={<FaVideo />}
          color="#8b5cf6"
        />


        <StatCard
          title="Current Persons"
          value={currentPersons}
          icon={<FaUsers />}
          color="#0ea5e9"
        />


        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={<FaChartLine />}
          color="#16a34a"
        />


        <StatCard
          title="AI Attention"
          value={`${attentionScore}%`}
          icon={<FaBrain />}
          color="#f97316"
        />


        <StatCard
          title="AI Engine"
          value={
            dashboardData?.system_status ||
            "Running"
          }
          icon={<FaRobot />}
          color="#9333ea"
        />

      </section>


      {/* ======================================================
          USER & ROLE MANAGEMENT
      ====================================================== */}

      <section className="m4-section">

        <div className="m4-section-heading">

          <div>

            <span className="m4-section-label">
              ACCESS CONTROL
            </span>

            <h2>
              User & Role Management
            </h2>

            <p>
              Current role distribution in the platform.
            </p>

          </div>


          <div className="m4-metric-pill">

            <FaUsers />

            4

            <span>
              users
            </span>

          </div>

        </div>


        <div className="m4-role-grid">

          {users.map((item) => (

            <div
              className="m4-role-card"
              key={item.role}
            >

              <div className="m4-role-icon">

                {item.icon}

              </div>


              <div>

                <span>
                  {item.role}
                </span>

                <strong>
                  {item.count}
                </strong>

                <small>
                  Active user
                </small>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* ======================================================
          CAMERA MANAGEMENT
      ====================================================== */}

      <section className="m4-section">

        <div className="m4-section-heading">

          <div>

            <span className="m4-section-label">
              CAMERA MANAGEMENT
            </span>

            <h2>
              Camera Feed Management
            </h2>

            <p>
              Two configured retail monitoring cameras.
            </p>

          </div>


          <div className="m4-camera-count">

            <FaVideo />

            2 Cameras

          </div>

        </div>


        <div className="m4-camera-grid">

          {[1, 2].map((cameraId) => {

            const isSelected =
              Number(selectedCamera) ===
              cameraId;


            const status =
              isSelected
                ? (
                    dashboardData?.camera_status ||
                    "Online"
                  )
                : "Configured";


            return (

              <div
                className="m4-camera-card"
                key={cameraId}
              >

                <div className="m4-camera-top">

                  <div className="m4-camera-icon">

                    <FaVideo />

                  </div>


                  <span
                    className={
                      `m4-camera-status ${
                        isSelected
                          ? "online"
                          : "unknown"
                      }`
                    }
                  >

                    <span></span>

                    {status}

                  </span>

                </div>


                <h3>
                  Camera {cameraId}
                </h3>


                <p>
                  Retail monitoring camera
                </p>


                <div className="m4-camera-meta">

                  <span>
                    Camera ID
                  </span>

                  <strong>
                    {cameraId}
                  </strong>

                </div>

              </div>

            );

          })}

        </div>

      </section>


      {/* ======================================================
          PLATFORM ANALYTICS
      ====================================================== */}

      <section className="m4-two-column">

        <div className="m4-panel">

          <div className="m4-panel-header">

            <div>

              <h3>
                Platform Analytics
              </h3>

              <p>
                Current platform configuration.
              </p>

            </div>


            <FaChartBar />

          </div>


          <div className="m4-admin-metrics">

            <div>

              <span>
                Shelves configured
              </span>

              <strong>
                5 / 5
              </strong>

            </div>


            <div>

              <span>
                Products configured
              </span>

              <strong>
                10 / 10
              </strong>

            </div>


            <div>

              <span>
                Cameras configured
              </span>

              <strong>
                2 / 2
              </strong>

            </div>


            <div>

              <span>
                Users configured
              </span>

              <strong>
                4 / 4
              </strong>

            </div>

          </div>

        </div>


        <div className="m4-panel">

          <div className="m4-panel-header">

            <div>

              <h3>
                System Monitoring
              </h3>

              <p>
                Current platform service indicators.
              </p>

            </div>


            <FaServer />

          </div>


          <div className="m4-system-list">

            <div>

              <span>

                <FaCheckCircle />

                FastAPI Backend

              </span>

              <strong>
                Running
              </strong>

            </div>


            <div>

              <span>

                <FaCheckCircle />

                AI Engine

              </span>

              <strong>
                {dashboardData?.system_status ||
                  "Running"}
              </strong>

            </div>


            <div>

              <span>

                <FaCheckCircle />

                Analytics Pipeline

              </span>

              <strong>
                Active
              </strong>

            </div>


            <div>

              <span>

                <FaCheckCircle />

                Camera Workers

              </span>

              <strong>
                Monitoring
              </strong>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          CUSTOMER ANALYTICS
      ====================================================== */}

      <section className="m4-panel m4-admin-chart">

        <div className="m4-panel-header">

          <div>

            <h3>
              Overall Customer Analytics
            </h3>

            <p>
              Platform-wide customer activity.
            </p>

          </div>


          <FaChartBar />

        </div>


        <SalesChart
          data={{
            ...dashboardData,
            ...liveData,
          }}
        />

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <div>

          <strong>
            AI Consumer Attention Mapping System
          </strong>

        </div>


        <div>

          4 Users
          {" | "}
          5 Shelves
          {" | "}
          10 Products
          {" | "}
          2 Cameras

        </div>


        <div>

          Last Updated:&nbsp;

          {lastRefresh.toLocaleString()}

        </div>

      </footer>

    </main>
  );
}


/* ==========================================================
   MAIN DASHBOARD
========================================================== */

export default function Dashboard() {

  const { selectedCamera } = useCamera();


  const [dashboardData, setDashboardData] =
    useState(null);


  const [liveData, setLiveData] =
    useState({});


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [lastRefresh, setLastRefresh] =
    useState(new Date());


  const user =
    getCurrentUser();


  const role =
    normalizeRole(user);


  /* ========================================================
     REFRESH DASHBOARD
  ======================================================== */

  const refreshDashboard = async () => {

    try {

      /* ---------------------------------------------
         DASHBOARD API
      --------------------------------------------- */

      const dashboardResponse =
        await API.get(
          `/dashboard?camera_id=${selectedCamera}`
        );


      const dashboardResult =
        dashboardResponse.data;


      setDashboardData(
        dashboardResult
      );


      /* ---------------------------------------------
         LIVE ANALYTICS API
      --------------------------------------------- */

      try {

        const liveResponse =
          await API.get(
            "/analytics/live"
          );


        const extracted =
          extractLiveStats(
            liveResponse.data,
            selectedCamera
          );


        setLiveData(
          extracted || {}
        );


      } catch (liveError) {

        console.warn(
          "Live analytics unavailable:",
          liveError
        );

        /*
         Do not destroy the dashboard if
         /analytics/live temporarily fails.
        */

        setLiveData({});

      }


      setError("");

      setLastRefresh(
        new Date()
      );

    } catch (err) {

      console.error(
        "Dashboard refresh error:",
        err
      );


      setError(
        "Unable to load dashboard data."
      );

    } finally {

      setLoading(false);

    }

  };


  /* ========================================================
     AUTO REFRESH
  ======================================================== */

  useEffect(() => {

    refreshDashboard();


    const timer =
      setInterval(
        refreshDashboard,
        3000
      );


    return () =>
      clearInterval(timer);

  }, [selectedCamera]);


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (

      <main className="dashboard-content">

        <div className="dashboard-loading">

          <FaRobot size={48} />

          <h2>
            Loading AI Dashboard...
          </h2>

          <p>
            Loading real-time retail analytics.
          </p>

        </div>

      </main>

    );

  }


  /* ========================================================
     ERROR
  ======================================================== */

  if (error && !dashboardData) {

    return (

      <main className="dashboard-content">

        <div className="dashboard-error">

          <FaTimesCircle size={52} />

          <h2>
            {error}
          </h2>


          <button
            onClick={refreshDashboard}
          >
            Retry
          </button>

        </div>

      </main>

    );

  }


  if (!dashboardData) {

    return (

      <main className="dashboard-content">

        <div className="dashboard-error">

          <FaExclamationTriangle
            size={52}
          />

          <h2>
            No dashboard data available.
          </h2>


          <button
            onClick={refreshDashboard}
          >
            Refresh
          </button>

        </div>

      </main>

    );

  }


  /* ========================================================
     ROLE BASED DASHBOARD
  ======================================================== */

  if (
    role === "admin" ||
    role === "administrator"
  ) {

    return (

      <AdminDashboard
        dashboardData={dashboardData}
        liveData={liveData}
        selectedCamera={selectedCamera}
        lastRefresh={lastRefresh}
      />

    );

  }


  if (
    role === "store_manager" ||
    role === "manager"
  ) {

    return (

      <StoreManagerDashboard
        dashboardData={dashboardData}
        liveData={liveData}
        selectedCamera={selectedCamera}
        lastRefresh={lastRefresh}
      />

    );

  }


  /* ========================================================
     DEFAULT DASHBOARD
  ======================================================== */

  return (

    <StoreManagerDashboard
      dashboardData={dashboardData}
      liveData={liveData}
      selectedCamera={selectedCamera}
      lastRefresh={lastRefresh}
    />

  );

}