import { useEffect, useState } from "react";
import { getZoneTransition } from "../services/analyticsService";

const zoneIcons = {
  Entrance: "🚪",
  Checkout: "💳",
  Exit: "🚶",
  "Shelf A": "📦",
  "Shelf B": "📦",
  "Shelf C": "📦",
  "Shelf D": "📦",
  "Shelf E": "📦",
};

export default function ZoneFlowChart({ cameraId }) {
  const [flows, setFlows] = useState([]);

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, [cameraId]);

  async function loadData() {
    try {
      const response = await getZoneTransition(cameraId);

      const transitions =
        response.zone_transition?.transition_frequency || {};

      const rows = Object.entries(transitions)
        .map(([key, value]) => {
          const [from, to] = key.split("->");

          return {
            from: from.trim(),
            to: to.trim(),
            count: value,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setFlows(rows);
    } catch (err) {
      console.error(err);
    }
  }

  const max =
    flows.length > 0
      ? Math.max(...flows.map((x) => x.count))
      : 1;

  return (
    <div className="zone-flow-card">
      <div className="trajectory-chart-header">
        <h2>🔄 Top Customer Flow</h2>

        <p>Most common customer movements</p>
      </div>

      {flows.length === 0 ? (
        <div className="waiting">
          Waiting for customer movement...
        </div>
      ) : (
        <div className="zone-flow-container">
          {flows.map((flow, index) => (
            <div
              className="route-row"
              key={index}
            >
              <div className="zone-box">
                {zoneIcons[flow.from] || "📍"} {flow.from}
              </div>

              <div className="route-center">
                <div className="route-arrow">➜</div>

                <div className="route-count">
                  {flow.count}
                </div>

                <div className="flow-progress">
                  <div
                    className="flow-progress-fill"
                    style={{
                      width: `${
                        (flow.count / max) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="zone-box">
                {zoneIcons[flow.to] || "📍"} {flow.to}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}