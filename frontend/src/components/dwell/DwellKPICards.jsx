import React from "react";
import {
  FaClock,
  FaUsers,
  FaBullseye,
  FaCheckCircle,
} from "react-icons/fa";

const DwellKPICards = ({ analytics }) => {
  const cards = [
    {
      title: "Average Dwell Time",
      value: `${Number(analytics.average_dwell || 0)}s`,
      icon: <FaClock />,
      color: "#3B82F6",
      bg: "#DBEAFE",
    },
    {
      title: "Active Customers",
      value: analytics.current_persons || 0,
      icon: <FaUsers />,
      color: "#8B5CF6",
      bg: "#EDE9FE",
    },
    {
      title: "Attention Score",
      value: `${analytics.attention_score || 0}%`,
      icon: <FaBullseye />,
      color: "#10B981",
      bg: "#DCFCE7",
    },
    {
      title: "System Status",
      value: analytics.system_status || "Online",
      icon: <FaCheckCircle />,
      color: "#F59E0B",
      bg: "#FEF3C7",
    },
  ];

  return (
    <div className="dwell-kpi-grid">
      {cards.map((card, index) => (
        <div
          className="dwell-kpi-card"
          key={index}
          style={{
            borderTop: `4px solid ${card.color}`,
          }}
        >
          <div
            className="dwell-kpi-icon"
            style={{
              background: card.bg,
              color: card.color,
            }}
          >
            {card.icon}
          </div>

          <div className="dwell-kpi-content">
            <h2>{card.value}</h2>
            <p>{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DwellKPICards;