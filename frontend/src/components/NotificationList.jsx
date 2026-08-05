import "../styles/NotificationList.css";
import {
  FaBell,
  FaVideo,
  FaBoxOpen,
  FaRobot,
  FaStore,
  FaUsers,
} from "react-icons/fa";

function NotificationList() {

  const notifications = [

    {
      id: 1,
      icon: <FaVideo />,
      title: "Camera Offline",
      message: "Billing Camera is currently offline.",
      time: "2 min ago",
      type: "danger",
    },

    {
      id: 2,
      icon: <FaBoxOpen />,
      title: "Low Stock Alert",
      message: "Milk stock is running low.",
      time: "5 min ago",
      type: "warning",
    },

    {
      id: 3,
      icon: <FaRobot />,
      title: "AI Detection Complete",
      message: "Customer attention analysis finished.",
      time: "10 min ago",
      type: "success",
    },

    {
      id: 4,
      icon: <FaStore />,
      title: "New Store Added",
      message: "Lucknow Store added successfully.",
      time: "15 min ago",
      type: "info",
    },

    {
      id: 5,
      icon: <FaUsers />,
      title: "Peak Visitor Alert",
      message: "Visitor count exceeded 200.",
      time: "Today",
      type: "purple",
    },

  ];

  return (

    <div className="notification-container">

      <div className="notification-header">

        <h2>

          <FaBell />

          Notifications

        </h2>

      </div>

      <div className="notification-list">

        {notifications.map((item) => (

          <div
            key={item.id}
            className={`notification-card ${item.type}`}
          >

            <div className="notification-icon">

              {item.icon}

            </div>

            <div className="notification-content">

              <h3>{item.title}</h3>

              <p>{item.message}</p>

            </div>

            <span className="notification-time">

              {item.time}

            </span>

          </div>

        ))}

      </div>

    </div>

  );

}

export default NotificationList;