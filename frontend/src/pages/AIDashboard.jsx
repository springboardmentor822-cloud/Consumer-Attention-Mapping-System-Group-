import { useEffect, useState } from "react";
import API from "../services/api";
import { getAIDashboard } from "../services/aiDashboardService";

import AICards from "../components/AICards";
import AnalyticsCharts from "../components/AnalyticsCharts";
import EmotionPanel from "../components/EmotionPanel";
import AttentionPanel from "../components/AttentionPanel";
import AIInsights from "../components/AIInsights";
import CameraSelector from "../components/CameraSelector";

import { useCamera } from "../context/CameraContext";

import "../styles/Analytics.css";

function AIDashboard() {
  const { selectedCamera } = useCamera();

  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(() => {
      loadDashboard();
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedCamera]);

  const loadDashboard = async () => {
    try {
      const dashboard = await getAIDashboard();

      const { data: live } = await API.get(
        `/analytics/live/${selectedCamera}`
      );

      const mergedData = {
        ...dashboard,
        ...live,

        selectedCamera,

        attention_score:
          live.attention_score ??
          dashboard.attention_score ??
          0,

        average_attention:
          live.attention_score ??
          dashboard.average_attention ??
          0,

        average_dwell:
          live.average_dwell ??
          dashboard.average_dwell ??
          0,

        average_dwell_time:
          live.average_dwell ??
          dashboard.average_dwell_time ??
          0,

        current_persons:
          live.current_persons ?? 0,

        total_customers:
          live.total_customers ?? 0,

        product_interactions:
          live.product_interactions ?? 0,

        products_detected:
          live.products_detected ??
          dashboard.products_detected ??
          0,

        tracked_paths:
          live.tracked_paths ??
          dashboard.tracked_paths ??
          0,

        heatmap_points:
          live.heatmap_points ??
          dashboard.heatmap_points ??
          0,

        camera_status:
          live.camera_status ??
          dashboard.camera_status ??
          "Online",

        system_status:
          live.system_status ??
          dashboard.system_status ??
          "Running",

        engagement_level:
          live.engagement_level ??
          dashboard.engagement_level ??
          "Normal",

        customer_flow:
          live.customer_flow ??
          dashboard.customer_flow ??
          "Normal",

        shopping_behavior:
          live.shopping_behavior ??
          dashboard.shopping_behavior ??
          "Browsing",

        ai_recommendation:
          live.ai_recommendation ??
          dashboard.ai_recommendation ??
          "No recommendation available",

        last_updated:
          live.last_updated ??
          dashboard.last_updated,
      };

      setDashboardData(mergedData);
    } catch (error) {
      console.error(error);
    }
  };

  if (!dashboardData) {
    return (
      <div
        style={{
          color: "white",
          padding: "40px",
          fontSize: "22px",
        }}
      >
        Loading AI Dashboard...
      </div>
    );
  }

  return (
    <div className="analytics-page">

      <h1 className="analytics-title">
        🤖 AI Consumer Attention Dashboard
      </h1>

      <p
        style={{
          color: "#cbd5e1",
          marginBottom: "20px",
        }}
      >
        AI-powered retail intelligence, visitor analytics,
        customer behaviour analysis, attention tracking and
        live monitoring.
      </p>

      <CameraSelector />

      <AICards data={dashboardData} />

      <AnalyticsCharts data={dashboardData} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "25px",
          marginTop: "30px",
        }}
      >
      

        <AttentionPanel
          data={dashboardData}
        />

        <AIInsights
          data={dashboardData}
        />
      </div>

    </div>
  );
}

export default AIDashboard;