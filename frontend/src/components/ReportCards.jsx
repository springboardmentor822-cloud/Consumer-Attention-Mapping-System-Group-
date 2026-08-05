import {
  FaUsers,
  FaVideo,
  FaCalendarAlt,
  FaWalking,
  FaEye,
  FaFire,
  FaShoppingBasket,
  FaClock,
  FaRoute,
  FaRobot,
  FaChartLine,
} from "react-icons/fa";

function ReportCards({ data }) {

  if (!data) return null;

  const reports = [
    {
      title: "Selected Camera",
      value: `Camera ${data.selectedCamera ?? 1}`,
      icon: <FaVideo />,
      color: "#2563eb",
    },

    {
      title: "Current Persons",
      value: data.current_persons ?? 0,
      icon: <FaUsers />,
      color: "#22c55e",
    },

    {
      title: "Total Customers",
      value: data.total_customers ?? 0,
      icon: <FaWalking />,
      color: "#3b82f6",
    },

    {
      title: "Attention Score",
      value: `${data.attention_score ?? 0}%`,
      icon: <FaEye />,
      color: "#f59e0b",
    },

    {
      title: "Average Dwell",
      value: `${data.average_dwell ?? 0}s`,
      icon: <FaClock />,
      color: "#8b5cf6",
    },

    {
      title: "Product Interactions",
      value: data.product_interactions ?? 0,
      icon: <FaShoppingBasket />,
      color: "#ec4899",
    },

    {
      title: "Tracked Paths",
      value: data.tracked_paths ?? 0,
      icon: <FaRoute />,
      color: "#14b8a6",
    },

    {
      title: "Heatmap Points",
      value: data.heatmap_points ?? 0,
      icon: <FaFire />,
      color: "#ef4444",
    },

    {
      title: "Engagement Level",
      value: data.engagement_level ?? "Normal",
      icon: <FaChartLine />,
      color: "#0ea5e9",
    },

    {
      title: "AI Status",
      value: data.system_status ?? "Running",
      icon: <FaRobot />,
      color: "#6366f1",
    },

    {
      title: "Camera Status",
      value: data.camera_status ?? "Online",
      icon: <FaVideo />,
      color: "#10b981",
    },

    {
      title: "Generated",
      value: new Date().toLocaleString(),
      icon: <FaCalendarAlt />,
      color: "#06b6d4",
    },
  ];

  return (
    <div className="report-grid">
      {reports.map((item, index) => (
        <div
          key={index}
          className="report-card"
        >
          <div
            className="report-icon"
            style={{
              background: item.color,
            }}
          >
            {item.icon}
          </div>

          <div>
            <h2>{item.value}</h2>
            <p>{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReportCards;