import "../styles/CameraAnalytics.css";
import {
  FaUsers,
  FaVideo,
  FaWalking,
  FaRobot,
  FaChartLine,
} from "react-icons/fa";

function CameraAnalytics() {
  return (
    <div className="camera-analytics">

      <h2>
        <FaChartLine /> Camera Analytics
      </h2>

      <div className="analytics-grid">

        <div className="analytics-box">
          <FaUsers className="analytics-icon" />
          <h3>18</h3>
          <p>Total Customers</p>
        </div>

        <div className="analytics-box">
          <FaVideo className="analytics-icon" />
          <h3>3</h3>
          <p>Active Cameras</p>
        </div>

        <div className="analytics-box">
          <FaWalking className="analytics-icon" />
          <h3>24</h3>
          <p>Motion Events</p>
        </div>

        <div className="analytics-box">
          <FaRobot className="analytics-icon" />
          <h3>98%</h3>
          <p>AI Accuracy</p>
        </div>

      </div>

      <div className="peak-time">

        <h3>Today's Peak Time</h3>

        <span>6:00 PM - 8:00 PM</span>

      </div>

    </div>
  );
}

export default CameraAnalytics;