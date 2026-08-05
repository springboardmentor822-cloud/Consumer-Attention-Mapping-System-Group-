import { useEffect, useState } from "react";
import API from "../services/api";
import { useCamera } from "../context/CameraContext";
import CameraSelector from "../components/CameraSelector";

import {
  FaShoppingBasket,
  FaChartLine,
  FaUsers,
  FaClock,
} from "react-icons/fa";

import LineAnalyticsChart from "../components/charts/LineAnalyticsChart";
import BarAnalyticsChart from "../components/charts/BarAnalyticsChart";
import PieAnalyticsChart from "../components/charts/PieAnalyticsChart";
import GaugeCard from "../components/charts/GaugeCard";

function ProductPerformance() {
  const { selectedCamera } = useCamera();

  const [analytics, setAnalytics] = useState({
    product_interactions: 0,
    attention_score: 0,
    current_persons: 0,
    total_customers: 0,
    average_dwell: 0,
    last_updated: "",
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await API.get(`/analytics/live/${selectedCamera}`);
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    fetchAnalytics();
    const timer = setInterval(fetchAnalytics, 2000);

    return () => clearInterval(timer);
  }, [selectedCamera]);

  return (
    <div className="heatmap-page">

      <div className="heatmap-header">
        <div>
          <h1>🛒 Product Performance</h1>
          <p>Monitor customer interactions with products in real time.</p>
        </div>
      </div>

      <CameraSelector />

      <div className="heatmap-cards">

        <div className="heat-card">
          <FaShoppingBasket className="heat-icon" />
          <h2>{analytics.product_interactions}</h2>
          <p>Product Interactions</p>
        </div>

        <div className="heat-card">
          <FaChartLine className="heat-icon" />
          <h2>{analytics.attention_score}%</h2>
          <p>Attention Score</p>
        </div>

        <div className="heat-card">
          <FaUsers className="heat-icon" />
          <h2>{analytics.current_persons}</h2>
          <p>Current Customers</p>
        </div>

        <div className="heat-card">
          <FaUsers className="heat-icon" />
          <h2>{analytics.total_customers}</h2>
          <p>Total Customers</p>
        </div>

        <div className="heat-card">
          <FaClock className="heat-icon" />
          <h2>{analytics.average_dwell}s</h2>
          <p>Average Dwell Time</p>
        </div>

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
          gap: "24px",
          marginTop: "30px",
        }}
      >
        <LineAnalyticsChart analytics={analytics} />
        <BarAnalyticsChart analytics={analytics} />
        <PieAnalyticsChart analytics={analytics} />
        <GaugeCard value={analytics.attention_score} />
      </div>

      <div className="summary-panel" style={{ marginTop: "30px" }}>
        <h3>AI Product Insights</h3>

        <ul>
          <li>Higher product interactions indicate stronger customer engagement.</li>
          <li>Compare attention score with product interactions to optimize shelf placement.</li>
          <li>Monitor dwell time alongside interactions for merchandising decisions.</li>
          <li>Use live analytics to identify peak shopping periods.</li>
        </ul>

        <p style={{ marginTop: "20px", color: "#94a3b8" }}>
          Last Updated: {analytics.last_updated || "Live"}
        </p>
      </div>

    </div>
  );
}

export default ProductPerformance;