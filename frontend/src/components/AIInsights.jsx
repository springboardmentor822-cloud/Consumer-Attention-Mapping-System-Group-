import {
  FaUsers,
  FaEye,
  FaClock,
  FaShoppingCart,
  FaProjectDiagram,
  FaChartLine,
  FaCamera,
  FaHeartbeat,
  FaRobot,
  FaSyncAlt,
  FaHistory,
} from "react-icons/fa";

function AIInsights({ data }) {
  if (!data) return null;

  return (
    <div className="ai-panel">
      <h2
        style={{
          marginBottom: "20px",
          color: "#ffffff",
        }}
      >
        🧠 AI Insights
      </h2>

      <div
        style={{
          display: "grid",
          gap: "15px",
        }}
      >
        <InsightCard
          icon={<FaUsers />}
          title="Current Persons"
          value={data.current_persons ?? 0}
          color="#3b82f6"
        />

        <InsightCard
          icon={<FaUsers />}
          title="Total Customers"
          value={data.total_customers ?? 0}
          color="#14b8a6"
        />

        <InsightCard
          icon={<FaEye />}
          title="Attention Score"
          value={`${data.attention_score ?? 0}%`}
          color="#f59e0b"
        />

        <InsightCard
          icon={<FaClock />}
          title="Average Dwell Time"
          value={`${data.average_dwell ?? 0} sec`}
          color="#8b5cf6"
        />

        <InsightCard
          icon={<FaShoppingCart />}
          title="Product Interactions"
          value={data.product_interactions ?? 0}
          color="#f97316"
        />

        <InsightCard
          icon={<FaProjectDiagram />}
          title="Tracked Paths"
          value={data.tracked_paths ?? 0}
          color="#06b6d4"
        />

        <InsightCard
          icon={<FaChartLine />}
          title="Store Congestion"
          value={data.store_congestion ?? "Low"}
          color="#22c55e"
        />

        <InsightCard
          icon={<FaCamera />}
          title="Camera Status"
          value={data.camera_status ?? "Online"}
          color="#10b981"
        />

        <InsightCard
          icon={<FaHeartbeat />}
          title="System Status"
          value={data.system_status ?? "Running"}
          color="#ef4444"
        />

        <InsightCard
          icon={<FaRobot />}
          title="AI Recommendation"
          value={
            data.ai_recommendation ??
            "Customer activity is being monitored."
          }
          color="#ec4899"
          multiline
        />

        <InsightCard
          icon={<FaSyncAlt />}
          title="Engagement Level"
          value={data.engagement_level ?? "Normal"}
          color="#6366f1"
        />

        <InsightCard
          icon={<FaHistory />}
          title="Last Updated"
          value={
            data.last_updated
              ? new Date(data.last_updated).toLocaleString()
              : "-"
          }
          color="#14b8a6"
        />
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  value,
  color,
  multiline = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: multiline ? "flex-start" : "center",
        gap: "15px",
        background: "#111827",
        padding: "15px",
        borderRadius: "12px",
        borderLeft: `5px solid ${color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          color,
          fontSize: "24px",
          minWidth: "30px",
          marginTop: multiline ? "5px" : "0px",
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <h4
          style={{
            color: "#94a3b8",
            margin: 0,
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {title}
        </h4>

        <p
          style={{
            color: "#ffffff",
            margin: "6px 0 0",
            fontWeight: "bold",
            fontSize: "16px",
            lineHeight: multiline ? "1.5" : "normal",
            wordBreak: "break-word",
            whiteSpace: multiline ? "normal" : "nowrap",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default AIInsights;