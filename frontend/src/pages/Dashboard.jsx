import { useEffect, useState, useMemo } from "react";

import API from "../services/api";

import { useCamera } from "../context/CameraContext";

import CameraSelector from "../components/CameraSelector";
import StatCard from "../components/StatCard";
import SalesChart from "../components/SalesChart";
import CustomerHeatmap from "../components/CustomerHeatmap";
import CameraStatus from "../components/CameraStatus";
import RecentActivity from "../components/RecentActivity";
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
  FaFire,
  FaBroadcastTower,
  FaRobot,
} from "react-icons/fa";

import "../styles/Dashboard.css";
import "../styles/Cards.css";

export default function Dashboard() {
  const { selectedCamera } = useCamera();

  const [dashboardData, setDashboardData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastRefresh, setLastRefresh] = useState(
    new Date()
  );

  const refreshDashboard = async () => {
    try {
      const { data } = await API.get(
        `/dashboard?camera_id=${selectedCamera}`
      );

      setDashboardData(data);

      setError("");

      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();

    const timer = setInterval(
      refreshDashboard,
      3000
    );

    return () => clearInterval(timer);
  }, [selectedCamera]);

  const formattedDwell = useMemo(() => {
    const seconds =
      dashboardData?.average_dwell || 0;

    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins}m ${secs}s`;
  }, [dashboardData]);

  if (loading) {
    return (
      <main className="dashboard-content">

        <div className="dashboard-loading">

          <FaRobot size={45} />

          <h2>
            Loading AI Dashboard...
          </h2>

        </div>

      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-content">

        <div className="dashboard-error">

          <FaTimesCircle size={50} />

          <h2>{error}</h2>

        </div>

      </main>
    );
  }

  if (!dashboardData) return null;
    return (
    <main className="dashboard-content">

      {/* ============================
            DASHBOARD HEADER
      ============================ */}

      <section className="dashboard-header">

        <div className="dashboard-title">

          <h1>AI Consumer Attention Mapping System</h1>

          <p>
            Real-Time Retail Intelligence Dashboard
          </p>

        </div>

        <div className="dashboard-actions">

          <CameraSelector />

        </div>

      </section>

      {/* ============================
            STATUS BAR
      ============================ */}

      <section className="dashboard-status-bar">

        <div className="status-item">

          <FaBroadcastTower />

          <span>

            Camera :

            <strong>

              {" "}
              {selectedCamera}

            </strong>

          </span>

        </div>

        <div className="status-item">

          <FaRobot />

          <span>

            AI Engine :

            <strong>

              {" "}
              {dashboardData.system_status || "Running"}

            </strong>

          </span>

        </div>

        <div className="status-item">

          <FaVideo />

          <span>

            Camera Status :

            <strong>

              {" "}
              {dashboardData.camera_status || "Offline"}

            </strong>

          </span>

        </div>

        <div className="status-item">

          <FaClock />

          <span>

            Updated :

            <strong>

              {" "}

              {lastRefresh.toLocaleTimeString()}

            </strong>

          </span>

        </div>

      </section>

      {/* ============================
              KPI CARDS
      ============================ */}

      <section className="cards">

        <StatCard
          title="Stores"
          value={dashboardData.total_stores ?? 0}
          icon={<FaStore />}
          color="#2563eb"
        />

        <StatCard
          title="Shelves"
          value={dashboardData.total_shelves ?? 0}
          icon={<FaLayerGroup />}
          color="#14b8a6"
        />

        <StatCard
          title="Products"
          value={dashboardData.total_products ?? 0}
          icon={<FaBoxes />}
          color="#22c55e"
        />

        <StatCard
          title="Cameras"
          value={dashboardData.total_cameras ?? 0}
          icon={<FaVideo />}
          color="#8b5cf6"
        />

        <StatCard
          title="Users"
          value={dashboardData.total_users ?? 0}
          icon={<FaUserShield />}
          color="#f59e0b"
        />

        <StatCard
          title="Low Stock"
          value={dashboardData.low_stock_products ?? 0}
          icon={<FaExclamationTriangle />}
          color="#ef4444"
        />

        <StatCard
          title="Current Persons"
          value={dashboardData.current_persons ?? 0}
          icon={<FaUsers />}
          color="#0ea5e9"
        />

        <StatCard
          title="Total Customers"
          value={dashboardData.total_customers ?? 0}
          icon={<FaUsers />}
          color="#16a34a"
        />

        <StatCard
          title="Products Detected"
          value={dashboardData.products_detected ?? 0}
          icon={<FaBoxes />}
          color="#6366f1"
        />

        <StatCard
          title="Interactions"
          value={dashboardData.product_interactions ?? 0}
          icon={<FaShoppingBasket />}
          color="#ec4899"
        />

        <StatCard
          title="Attention Score"
          value={`${dashboardData.attention_score ?? 0}%`}
          icon={<FaChartLine />}
          color="#f97316"
        />

        <StatCard
          title="Average Dwell"
          value={formattedDwell}
          icon={<FaClock />}
          color="#9333ea"
        />

      </section>

      {/* ============================
            LIVE CAMERA + AI SUMMARY
      ============================ */}

      <section className="dashboard-live-grid">

        

        <div className="dashboard-card">

          <div className="card-header">

            <h2>

              AI Summary

            </h2>

          </div>

          <div className="ai-summary">

            <div className="summary-item">

              <FaBrain />

              <div>

                <h4>Attention Score</h4>

                <span>

                  {dashboardData.attention_score ?? 0}%

                </span>

              </div>

            </div>

            <div className="summary-item">

              <FaFire />

              <div>

                <h4>Top Zone</h4>

                <span>

                  {dashboardData.hot_zone || "Shelf A"}

                </span>

              </div>

            </div>

            <div className="summary-item">

              <FaShoppingBasket />

              <div>

                <h4>Product Interactions</h4>

                <span>

                  {dashboardData.product_interactions ?? 0}

                </span>

              </div>

            </div>

            <div className="summary-item">

              <FaClock />

              <div>

                <h4>Average Dwell</h4>

                <span>

                  {formattedDwell}

                </span>

              </div>

            </div>

          </div>

        </div>

      </section>
            {/* ============================
            ANALYTICS SECTION
      ============================ */}

      <section className="dashboard-analytics">

        <div className="dashboard-card">

          <div className="card-header">
            <h2>Sales & Customer Analytics</h2>
          </div>

          <SalesChart data={dashboardData} />

        </div>

      </section>
      {/* ============================
      AI INSIGHTS
      ============================ */}

      <section className="dashboard-ai-insights">

        <div className="dashboard-card">

          <div className="card-header">

            <h2>🤖 AI Insights</h2>

          </div>

          <AIInsightsModern
            data={dashboardData}
          />

        </div>

      </section>

      {/* ============================
            HEATMAP + CAMERA STATUS
      ============================ */}

      <section className="dashboard-grid">

        <div className="dashboard-card">

          <div className="card-header">
            <h2>Customer Heatmap</h2>
          </div>

          <CustomerHeatmap data={dashboardData} />

        </div>

        <div className="dashboard-card">

          <div className="card-header">
            <h2>Camera Status</h2>
          </div>

          <CameraStatus data={dashboardData} />

        </div>

      </section>

      {/* ============================
            RECENT ACTIVITY
      ============================ */}

      <section className="dashboard-activity">

        <div className="dashboard-card">

          <div className="card-header">
            <h2>Recent AI Activity</h2>
          </div>

          <RecentActivity data={dashboardData} />

        </div>

      </section>

      {/* ============================
            SYSTEM SUMMARY
      ============================ */}

      <section className="dashboard-summary">

        <div className="dashboard-card">

          <div className="card-header">
            <h2>System Summary</h2>
          </div>

          <div className="summary-grid">

            <div className="summary-box">

              <h4>Current Persons</h4>

              <span>
                {dashboardData.current_persons ?? 0}
              </span>

            </div>

            <div className="summary-box">

              <h4>Total Customers</h4>

              <span>
                {dashboardData.total_customers ?? 0}
              </span>

            </div>

            <div className="summary-box">

              <h4>Attention Score</h4>

              <span>
                {dashboardData.attention_score ?? 0}%
              </span>

            </div>

            <div className="summary-box">

              <h4>Products Detected</h4>

              <span>
                {dashboardData.products_detected ?? 0}
              </span>

            </div>

            <div className="summary-box">

              <h4>Interactions</h4>

              <span>
                {dashboardData.product_interactions ?? 0}
              </span>

            </div>

            <div className="summary-box">

              <h4>Average Dwell</h4>

              <span>
                {formattedDwell}
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* ============================
            FOOTER
      ============================ */}

      <footer className="dashboard-footer">

        <div>

          <strong>
            AI Consumer Attention Mapping System
          </strong>

        </div>

        <div>

          Camera {selectedCamera}

          {" | "}

          {dashboardData.camera_status || "Offline"}

          {" | "}

          {dashboardData.system_status || "Running"}

        </div>

        <div>

          Last Updated:&nbsp;

          {dashboardData.last_updated
            ? new Date(
                dashboardData.last_updated
              ).toLocaleString()
            : lastRefresh.toLocaleString()}

        </div>

      </footer>

    </main>
  );
}
      