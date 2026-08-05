import { useEffect, useState } from "react";
import {
  FaSmile,
  FaMeh,
  FaSurprise,
  FaAngry,
  FaHeartbeat,
  FaVideo,
} from "react-icons/fa";

import API from "../services/api";
import { useCamera } from "../context/CameraContext";

function EmotionPanel() {
  const { selectedCamera } = useCamera();

  const [stats, setStats] = useState({
    happy: 0,
    neutral: 0,
    surprised: 0,
    angry: 0,
    system_status: "Healthy",
    camera_status: "Online",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await API.get(
          `/analytics/live/${selectedCamera}`
        );

        setStats({
          happy: data.happy ?? 0,
          neutral: data.neutral ?? 0,
          surprised: data.surprised ?? 0,
          angry: data.angry ?? 0,
          system_status: data.system_status ?? "Healthy",
          camera_status: data.camera_status ?? "Online",
        });
      } catch (error) {
        console.error("Emotion Panel Error:", error);
      }
    };

    loadData();

    const timer = setInterval(loadData, 1000);

    return () => clearInterval(timer);
  }, [selectedCamera]);

  return (
    <div className="ai-panel">
      <h2 style={{ marginBottom: "20px" }}>
        😊 Emotion Detection
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
        <EmotionCard
          icon={<FaSmile />}
          title="Happy"
          value={stats.happy}
          color="#22c55e"
        />

        <EmotionCard
          icon={<FaMeh />}
          title="Neutral"
          value={stats.neutral}
          color="#3b82f6"
        />

        <EmotionCard
          icon={<FaSurprise />}
          title="Surprised"
          value={stats.surprised}
          color="#f59e0b"
        />

        <EmotionCard
          icon={<FaAngry />}
          title="Angry"
          value={stats.angry}
          color="#ef4444"
        />
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "#111827",
          borderRadius: "12px",
          padding: "15px",
          color: "white",
        }}
      >
        <p>
          <FaHeartbeat /> <strong>AI Status:</strong>{" "}
          {stats.system_status}
        </p>

        <p style={{ marginTop: "10px" }}>
          <FaVideo /> <strong>Camera Status:</strong>{" "}
          {stats.camera_status}
        </p>

        <p style={{ marginTop: "10px" }}>
          <FaVideo /> <strong>Selected Camera:</strong>{" "}
          {selectedCamera}
        </p>
      </div>

      <p
        style={{
          marginTop: "20px",
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        * Emotion values will become live after integrating DeepFace or another
        emotion recognition model.
      </p>
    </div>
  );
}

function EmotionCard({
  icon,
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: "#111827",
        border: `2px solid ${color}`,
        borderRadius: "12px",
        padding: "20px",
        textAlign: "center",
        color: "white",
      }}
    >
      <div
        style={{
          color,
          fontSize: "34px",
          marginBottom: "12px",
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <h1
        style={{
          color,
          marginTop: "10px",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

export default EmotionPanel;