import { useEffect, useState } from "react";

import NotificationCard from "../components/NotificationCard";
import CameraSelector from "../components/CameraSelector";

import { useCamera } from "../context/CameraContext";
import { getNotifications } from "../services/notificationService";

import "../styles/Notifications.css";

function Notifications() {
  const { selectedCamera } = useCamera();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    const timer = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => clearInterval(timer);
  }, [selectedCamera]);

  const loadNotifications = async () => {
    try {
      let backendNotifications = [];

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/notifications/${selectedCamera}`
        );

        if (response.ok) {
          backendNotifications = await response.json();
        } else {
          throw new Error();
        }
      } catch {
        backendNotifications = await getNotifications();
      }

      const analyticsResponse = await fetch(
        `http://127.0.0.1:8000/analytics/live/${selectedCamera}`
      );

      let aiNotifications = [];

      if (analyticsResponse.ok) {
        const live = await analyticsResponse.json();

        if ((live.current_persons ?? 0) > 10) {
          aiNotifications.push({
            id: "crowd",
            type: "warning",
            title: "High Crowd Density",
            message: `${live.current_persons} people are currently visible on Camera ${selectedCamera}.`,
            time: "Live",
          });
        }

        if ((live.current_persons ?? 0) === 0) {
          aiNotifications.push({
            id: "nocustomer",
            type: "info",
            title: "No Customer Activity",
            message: `No customers detected on Camera ${selectedCamera}.`,
            time: "Live",
          });
        }

        if ((live.attention_score ?? 100) >= 80) {
          aiNotifications.push({
            id: "attention-high",
            type: "success",
            title: "High Customer Attention",
            message: `Attention Score is ${live.attention_score}%`,
            time: "Live",
          });
        }

        if ((live.attention_score ?? 100) < 50) {
          aiNotifications.push({
            id: "attention-low",
            type: "warning",
            title: "Low Customer Attention",
            message: `Attention Score dropped to ${live.attention_score}%`,
            time: "Live",
          });
        }

        if ((live.average_dwell ?? 0) > 20) {
          aiNotifications.push({
            id: "dwell",
            type: "info",
            title: "High Dwell Time",
            message: `Average dwell time is ${live.average_dwell} seconds.`,
            time: "Live",
          });
        }

        if ((live.product_interactions ?? 0) > 10) {
          aiNotifications.push({
            id: "interaction",
            type: "success",
            title: "Customer Interaction Detected",
            message: `${live.product_interactions} customer interactions recorded.`,
            time: "Live",
          });
        }

        if ((live.store_congestion ?? "").toLowerCase() === "high") {
          aiNotifications.push({
            id: "congestion",
            type: "warning",
            title: "High Store Congestion",
            message: "Customer density is currently high.",
            time: "Live",
          });
        }

        aiNotifications.push({
          id: "camera",
          type: "success",
          title: "Camera Online",
          message: `Camera ${selectedCamera} is operating normally.`,
          time: "Live",
        });

        aiNotifications.push({
          id: "system",
          type: "success",
          title: "AI System Running",
          message: live.system_status || "AI model is running normally.",
          time: "Live",
        });
      }

      setNotifications([
        ...aiNotifications,
        ...backendNotifications,
      ]);
    } catch (error) {
      console.error("Notification Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>🔔 AI Notifications</h1>

        <p>
          Monitor live customer activity, camera status and AI-generated alerts.
        </p>

        <CameraSelector />
      </div>

      {loading ? (
        <div className="loading-text">
          Loading Notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-notification">
          <h3>No Active Notifications</h3>
          <p>AI system is operating normally.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification, index) => (
            <NotificationCard
              key={notification.id ?? index}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;