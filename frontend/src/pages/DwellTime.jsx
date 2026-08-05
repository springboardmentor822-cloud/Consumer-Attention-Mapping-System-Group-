import { useEffect, useState } from "react";
import API from "../services/api";
import { useCamera } from "../context/CameraContext";
import CameraSelector from "../components/CameraSelector";

// Dwell Components
import DwellKPICards from "../components/dwell/DwellKPICards";
import DwellHistogram from "../components/dwell/DwellHistogram";
import DwellAreaChart from "../components/dwell/DwellAreaChart";
import DwellHeatTimeline from "../components/dwell/DwellHeatTimeline";
import DwellBoxPlot from "../components/dwell/DwellBoxPlot";
import DwellAIInsights from "../components/dwell/DwellAIInsights";

import "../styles/DwellTime.css";

function DwellTime() {
  const { selectedCamera } = useCamera();

  const [analytics, setAnalytics] = useState({
    current_persons: 0,
    total_customers: 0,
    average_dwell: 0,
    attention_score: 0,
    product_interactions: 0,
    last_updated: "",
    system_status: "Online",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 2000);

    return () => clearInterval(interval);

    // eslint-disable-next-line
  }, [selectedCamera]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await API.get(
        `/analytics/live/${selectedCamera}`
      );
      console.log(JSON.stringify(data, null, 2));

      setAnalytics(data);
      setLoading(false);
    } catch (error) {
      console.error("Analytics Error:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dwell-loading">
        Loading Dwell Time Dashboard...
      </div>
    );
  }

  return (
    <div className="dwell-page">

      {/* Header */}

      <div className="dwell-header">

        <div>

            <div className="hero-left">

            <h1>⏱ AI Dwell Time Analytics</h1>

            <p>
            Real-time customer stay monitoring powered by AI.
            Track engagement, dwell duration and customer behaviour.
            </p>

            </div>

            <div className="hero-right">

            <div className="live-badge">
            🟢 LIVE
            </div>

            <div className="camera-box">
            <CameraSelector/>
            </div>

            </div>

        </div>

        <CameraSelector />

      </div>

      {/* KPI Cards */}

      <DwellKPICards analytics={analytics} />

      {/* Graph Section */}

    <div className="dwell-grid">

    {/* Histogram */}
    <div className="chart-card">
        <DwellHistogram analytics={analytics} />
    </div>

    {/* Area Chart */}
    <div className="chart-card">
        <DwellAreaChart analytics={analytics} />
    </div>

    {/* Heat Timeline */}
    <div className="chart-card">
        <DwellHeatTimeline analytics={analytics} />
    </div>

    {/* Box Plot */}
    <div className="chart-card">
        <DwellBoxPlot analytics={analytics} />
    </div>

    </div>

    {/* AI Insights */}

    <div className="chart-card full-width-card">
    <DwellAIInsights analytics={analytics} />
    </div>

      {/* Footer */}

      <div className="dwell-footer">

        <span>

          Last Updated :

          {" "}

          {analytics.last_updated || "Live"}

        </span>

      </div>

    </div>
  );
}

export default DwellTime;