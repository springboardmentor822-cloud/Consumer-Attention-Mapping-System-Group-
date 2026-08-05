import { useEffect, useState } from "react";
import {
  FaCamera,
  FaUsers,
  FaRoute,
  FaTachometerAlt,
  FaBullseye,
} from "react-icons/fa";

import { getTrajectorySummary } from "../services/analyticsService";

import "../styles/TrajectoryAnalysis.css";

export default function TrajectorySummary({ cameraId }) {
  const [summary, setSummary] = useState({
    customers: 0,
    average_distance: 0,
    average_speed: 0,
    average_efficiency: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();

    const interval = setInterval(() => {
      fetchSummary();
    }, 3000);

    return () => clearInterval(interval);

  }, [cameraId]);

  async function fetchSummary() {
    try {
      const data = await getTrajectorySummary(cameraId);

      setSummary(data);

    } catch (err) {
      console.error("Trajectory Summary Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="trajectory-summary">

      <div className="trajectory-summary-header">
        <h2>Trajectory Summary</h2>
        <p>
          AI generated overview of customer movement
        </p>
      </div>

      <div className="trajectory-summary-grid">

        <div className="summary-item">
          <FaCamera className="summary-icon" />
          <div>
            <span>Selected Camera</span>
            <h3>{cameraId}</h3>
          </div>
        </div>

        <div className="summary-item">
          <FaUsers className="summary-icon" />
          <div>
            <span>Total Customers</span>
            <h3>
              {loading ? "..." : summary.customers}
            </h3>
          </div>
        </div>

        <div className="summary-item">
          <FaRoute className="summary-icon" />
          <div>
            <span>Average Distance</span>
            <h3>
              {loading
                ? "..."
                : `${summary.average_distance} px`}
            </h3>
          </div>
        </div>

        <div className="summary-item">
          <FaTachometerAlt className="summary-icon" />
          <div>
            <span>Average Speed</span>
            <h3>
              {loading
                ? "..."
                : `${summary.average_speed} px/s`}
            </h3>
          </div>
        </div>

        <div className="summary-item">
          <FaBullseye className="summary-icon" />
          <div>
            <span>Movement Efficiency</span>
            <h3>
              {loading
                ? "..."
                : `${summary.average_efficiency}%`}
            </h3>
          </div>
        </div>

      </div>

      <div className="trajectory-ai-insight">

        <h3>AI Movement Insight</h3>

        <p>
          {loading
            ? "Analysing customer movement..."
            : summary.customers === 0
            ? "No customer movement detected."
            : summary.average_efficiency >= 80
            ? "Customers are following direct and efficient movement paths."
            : summary.average_efficiency >= 60
            ? "Customer movement is moderately efficient with some browsing behaviour."
            : "Customers are exploring the store extensively before making decisions."}
        </p>

      </div>

    </div>
  );
}