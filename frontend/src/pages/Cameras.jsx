import { useEffect, useState } from "react";
import API from "../services/api";

import CameraTable from "../components/CameraTable";
import CameraCard from "../components/CameraCard";

import "../styles/CameraCard.css";

function Cameras() {
  const [cameras, setCameras] = useState([
    {
      id: 1,
      cameraName: "Camera 1",
      zone: "Entrance",
      status: "Loading...",
      currentPersons: 0,
      fps: 30,
      attentionScore: 0,
      productInteractions: 0,
      averageDwell: 0,
      peakZone: "-",
      heatmapPoints: 0,
      videoUrl: "http://127.0.0.1:8000/video/1",
    },
    {
      id: 2,
      cameraName: "Camera 2",
      zone: "Supermarket Aisle",
      status: "Loading...",
      currentPersons: 0,
      fps: 30,
      attentionScore: 0,
      productInteractions: 0,
      averageDwell: 0,
      peakZone: "-",
      heatmapPoints: 0,
      videoUrl: "http://127.0.0.1:8000/video/2",
    },
  ]);

  useEffect(() => {
    loadCameraAnalytics();

    const interval = setInterval(() => {
      loadCameraAnalytics();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadCameraAnalytics = async () => {
    try {
      const updated = await Promise.all(
        cameras.map(async (camera) => {
          try {
            const { data } = await API.get(
              `/analytics/live/${camera.id}`
            );

            return {
              ...camera,
              currentPersons: data.current_persons ?? 0,
              fps: data.fps ?? 30,
              status: data.system_status ?? "Online",
              attentionScore: data.attention_score ?? 0,
              productInteractions:
                data.product_interactions ?? 0,
              averageDwell:
                data.average_dwell ?? 0,
              peakZone:
                data.peak_zone ?? "-",
              heatmapPoints:
                data.heatmap_points ?? 0,
            };
          } catch (error) {
            console.error(
              `Camera ${camera.id}`,
              error
            );

            return {
              ...camera,
              status: "Offline",
              currentPersons: 0,
            };
          }
        })
      );

      setCameras(updated);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="cameras-page">
      <h1 className="page-title">
        📹 Camera Monitoring
      </h1>

      <p className="page-subtitle">
        Monitor live customer activity from the
        available store cameras.
      </p>

      <div className="camera-grid">
        {cameras.map((camera) => (
          <CameraCard
            key={camera.id}
            cameraName={camera.cameraName}
            zone={camera.zone}
            status={camera.status}
            currentPersons={camera.currentPersons}
            fps={camera.fps}
            attentionScore={camera.attentionScore}
            productInteractions={
              camera.productInteractions
            }
            averageDwell={camera.averageDwell}
            peakZone={camera.peakZone}
            heatmapPoints={camera.heatmapPoints}
            showLive={true}
            videoUrl={camera.videoUrl}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: "40px",
        }}
      >
        <CameraTable />
      </div>
    </div>
  );
}

export default Cameras;