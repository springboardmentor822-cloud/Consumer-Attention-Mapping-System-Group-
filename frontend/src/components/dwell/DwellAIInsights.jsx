import React from "react";
import {
  FaRobot,
  FaArrowUp,
  FaClock,
  FaLightbulb,
  FaChartLine,
} from "react-icons/fa";

const DwellAIInsights = ({ analytics }) => {
  const average = Number(analytics.average_dwell || 0);
  const customers = Number(analytics.current_persons || 0);

  let engagement = "Low";
  let recommendation =
    "Improve product placement to encourage customers to stay longer.";

  if (average >= 30) {
    engagement = "Moderate";
    recommendation =
      "Customers are spending a reasonable amount of time. Continue monitoring peak hours.";
  }

  if (average >= 60) {
    engagement = "High";
    recommendation =
      "Excellent engagement. Consider placing premium products in high-attention areas.";
  }

  return (
    <div className="dwell-chart-container">

      <div className="chart-header">
        <h3>
          <FaRobot />
          AI Dwell Insights
        </h3>

        <p>
          AI generated recommendations based on live analytics
        </p>
      </div>

      <div className="ai-grid">

        <div className="ai-card">

          <FaClock className="ai-icon" />

          <h4>Average Stay</h4>

          <h2>{average}s</h2>

        </div>

        <div className="ai-card">

          <FaChartLine className="ai-icon" />

          <h4>Engagement</h4>

          <h2>{engagement}</h2>

        </div>

        <div className="ai-card">

          <FaArrowUp className="ai-icon" />

          <h4>Customers</h4>

          <h2>{customers}</h2>

        </div>

      </div>

      <div className="recommendation-card">

        <div className="recommendation-title">

          <FaLightbulb />

          <h3>AI Recommendation</h3>

        </div>

        <p>{recommendation}</p>

      </div>

    </div>
  );
};

export default DwellAIInsights;