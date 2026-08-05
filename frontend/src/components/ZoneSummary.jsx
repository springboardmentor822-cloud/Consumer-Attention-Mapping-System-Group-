import { useEffect, useState } from "react";
import {
  FaExchangeAlt,
  FaMapMarkerAlt,
  FaArrowDown,
  FaRoute,
  FaLightbulb,
} from "react-icons/fa";

import { getZoneTransition } from "../services/analyticsService";

export default function ZoneSummary({ cameraId }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, [cameraId]);

  async function loadData() {
    try {
      const response = await getZoneTransition(cameraId);

      setSummary(response.zone_transition);
    } catch (err) {
      console.error(err);
    }
  }

  if (!summary) {
    return (
      <div className="summary-grid">
        Loading...
      </div>
    );
  }

  const cards = [
    {
      icon: <FaExchangeAlt />,
      title: "Total Transitions",
      value: summary.total_transitions,
      color: "#3B82F6",
    },
    {
      icon: <FaMapMarkerAlt />,
      title: "Most Visited Zone",
      value: summary.most_visited_zone,
      color: "#22C55E",
    },
    {
      icon: <FaArrowDown />,
      title: "Least Visited Zone",
      value: summary.least_visited_zone,
      color: "#F59E0B",
    },
    {
      icon: <FaRoute />,
      title: "Most Common Route",
      value: summary.most_common_transition,
      color: "#8B5CF6",
    },
    {
      icon: <FaLightbulb />,
      title: "AI Recommendation",
      value:
        summary.ai_insights?.length > 0
          ? summary.ai_insights[0]
          : "No recommendation",
      color: "#06B6D4",
    },
  ];

  return (
    <div className="summary-grid">
      {cards.map((card, index) => (
        <div
          className="summary-card"
          key={index}
        >
          <div
            className="summary-icon"
            style={{
              background: card.color,
            }}
          >
            {card.icon}
          </div>

          <div className="summary-content">
            <div className="summary-title">
              {card.title}
            </div>

            <div className="summary-value">
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}