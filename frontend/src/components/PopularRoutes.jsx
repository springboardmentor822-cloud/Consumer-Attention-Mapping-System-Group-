import { useEffect, useState } from "react";
import { getZoneTransition } from "../services/analyticsService";

export default function PopularRoutes({ cameraId }) {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, [cameraId]);

  async function loadData() {
    try {
      const response = await getZoneTransition(cameraId);

      const customerRoutes =
        response.zone_transition?.customer_routes || {};

      const list = Object.entries(customerRoutes)
        .map(([trackId, route]) => {
          const zones = route.split("→").map((z) => z.trim());

          return {
            trackId,
            fullRoute: route,
            route:
              zones.length > 7
                ? zones.slice(0, 7).join(" → ") + " ..."
                : route,
            visited: zones.length,
          };
        })
        .sort((a, b) => b.visited - a.visited)
        .slice(0, 5);

      setRoutes(list);
    } catch (err) {
      console.error(err);
    }
  }

  function medal(rank) {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return `#${rank + 1}`;
  }

  return (
    <div className="routes-card">
      <div className="trajectory-chart-header">
        <h2>🏆 Top Customer Routes</h2>
        <p>Most common shopping journeys</p>
      </div>

      {routes.length === 0 ? (
        <div className="waiting">
          No customer routes found.
        </div>
      ) : (
        <div className="routes-list">
          {routes.map((route, index) => (
            <div
              className="route-item"
              key={route.trackId}
            >
              <div className="route-rank">
                {medal(index)}
              </div>

              <div className="route-info">
                <div className="route-track">
                  Track #{route.trackId}
                </div>

                <div
                  className="route-text"
                  title={route.fullRoute}
                >
                  {route.route}
                </div>
              </div>

              <div className="route-visited">
                <span>{route.visited}</span>
                <small>Zones</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}