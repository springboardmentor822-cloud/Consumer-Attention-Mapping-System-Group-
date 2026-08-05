import { useEffect, useState } from "react";
import API from "../services/api";

import {
  FaFire,
  FaUsers,
  FaMapMarkedAlt,
  FaClock,
  FaShoppingBasket,
  FaEye,
  FaVideo,
  FaCircle,
} from "react-icons/fa";

import CameraSelector from "../components/CameraSelector";
import { useCamera } from "../context/CameraContext";

import "../styles/Heatmap.css";

function Heatmap() {
  const { selectedCamera } = useCamera();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    current_persons: 0,
    total_customers: 0,
    heatmap_points: 0,
    tracked_paths: 0,
    product_interactions: 0,
    average_dwell: 0,
    attention_score: 0,
    camera_status: "Online",
    system_status: "Running",
    last_updated: "",
  });

  const cameras = [
    {
      id: 1,
      name: "Camera 1",
    },
    {
      id: 2,
      name: "Camera 2",
    },
  ];

  const loadHeatmap = async () => {
    try {
      setLoading(true);

      const { data: response } = await API.get(
    `/analytics/live/${selectedCamera}`
      );

      console.log(response);

      setData({
        current_persons:
        response.current_persons ?? 0,

        total_customers:
          response.total_customers ?? 0,

        heatmap_points:
          response.heatmap_points ?? 0,

        tracked_paths:
          response.tracked_paths ?? 0,

        product_interactions:
          response.product_interactions ?? 0,

        average_dwell:
          response.average_dwell ?? 0,

        attention_score:
          response.attention_score ?? 0,

        camera_status:
          response.camera_status || "Online",

        system_status:
          response.system_status || "Running",

        last_updated:
          response.last_updated || "",
      });

    } catch (error) {

      console.error(
        "Heatmap API Error:",
        error
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    loadHeatmap();

    const interval = setInterval(() => {

      loadHeatmap();

    }, 2000);

    return () => clearInterval(interval);

  }, [selectedCamera]);

  const formatTime = (time) => {

    if (!time) return "--";

    const date = new Date(time);

    if (Number.isNaN(date.getTime()))
      return "--";

    return date.toLocaleTimeString();

  };

  const formatDwell = (seconds) => {

    seconds = Number(seconds);

    if (Number.isNaN(seconds))
      return "0s";

    if (seconds < 60)
      return `${seconds}s`;

    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins}m ${secs}s`;

  };

  return (
        <div className="heatmap-page">

      {/* ================= HEADER ================= */}

      <div className="heatmap-header">

        <div>

          <h1 className="heatmap-title">
            🔥 AI Heatmap Dashboard
          </h1>

          <p className="heatmap-subtitle">
            Live Customer Heatmap Analytics
          </p>

        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >

          <div
            style={{
              background: "#16a34a20",
              color: "#22c55e",
              padding: "8px 14px",
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            AI {data.system_status}
          </div>

          <div
            style={{
              background: "#2563eb20",
              color: "#60a5fa",
              padding: "8px 14px",
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Camera {selectedCamera}
          </div>

        </div>

      </div>

      <CameraSelector />

      {/* ================= KPI CARDS ================= */}

      <div className="heatmap-cards">

        <div className="heat-card">
          <FaUsers className="heat-icon" />
          <h2>{data.current_persons}</h2>
          <p>Current Persons</p>
        </div>

        <div className="heat-card">
          <FaEye className="heat-icon" />
          <h2>{data.total_customers}</h2>
          <p>Total Customers</p>
        </div>

        <div className="heat-card">
          <FaFire className="heat-icon" />
          <h2>{data.heatmap_points}</h2>
          <p>Heatmap Points</p>
        </div>

        <div className="heat-card">
          <FaShoppingBasket className="heat-icon" />
          <h2>{data.product_interactions}</h2>
          <p>Interactions</p>
        </div>

        <div className="heat-card">
          <FaClock className="heat-icon" />
          <h2>{formatDwell(data.average_dwell)}</h2>
          <p>Average Dwell</p>
        </div>

        <div className="heat-card">
          <FaMapMarkedAlt className="heat-icon" />
          <h2>{data.tracked_paths}</h2>
          <p>Tracked Paths</p>
        </div>

      </div>

      {/* ================= HEATMAP GRID ================= */}

      <div
        className="heatmap-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(520px,1fr))",
          gap: 25,
          marginTop: 30,
        }}
      >

        {cameras.map((camera) => (

          <div
            key={camera.id}
            className="heatmap-box"
          >

            {/* Camera Header */}

            <div
              className="camera-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >

              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: 0,
                }}
              >
                <FaVideo />

                {camera.name}

              </h2>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#22c55e",
                  fontWeight: 600,
                }}
              >
                <FaCircle
                  style={{
                    fontSize: 10,
                  }}
                />

                Online

              </div>

            </div>

            {/* HEATMAP IMAGE ONLY */}

            <img

              src={`http://127.0.0.1:8000/video/heatmap/${camera.id}?t=${Date.now()}`}

              alt={`Heatmap ${camera.id}`}

              className="camera-image"

              style={{
                width: "100%",
                height: 360,
                objectFit: "cover",
                borderRadius: 15,
                border: "2px solid #374151",
                background: "#000",
              }}

            />

            {/* Analytics */}

            <div
              className="camera-summary"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 15,
                marginTop: 20,
              }}
            >

              <div className="summary-card">

                <h4>Persons</h4>

                <h2>{data.current_persons}</h2>

              </div>

              <div className="summary-card">

                <h4>Interactions</h4>

                <h2>{data.product_interactions}</h2>

              </div>

              <div className="summary-card">

                <h4>Attention</h4>

                <h2>{data.attention_score}%</h2>

              </div>

              <div className="summary-card">

                <h4>Status</h4>

                <h2>{data.camera_status}</h2>

              </div>

            </div>

          </div>

        ))}

      </div>
            {/* ======================================================
            HEATMAP LEGEND
      ====================================================== */}

      <div
        className="heatmap-legend"
        style={{
          marginTop: 35,
          background: "#1f2937",
          borderRadius: 16,
          padding: 20,
        }}
      >

        <h2
          style={{
            color: "#ffffff",
            marginBottom: 20,
          }}
        >
          🔥 Heatmap Activity Legend
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: 18,
          }}
        >

          <div
            style={{
              background: "#2563eb",
              padding: 15,
              borderRadius: 12,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            🔵 Low Activity
          </div>

          <div
            style={{
              background: "#22c55e",
              padding: 15,
              borderRadius: 12,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            🟢 Medium Activity
          </div>

          <div
            style={{
              background: "#f59e0b",
              padding: 15,
              borderRadius: 12,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            🟡 High Activity
          </div>

          <div
            style={{
              background: "#ef4444",
              padding: 15,
              borderRadius: 12,
              color: "#ffffff",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            🔴 Very High Activity
          </div>

        </div>

      </div>

      {/* ======================================================
            SYSTEM STATUS
      ====================================================== */}

      <div
        className="heatmap-summary"
        style={{
          marginTop: 35,
        }}
      >

        <div className="summary-card">
          <h4>Camera Status</h4>
          <h2>{data.camera_status}</h2>
        </div>

        <div className="summary-card">
          <h4>AI Engine</h4>
          <h2>{data.system_status}</h2>
        </div>

        <div className="summary-card">
          <h4>Attention Score</h4>
          <h2>{data.attention_score}%</h2>
        </div>

        <div className="summary-card">
          <h4>Heatmap Status</h4>
          <h2>
            {data.heatmap_points > 0
              ? "ACTIVE"
              : "IDLE"}
          </h2>
        </div>

      </div>

      {/* ======================================================
            LOADING
      ====================================================== */}

      {loading && (

        <div
          style={{
            marginTop: 25,
            textAlign: "center",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          Loading Heatmap...
        </div>

      )}

      {/* ======================================================
            FOOTER
      ====================================================== */}

      <div
        className="heatmap-footer"
        style={{
          marginTop: 40,
          padding: "20px 0",
          borderTop: "1px solid #374151",
          textAlign: "center",
          color: "#9ca3af",
        }}
      >

        <h3
          style={{
            color: "#ffffff",
            marginBottom: 10,
          }}
        >
          AI Consumer Attention Mapping System
        </h3>

        <p>
          Live AI Heatmap Analytics Dashboard
        </p>

        <p>
          Last Updated :
          {" "}
          {formatTime(data.last_updated)}
        </p>

      </div>

    </div>

  );

}

export default Heatmap;