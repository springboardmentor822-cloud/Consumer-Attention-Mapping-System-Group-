import { useEffect, useState } from "react";
import {
  FaUsers,
  FaRoute,
  FaTachometerAlt,
  FaBullseye,
} from "react-icons/fa";

import {
  getTrajectorySummary,
} from "../services/analyticsService";

import "./../styles/TrajectoryAnalysis.css";

export default function TrajectoryCards({ cameraId }) {
  const [summary, setSummary] = useState({
    customers: 0,
    average_distance: 0,
    average_speed: 0,
    average_efficiency: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();

    const interval = setInterval(() => {
      loadSummary();
    }, 3000);

    return () => clearInterval(interval);

  }, [cameraId]);

  async function loadSummary() {
    try {
      setLoading(true);

      const data = await getTrajectorySummary(cameraId);

      setSummary(data);

    } catch (error) {

      console.error(
        "Trajectory Summary Error",
        error
      );

    } finally {

      setLoading(false);

    }
  }

  const cards = [
    {
      title: "Customers",
      value: summary.customers,
      icon: <FaUsers />,
      color: "#4F8EF7",
    },

    {
      title: "Avg Distance",
      value: `${summary.average_distance} px`,
      icon: <FaRoute />,
      color: "#00C49F",
    },

    {
      title: "Avg Speed",
      value: `${summary.average_speed} px/s`,
      icon: <FaTachometerAlt />,
      color: "#FFB547",
    },

    {
      title: "Efficiency",
      value: `${summary.average_efficiency}%`,
      icon: <FaBullseye />,
      color: "#A855F7",
    },
  ];

  return (

    <div className="trajectory-cards">

      {cards.map((card) => (

        <div
          className="trajectory-card"
          key={card.title}
        >

          <div
            className="trajectory-card-icon"
            style={{
              background: card.color,
            }}
          >
            {card.icon}
          </div>

          <div className="trajectory-card-content">

            <h4>{card.title}</h4>

            <h2>

              {loading
                ? "..."
                : card.value}

            </h2>

          </div>

        </div>

      ))}

    </div>

  );
}