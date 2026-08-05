import {
  FaUsers,
  FaCamera,
  FaEye,
  FaClock,
  FaWalking,
  FaShoppingBasket,
  FaProjectDiagram,
  FaMapMarkedAlt,
  FaRobot,
} from "react-icons/fa";

function AICards({ data }) {
  if (!data) return null;

  const cards = [
    {
      title: "Current Persons",
      value: data.current_persons ?? 0,
      icon: <FaWalking />,
      color: "#2563eb",
    },

    {
      title: "Total Customers",
      value: data.total_customers ?? 0,
      icon: <FaUsers />,
      color: "#06b6d4",
    },

    {
      title: "Active Cameras",
      value: data.active_cameras ?? 1,
      icon: <FaCamera />,
      color: "#22c55e",
    },

    {
      title: "Attention Score",
      value: `${data.attention_score ?? data.average_attention ?? 0}%`,
      icon: <FaEye />,
      color: "#f59e0b",
    },

    {
      title: "Average Dwell",
      value: `${data.average_dwell ?? data.average_dwell_time ?? 0}s`,
      icon: <FaClock />,
      color: "#8b5cf6",
    },

    {
      title: "Product Interactions",
      value: data.product_interactions ?? 0,
      icon: <FaShoppingBasket />,
      color: "#f97316",
    },

    {
      title: "Tracked Paths",
      value: data.tracked_paths ?? 0,
      icon: <FaProjectDiagram />,
      color: "#14b8a6",
    },

    {
      title: "Heatmap Points",
      value: data.heatmap_points ?? 0,
      icon: <FaMapMarkedAlt />,
      color: "#e11d48",
    },

    {
      title: "AI Status",
      value: data.system_status ?? "Running",
      icon: <FaRobot />,
      color: "#6366f1",
    },
  ];

  return (
    <div className="analytics-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className="analytics-card"
        >
          <div
            className="analytics-icon"
            style={{
              background: card.color,
            }}
          >
            {card.icon}
          </div>

          <div>
            <h3>{card.value}</h3>
            <p>{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AICards;