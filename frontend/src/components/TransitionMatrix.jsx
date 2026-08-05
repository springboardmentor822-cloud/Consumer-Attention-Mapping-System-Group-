import { useEffect, useState } from "react";

import {
  getZoneTransition,
} from "../services/analyticsService";

import "../styles/TrajectoryAnalysis.css";

export default function TransitionMatrix({ cameraId }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadMatrix();

    const interval = setInterval(loadMatrix, 3000);

    return () => clearInterval(interval);
  }, [cameraId]);

  async function loadMatrix() {
    try {
      const data =
        await getZoneTransition(cameraId);

      const transitions =
        data.zone_transitions || {};

      const matrix = Object.entries(transitions)
        .map(([key, count]) => {
          const parts = key.split("->");

          return {
            from: parts[0]?.trim() || "-",
            to: parts[1]?.trim() || "-",
            count,
          };
        })
        .sort((a, b) => b.count - a.count);

      setRows(matrix);
    } catch (error) {
      console.error(
        "Transition Matrix Error",
        error
      );
    }
  }

  return (
    <div className="trajectory-table">

      <div className="trajectory-table-header">

        <h2>
          Zone Transition Matrix
        </h2>

        <p>
          Ranked by transition frequency
        </p>

      </div>

      <table>

        <thead>

          <tr>
            <th>Rank</th>
            <th>From Zone</th>
            <th>To Zone</th>
            <th>Transitions</th>
          </tr>

        </thead>

        <tbody>

          {rows.length === 0 ? (

            <tr>
              <td
                colSpan="4"
                style={{
                  textAlign: "center",
                  color: "#94A3B8",
                  padding: "30px",
                }}
              >
                Waiting for zone transitions...
              </td>
            </tr>

          ) : (

            rows.map((row, index) => (

              <tr key={index}>

                <td>#{index + 1}</td>

                <td>{row.from}</td>

                <td>{row.to}</td>

                <td>{row.count}</td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}