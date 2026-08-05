import { useEffect, useState } from "react";
import "../styles/CameraPreview.css";
import { FaVideo, FaCircle, FaUsers } from "react-icons/fa";

function CameraPreview() {

  const [stats, setStats] = useState({
    current_persons: 0,
    total_customers: 0,
  });

  useEffect(() => {

    const fetchStats = async () => {

      try {

        const response = await fetch(
          "http://127.0.0.1:8000/analytics/live"
        );

        const data = await response.json();

        setStats(data);

      } catch (err) {

        console.log("Analytics Error", err);

      }

    };

    fetchStats();

    const interval = setInterval(fetchStats, 1000);

    return () => clearInterval(interval);

  }, []);

  return (

    <div className="preview-card">

      <h2>
        <FaVideo /> Live Camera Feed
      </h2>

      {/* Analytics Cards */}

      <div className="analytics-cards">

        <div className="analytics-box">

          <FaUsers className="analytics-icon" />

          <h3>Current Persons</h3>

          <h1>{stats.current_persons}</h1>

        </div>

        <div className="analytics-box">

          <FaUsers className="analytics-icon" />

          <h3>Total Customers</h3>

          <h1>{stats.total_customers}</h1>

        </div>

      </div>

      {/* Live Video */}

      <div className="preview-grid">

        <div className="camera-box">

          <div className="camera-screen">

            <div className="live-tag">
              <FaCircle />
              LIVE
            </div>

            <img
              src="http://127.0.0.1:8000/video/customer"
              alt="Live Camera"
              className="camera-video"
            />

          </div>

          <div className="camera-info">

            <h4>Entrance Camera</h4>

            <p>AI Consumer Attention Monitoring</p>

          </div>

        </div>

      </div>

    </div>

  );

}

export default CameraPreview;