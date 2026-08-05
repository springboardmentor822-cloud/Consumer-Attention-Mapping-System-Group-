// ======================================================
// AIInsights.jsx (Part 1)
// ======================================================
// import "../styles/AIInsightsModern.css";
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
  FaBrain,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

function AIInsightsModern({ data }) {

  if (!data) return null;

  // =====================================================
  // AI Helper Functions
  // =====================================================

  const getAttentionLevel = () => {

    const score = data.attention_score || 0;

    if (score >= 85)
      return {
        text: "Excellent",
        color: "#22C55E",
      };

    if (score >= 70)
      return {
        text: "Good",
        color: "#3B82F6",
      };

    if (score >= 50)
      return {
        text: "Average",
        color: "#F59E0B",
      };

    return {
      text: "Low",
      color: "#EF4444",
    };

  };

  const attention = getAttentionLevel();

  const aiHealth =
    data.system_status === "Running" ||
    data.system_status === "Online"
      ? "Healthy"
      : "Warning";

  const aiHealthColor =
    aiHealth === "Healthy"
      ? "#22C55E"
      : "#EF4444";

  return (

    <div className="ai-panel">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >

        <div>

          <h2
            style={{
              color: "#ffffff",
              marginBottom: "8px",
            }}
          >
            🧠 AI Insights Dashboard
          </h2>

          <p
            style={{
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Live Artificial Intelligence monitoring
            and customer analytics.
          </p>

        </div>

        <div
          style={{
            background: "#1e293b",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#60a5fa",
            fontSize: "30px",
          }}
        >
          <FaBrain />
        </div>

      </div>

      {/* ==========================================
          TOP KPI CARDS
      ========================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(240px,1fr))",
          gap: "18px",
          marginBottom: "30px",
        }}
      >

        <InsightCard
          icon={<FaRobot />}
          title="AI Health"
          value={aiHealth}
          color={aiHealthColor}
        />

        <InsightCard
          icon={<FaCamera />}
          title="Camera Status"
          value={data.camera_status || "Online"}
          color="#3B82F6"
        />

        <InsightCard
          icon={<FaHeartbeat />}
          title="System Status"
          value={data.system_status || "Running"}
          color="#22C55E"
        />

        <InsightCard
          icon={<FaEye />}
          title="Attention Level"
          value={attention.text}
          color={attention.color}
        />

      </div>

      {/* ==========================================
          CUSTOMER ANALYTICS
      ========================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",
          gap: "18px",
        }}
      >

        <InsightCard
          icon={<FaUsers />}
          title="Current Customers"
          value={data.current_persons ?? 0}
          color="#3B82F6"
        />

        <InsightCard
          icon={<FaUsers />}
          title="Total Customers"
          value={data.total_customers ?? 0}
          color="#14B8A6"
        />

        <InsightCard
          icon={<FaClock />}
          title="Average Dwell Time"
          value={`${data.average_dwell ?? 0} sec`}
          color="#8B5CF6"
        />

        <InsightCard
          icon={<FaShoppingCart />}
          title="Product Interactions"
          value={data.product_interactions ?? 0}
          color="#F97316"
        />

        <InsightCard
          icon={<FaChartLine />}
          title="Attention Score"
          value={`${data.attention_score ?? 0}%`}
          color="#F59E0B"
        />

        <InsightCard
          icon={<FaProjectDiagram />}
          title="Tracked Paths"
          value={data.tracked_paths ?? 0}
          color="#06B6D4"
        />
        </div>

      {/* ==========================================
          AI RECOMMENDATION PANEL
      ========================================== */}

      <div
        style={{
          marginTop: "35px",
          background: "#111827",
          borderRadius: "16px",
          padding: "25px",
          border: "1px solid #1f2937",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <FaRobot
            style={{
              color: "#60A5FA",
              fontSize: "24px",
            }}
          />

          <h3
            style={{
              color: "#ffffff",
              margin: 0,
            }}
          >
            AI Recommendation Engine
          </h3>
        </div>

        <p
          style={{
            color: "#cbd5e1",
            lineHeight: "1.8",
          }}
        >
          {data.attention_score >= 85
            ? "Excellent customer engagement detected. Continue the existing store layout because shoppers are interacting well with products."

            : data.attention_score >= 70
            ? "Customer attention is good. Small improvements in promotional displays and shelf organization can further increase engagement."

            : data.attention_score >= 50
            ? "Customer attention is average. AI recommends reorganizing important products to eye-level shelves and improving aisle visibility."

            : "Customer attention is low. AI recommends redesigning shelf layouts, improving lighting, optimizing product placement, and displaying promotional banners in high-traffic areas."}
        </p>
      </div>

      {/* ==========================================
          LIVE PROCESSING SUMMARY
      ========================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(240px,1fr))",
          gap: "18px",
          marginTop: "30px",
        }}
      >
        <InsightCard
          icon={<FaSyncAlt />}
          title="Engagement Level"
          value={data.engagement_level || attention.text}
          color="#6366F1"
        />

        <InsightCard
          icon={<FaCheckCircle />}
          title="AI Confidence"
          value="98%"
          color="#22C55E"
        />

        <InsightCard
          icon={<FaHistory />}
          title="Last Updated"
          value={
            data.last_updated &&
            !isNaN(Date.parse(data.last_updated))
                ? new Date(data.last_updated).toLocaleString()
                : "Live"
          }
          color="#14B8A6"
        />

        <InsightCard
          icon={
            aiHealth === "Healthy"
              ? <FaCheckCircle />
              : <FaExclamationTriangle />
          }
          title="Model Status"
          value={aiHealth}
          color={aiHealthColor}
        />
      </div>

    </div>

  );

}

/* =====================================================
   REUSABLE INSIGHT CARD
===================================================== */

function InsightCard({
  icon,
  title,
  value,
  color,
}) {

  return (

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: "#111827",
        borderRadius: "14px",
        padding: "18px",
        borderLeft: `5px solid ${color}`,
        boxShadow:
          "0 10px 25px rgba(0,0,0,0.25)",
        transition: "0.3s",
      }}
    >

      <div
        style={{
          color,
          fontSize: "26px",
          minWidth: "34px",
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>

        <h4
          style={{
            margin: 0,
            color: "#94A3B8",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {title}
        </h4>

        <p
          style={{
            marginTop: "8px",
            marginBottom: 0,
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "18px",
            wordBreak: "break-word",
          }}
        >
          {value}
        </p>

      </div>

    </div>

  );

}

export default AIInsightsModern;