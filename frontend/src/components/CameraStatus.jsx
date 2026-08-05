import {
  FaVideo,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaWalking,
  FaClock,
  FaFire,
  FaRobot,
} from "react-icons/fa";

function CameraStatus({ data }) {
  if (!data) return null;

  const formatDwell = (seconds) => {
    const total = Number(seconds) || 0;

    if (total < 60) return `${total}s`;

    const mins = Math.floor(total / 60);
    const secs = total % 60;

    return `${mins}m ${secs}s`;
  };

  const cards = [
    {
      title: "Camera Status",
      value: data.camera_status || "Offline",
      icon:
        data.camera_status === "Online" ? (
          <FaVideo />
        ) : (
          <FaTimesCircle />
        ),
      color:
        data.camera_status === "Online"
          ? "#22c55e"
          : "#ef4444",
    },

    {
      title: "AI Engine",
      value: data.system_status || "Running",
      icon: <FaRobot />,
      color: "#3b82f6",
    },

    {
      title: "Current Persons",
      value: data.current_persons ?? 0,
      icon: <FaUsers />,
      color: "#8b5cf6",
    },

    {
      title: "Total Customers",
      value: data.total_customers ?? 0,
      icon: <FaWalking />,
      color: "#06b6d4",
    },

    {
      title: "Average Dwell",
      value: formatDwell(data.average_dwell),
      icon: <FaClock />,
      color: "#f59e0b",
    },

    {
      title: "Heatmap",
      value: data.heatmap_active ? "ACTIVE" : "OFF",
      icon: data.heatmap_active ? (
        <FaCheckCircle />
      ) : (
        <FaFire />
      ),
      color: data.heatmap_active
        ? "#22c55e"
        : "#ef4444",
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
        Camera & AI Status
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: 22,
          fontSize: 14,
        }}
      >
        Live monitoring status
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
        }}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            style={{
              background: "#1f2937",
              borderLeft: `5px solid ${card.color}`,
              borderRadius: 14,
              padding: 18,
              display: "flex",
              alignItems: "center",
              gap: 15,
              transition: "0.3s",
            }}
          >
            <div
              style={{
                width: 55,
                height: 55,
                borderRadius: "50%",
                background: `${card.color}20`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: card.color,
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 13,
                  marginBottom: 5,
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  color: "#ffffff",
                }}
              >
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CameraStatus;