import {
  FaFire,
  FaMapMarkedAlt,
  FaChartArea,
  FaBullseye,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

function HeatmapPanel({ data, cameraId = 1 }) {

  if (!data) return null;

  return (

    <div className="ai-panel">

      <h2>🔥 Customer Heatmap Analytics</h2>

      {/* ========================= */}
      {/* Live Heatmap */}
      {/* ========================= */}

      <div
        style={{
          marginTop: "20px",
          marginBottom: "25px",
        }}
      >

        <img
          src={`http://127.0.0.1:8000/video/heatmap/${cameraId}`}
          alt={`Heatmap Camera ${cameraId}`}
          style={{
            width: "100%",
            borderRadius: "12px",
            border: "2px solid #374151",
            objectFit: "cover",
            background: "#111827",
          }}
        />

      </div>

      {/* ========================= */}
      {/* Statistics */}
      {/* ========================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: "15px",
          marginBottom: "25px",
        }}
      >

        <Card
          title="Heatmap"
          value={data.heatmap_active ? "ACTIVE" : "OFF"}
          icon={<FaFire />}
          color={data.heatmap_active ? "#22c55e" : "#ef4444"}
        />

        <Card
          title="Heat Points"
          value={data.heatmap_points ?? 0}
          icon={<FaChartArea />}
          color="#f97316"
        />

        <Card
          title="Hotspots"
          value={data.hotspots ?? 0}
          icon={<FaMapMarkedAlt />}
          color="#8b5cf6"
        />

        <Card
          title="Peak Zone"
          value={data.peak_zone ?? "N/A"}
          icon={<FaBullseye />}
          color="#3b82f6"
        />

      </div>

      {/* ========================= */}
      {/* Status */}
      {/* ========================= */}

      <div
        style={{
          background: "#111827",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          color: "white",
        }}
      >

        <p>

          {data.heatmap_active ? (
            <FaCheckCircle color="#22c55e" />
          ) : (
            <FaTimesCircle color="#ef4444" />
          )}

          <strong style={{ marginLeft: "10px" }}>
            Heatmap Status
          </strong>

        </p>

        <p style={{ marginTop: "15px" }}>
          Camera :
          <strong> {cameraId}</strong>
        </p>

        <p style={{ marginTop: "10px" }}>
          Most Visited Area :
          <strong> {data.peak_zone ?? "N/A"}</strong>
        </p>

        <p style={{ marginTop: "10px" }}>
          Total Heat Points :
          <strong> {data.heatmap_points ?? 0}</strong>
        </p>

        <p style={{ marginTop: "10px" }}>
          Hotspots Detected :
          <strong> {data.hotspots ?? 0}</strong>
        </p>

      </div>

      {/* ========================= */}
      {/* Information */}
      {/* ========================= */}

      <p
        style={{
          color: "#cbd5e1",
          textAlign: "center",
          fontSize: "14px",
        }}
      >

        Live heatmap generated from YOLOv8 + ByteTrack customer tracking for
        Camera {cameraId}. Heatmap statistics update automatically based on
        customer movement.

      </p>

    </div>

  );

}

function Card({
  title,
  value,
  icon,
  color,
}) {

  return (

    <div
      style={{
        background: "#111827",
        border: `2px solid ${color}`,
        borderRadius: "12px",
        padding: "18px",
        textAlign: "center",
        color: "white",
      }}
    >

      <div
        style={{
          fontSize: "28px",
          color,
          marginBottom: "10px",
        }}
      >
        {icon}
      </div>

      <h4>{title}</h4>

      <h2
        style={{
          color,
        }}
      >
        {value}
      </h2>

    </div>

  );

}

export default HeatmapPanel;