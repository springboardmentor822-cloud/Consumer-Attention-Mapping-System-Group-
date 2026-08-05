import {
  FaExclamationTriangle,
  FaVideo,
  FaChartLine,
  FaCheckCircle,
  FaBell,
} from "react-icons/fa";

function NotificationCard({ notification }) {

  let icon = <FaBell />;
  let color = "#3b82f6";

  switch (notification.type) {

    case "warning":
      icon = <FaExclamationTriangle />;
      color = "#f59e0b";
      break;

    case "danger":
      icon = <FaVideo />;
      color = "#ef4444";
      break;

    case "success":
      icon = <FaCheckCircle />;
      color = "#22c55e";
      break;

    case "info":
      icon = <FaChartLine />;
      color = "#06b6d4";
      break;

    default:
      icon = <FaBell />;
      color = "#3b82f6";
  }

  // ===========================================
  // Fix Invalid Date
  // ===========================================

  let displayTime = "Live";

  if (notification.created_at) {

    const date = new Date(notification.created_at);

    if (!isNaN(date.getTime())) {

      displayTime = date.toLocaleString();

    }

  } else if (notification.time) {

    displayTime = notification.time;

  }

  return (

    <div
      className="notification-card"
      style={{
        borderLeft: `6px solid ${color}`,
      }}
    >

      <div
        className="notification-icon"
        style={{
          background: color,
        }}
      >
        {icon}
      </div>

      <div className="notification-content">

        <h3>{notification.title}</h3>

        <p>{notification.message}</p>

        <span>{displayTime}</span>

      </div>

    </div>

  );

}

export default NotificationCard;