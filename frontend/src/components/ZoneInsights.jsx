import { useEffect, useState } from "react";
import {
  FaRobot,
  FaCheckCircle,
} from "react-icons/fa";

import {
  getZoneTransition,
} from "../services/analyticsService";

import "../styles/TrajectoryAnalysis.css";

export default function ZoneInsights({ cameraId }) {

  const [insights, setInsights] = useState([]);

  useEffect(() => {

    loadInsights();

    const interval = setInterval(loadInsights, 3000);

    return () => clearInterval(interval);

  }, [cameraId]);

  async function loadInsights() {

    try {

      const data =
        await getZoneTransition(cameraId);

      const ai =
        data.zone_transition?.ai_insights || [];

      setInsights(ai);

    } catch (error) {

      console.error(
        "Zone Insights Error",
        error
      );

    }

  }

  return (

    <div className="trajectory-table">

      <div className="trajectory-table-header">

        <h2>

          <FaRobot />

          {" "}AI Zone Insights

        </h2>

        <p>

          Smart recommendations generated
          from customer movement

        </p>

      </div>

      <div
        style={{
          padding: 25,
        }}
      >

        {insights.length === 0 ? (

          <p
            style={{
              color: "#94A3B8",
            }}
          >
            Waiting for AI recommendations...
          </p>

        ) : (

          insights.map((item, index) => (

            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
                color: "white",
              }}
            >

              <FaCheckCircle
                style={{
                  color: "#22C55E",
                }}
              />

              <span>

                {item}

              </span>

            </div>

          ))

        )}

      </div>

    </div>

  );

}