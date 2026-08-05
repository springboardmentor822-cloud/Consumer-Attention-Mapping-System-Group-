import { useState } from "react";

import CameraSelector from "../components/CameraSelector";

import TrajectoryCards from "../components/TrajectoryCards";
import TrajectorySummary from "../components/TrajectorySummary";
import TrajectoryTable from "../components/TrajectoryTable";
import TrajectoryChart from "../components/TrajectoryChart";

import "../styles/TrajectoryAnalysis.css";

export default function TrajectoryAnalysis() {
  const [cameraId, setCameraId] = useState(1);

  return (
    <div className="trajectory-page">

      {/* =======================================
          Header
      ======================================== */}

      <div className="trajectory-header">

        <div>
          <h1>Trajectory Analytics</h1>

          <p>
            AI Powered Customer Movement Intelligence
          </p>
        </div>

        <div className="trajectory-camera">

          <label>Select Camera</label>

          <CameraSelector
            value={cameraId}
            onChange={(value) => setCameraId(value)}
          />

        </div>

      </div>

      {/* =======================================
          KPI CARDS
      ======================================== */}

      <TrajectoryCards cameraId={cameraId} />

      {/* =======================================
          SUMMARY
      ======================================== */}

      <TrajectorySummary cameraId={cameraId} />

      {/* =======================================
          TABLE
      ======================================== */}

      <TrajectoryTable cameraId={cameraId} />

      {/* =======================================
          CHART
      ======================================== */}

      <TrajectoryChart cameraId={cameraId} />

    </div>
  );
}