import {
  FaUserCheck,
  FaShoppingBasket,
  FaFire,
  FaVideo,
  FaClock,
  FaRobot,
  FaUsers,
} from "react-icons/fa";

function RecentActivity({ data }) {
  if (!data) return null;

  const formatDate = (date) => {
    if (!date) return "--";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "--";
    }
  };

  const activities = [
    {
      icon: <FaUsers />,
      title: "Current Persons",
      message: `${data.current_persons ?? 0} persons currently visible`,
      color: "#8b5cf6",
    },
    {
      icon: <FaUserCheck />,
      title: "Customer Tracking",
      message: `${data.total_customers ?? 0} total customers detected`,
      color: "#22c55e",
    },
    {
      icon: <FaShoppingBasket />,
      title: "Product Interaction",
      message: `${data.product_interactions ?? 0} product interactions`,
      color: "#3b82f6",
    },
    {
      icon: <FaFire />,
      title: "Attention Score",
      message: `${data.attention_score ?? 0}% attention score`,
      color: "#f59e0b",
    },
    {
      icon: <FaFire />,
      title: "Heatmap",
      message: data.heatmap_active
        ? "Heatmap generation active"
        : "Heatmap disabled",
      color: "#ef4444",
    },
    {
      icon: <FaVideo />,
      title: "Camera Status",
      message: data.camera_status || "Offline",
      color: "#06b6d4",
    },
    {
      icon: <FaRobot />,
      title: "AI Engine",
      message: data.system_status || "Running",
      color: "#10b981",
    },
    {
      icon: <FaClock />,
      title: "Last Updated",
      message: formatDate(data.last_updated),
      color: "#f97316",
    },
  ];

  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 18,
        padding: 22,
        color: "#ffffff",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
      }}
    >
      <h2
        style={{
          marginBottom: 6,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        Recent Activity
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: 22,
          fontSize: 14,
        }}
      >
        Live AI monitoring events
      </p>

      {activities.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "16px 0",
            borderBottom:
              index !== activities.length - 1
                ? "1px solid #374151"
                : "none",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `${item.color}20`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: item.color,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {item.icon}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#ffffff",
                marginBottom: 4,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: 14,
              }}
            >
              {item.message}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecentActivity;