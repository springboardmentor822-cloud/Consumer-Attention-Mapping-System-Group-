import { useEffect, useState } from "react";

import {
  getTrajectoryAnalytics,
} from "../services/analyticsService";

import "../styles/TrajectoryAnalysis.css";

export default function TrajectoryTable({ cameraId }) {

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadTrajectory();

    const interval = setInterval(() => {

      loadTrajectory();

    }, 3000);

    return () => clearInterval(interval);

  }, [cameraId]);

  async function loadTrajectory() {

    try {

      setLoading(true);

      const data = await getTrajectoryAnalytics(cameraId);

      const trajectory = Object.values(
        data.customers || {}
      );

      trajectory.sort(
        (a, b) => b.distance - a.distance
      );

      setCustomers(
        trajectory.slice(0, 5)
      );

    } catch (error) {

      console.error(
        "Trajectory Table Error",
        error
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="trajectory-table-container">

      <div className="trajectory-table-header">

        <h2>
          Top 5 Active Customers
        </h2>

        <p>
          Ranked by total distance travelled
        </p>

      </div>

      <table className="trajectory-table">

        <thead>

          <tr>

            <th>Track ID</th>

            <th>Distance</th>

            <th>Avg Speed</th>

            <th>Efficiency</th>

            <th>Path Points</th>

          </tr>

        </thead>

        <tbody>

          {loading ? (

            <tr>

              <td
                colSpan="5"
                className="trajectory-loading"
              >

                Loading...

              </td>

            </tr>

          ) : customers.length === 0 ? (

            <tr>

              <td
                colSpan="5"
                className="trajectory-loading"
              >

                No customer movement detected.

              </td>

            </tr>

          ) : (

            customers.map((customer) => (

              <tr
                key={customer.track_id}
              >

                <td>

                  #{customer.track_id}

                </td>

                <td>

                  {customer.distance} px

                </td>

                <td>

                  {customer.average_speed} px/s

                </td>

                <td>

                  {Math.round(
                    customer.movement_efficiency * 100
                  )}%

                </td>

                <td>

                  {customer.path_points}

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}