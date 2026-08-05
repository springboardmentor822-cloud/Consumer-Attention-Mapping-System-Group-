import {
  FaFire,
  FaUsers,
  FaUserFriends,
  FaBullseye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

function CustomerHeatmap({ data }) {
  if (!data) return null;

  const analytics = [
    {
      title: "Heatmap Points",
      value: data.heatmap_points ?? 0,
      icon: <FaFire />,
      color: "#ef4444",
    },
    {
      title: "Current Persons",
      value: data.current_persons ?? 0,
      icon: <FaUsers />,
      color: "#3b82f6",
    },
    {
      title: "Total Customers",
      value: data.total_customers ?? 0,
      icon: <FaUserFriends />,
      color: "#22c55e",
    },
    {
      title: "Attention Score",
      value: `${data.attention_score ?? 0}%`,
      icon: <FaBullseye />,
      color: "#f59e0b",
    },
    {
      title: "Average Dwell",
      value: `${data.average_dwell ?? 0}s`,
      icon: <FaClock />,
      color: "#8b5cf6",
    },
    {
      title: "Heatmap Status",
      value: data.heatmap_active ? "ACTIVE" : "OFF",
      icon: data.heatmap_active ? (
        <FaCheckCircle />
      ) : (
        <FaTimesCircle />
      ),
      color: data.heatmap_active ? "#10b981" : "#ef4444",
    },
  ];

  return (
    <div className="dashboard-card">
      <h2
        style={{
          color: "#fff",
          marginBottom: 6,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        Customer Attention Analytics
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: 25,
        }}
      >
        Live AI customer behaviour statistics
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20,
        }}
      >
        {analytics.map((item, index) => (
          <div
            key={index}
            style={{
              background: "#1f2937",
              borderLeft: `6px solid ${item.color}`,
              borderRadius: 16,
              padding: 20,
              color: "#fff",
              transition: "0.3s",
              minHeight: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                fontSize: 26,
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            <div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 14,
                  marginTop: 18,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  marginTop: 8,
                }}
              >
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomerHeatmap;