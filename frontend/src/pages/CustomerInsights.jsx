// ======================================================
// CustomerInsights.jsx (Part 1)
// ======================================================

import { useEffect, useState } from "react";
import API from "../services/api";
import { useCamera } from "../context/CameraContext";
import CameraSelector from "../components/CameraSelector";

import {
  FaUsers,
  FaChartLine,
  FaClock,
  FaShoppingBasket,
  FaRobot,
  FaCheckCircle,
} from "react-icons/fa";

import LineAnalyticsChart from "../components/charts/LineAnalyticsChart";
import BarAnalyticsChart from "../components/charts/BarAnalyticsChart";
import PieAnalyticsChart from "../components/charts/PieAnalyticsChart";
import GaugeCard from "../components/charts/GaugeCard";

function CustomerInsights() {

  const { selectedCamera } = useCamera();

  const [analytics, setAnalytics] = useState({
    current_persons: 0,
    total_customers: 0,
    attention_score: 0,
    average_dwell: 0,
    product_interactions: 0,
    last_updated: "",
    system_status: "Online",
    camera_status: "Active",
  });

  useEffect(() => {

    const load = async () => {

      try {

        const { data } = await API.get(
          `/analytics/live/${selectedCamera}`
        );

        setAnalytics(data);

      } catch (err) {

        console.error(err);

      }

    };

    load();

    const timer = setInterval(load, 2000);

    return () => clearInterval(timer);

  }, [selectedCamera]);

  // ======================================================
  // Helper Functions
  // ======================================================

  const getAttentionLevel = () => {

    const score = analytics.attention_score;

    if (score >= 85)
      return {
        text: "Excellent",
        color: "#22C55E",
      };

    if (score >= 70)
      return {
        text: "Good",
        color: "#3B82F6",
      };

    if (score >= 50)
      return {
        text: "Average",
        color: "#F59E0B",
      };

    return {
      text: "Needs Improvement",
      color: "#EF4444",
    };

  };

  const attention = getAttentionLevel();

  // ======================================================
  // JSX
  // ======================================================

  return (

    <div className="heatmap-page">

      {/* ==========================================
          HERO SECTION
      ========================================== */}

      <div className="dwell-header">

        <div className="hero-left">

          <div className="live-badge">

            <FaCheckCircle />

            AI Monitoring Active

          </div>

          <h1>

            👥 Customer Insights Dashboard

          </h1>

          <p>

            Monitor customer engagement, attention,
            dwell behaviour and product interaction
            in real time using Artificial Intelligence.

          </p>

        </div>

        <div className="hero-right">

          <div className="hero-circle">

            <FaRobot />

          </div>

        </div>

      </div>

      {/* ==========================================
          CAMERA
      ========================================== */}

      <CameraSelector />

      {/* ==========================================
          KPI CARDS
      ========================================== */}

      <div className="heatmap-cards">

        <div className="heat-card">

          <FaUsers className="heat-icon" />

          <h2>

            {analytics.current_persons}

          </h2>

          <p>

            Current Customers

          </p>

        </div>

        <div className="heat-card">

          <FaUsers className="heat-icon" />

          <h2>

            {analytics.total_customers}

          </h2>

          <p>

            Total Customers

          </p>

        </div>

        <div className="heat-card">

          <FaChartLine className="heat-icon" />

          <h2>

            {analytics.attention_score}%

          </h2>

          <p>

            Attention Score

          </p>

        </div>

        <div className="heat-card">

          <FaClock className="heat-icon" />

          <h2>

            {analytics.average_dwell}s

          </h2>

          <p>

            Average Dwell

          </p>

        </div>

        <div className="heat-card">

          <FaShoppingBasket className="heat-icon" />

          <h2>

            {analytics.product_interactions}

          </h2>

          <p>

            Product Interactions

          </p>

        </div>

        <div className="heat-card">

          <FaRobot className="heat-icon" />

          <h2
            style={{
              color: attention.color,
            }}
          >

            {attention.text}

          </h2>

          <p>

            AI Engagement Level

          </p>

        </div>

      </div>

      {/* ==========================================
          CHARTS
      ========================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(420px,1fr))",
          gap: "24px",
          marginTop: "30px",
        }}
      >

        <LineAnalyticsChart analytics={analytics} />

        <BarAnalyticsChart analytics={analytics} />

        <PieAnalyticsChart analytics={analytics} />

        <GaugeCard
          value={analytics.attention_score}
        />

      </div>
      {/* ==========================================
          AI INSIGHTS
      ========================================== */}

      <div className="summary-panel">

        <h3>🤖 AI Customer Insights</h3>

        <div className="ai-grid">

          <div className="ai-card">

            <FaUsers className="ai-icon" />

            <h4>Live Customers</h4>

            <h2>{analytics.current_persons}</h2>

            <p>Customers currently inside the store.</p>

          </div>

          <div className="ai-card">

            <FaChartLine className="ai-icon" />

            <h4>Attention Level</h4>

            <h2
              style={{
                color: attention.color,
              }}
            >
              {attention.text}
            </h2>

            <p>
              Current attention score is{" "}
              {analytics.attention_score}%.
            </p>

          </div>

          <div className="ai-card">

            <FaClock className="ai-icon" />

            <h4>Average Stay</h4>

            <h2>{analytics.average_dwell}s</h2>

            <p>
              Average customer dwell time.
            </p>

          </div>

          <div className="ai-card">

            <FaShoppingBasket className="ai-icon" />

            <h4>Product Interactions</h4>

            <h2>
              {analytics.product_interactions}
            </h2>

            <p>
              Products picked or examined.
            </p>

          </div>

        </div>

        {/* ===============================
            AI RECOMMENDATION
        ================================ */}

        <div className="recommendation-card">

          <div className="recommendation-title">

            <FaRobot />

            <h3>AI Recommendation</h3>

          </div>

          <p>

            {analytics.attention_score >= 85
              ? "Excellent customer engagement detected. Continue the existing product placement strategy and maintain current promotional campaigns."

              : analytics.attention_score >= 70
              ? "Customer engagement is good. Introducing additional promotional banners or shelf highlights may further improve attention."

              : analytics.attention_score >= 50
              ? "Customer attention is moderate. Consider reorganizing shelves, improving lighting, and displaying best-selling products in high-visibility areas."

              : "Customer attention is low. AI recommends redesigning shelf layouts, improving signage, optimizing product placement, and increasing promotional visibility to improve engagement."
            }

          </p>

        </div>

        {/* ===============================
            LIVE STATUS PANEL
        ================================ */}

        <div
          className="ai-grid"
          style={{
            marginTop: "30px",
          }}
        >

          <div className="ai-card">

            <h4>System Status</h4>

            <h2
              style={{
                color: "#22C55E",
              }}
            >
              {analytics.system_status || "Online"}
            </h2>

          </div>

          <div className="ai-card">

            <h4>Camera Status</h4>

            <h2
              style={{
                color: "#3B82F6",
              }}
            >
              {analytics.camera_status || "Active"}
            </h2>

          </div>

          <div className="ai-card">

            <h4>Last Updated</h4>

            <h2
              style={{
                fontSize: "18px",
              }}
            >
              {analytics.last_updated || "--"}
            </h2>

          </div>

          <div className="ai-card">

            <h4>AI Confidence</h4>

            <h2
              style={{
                color: "#22C55E",
              }}
            >
              98%
            </h2>

          </div>

        </div>

      </div>

    </div>

  );

}

export default CustomerInsights;