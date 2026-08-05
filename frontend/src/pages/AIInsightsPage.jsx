import { useEffect, useState } from "react";
import API from "../services/api";
import { useCamera } from "../context/CameraContext";
import CameraSelector from "../components/CameraSelector";
import AIInsightsModern from "../components/AIInsightsModern";

function AIInsightsPage() {
  const { selectedCamera } = useCamera();

  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/analytics/live/${selectedCamera}`);
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      }
    };

    load();

    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [selectedCamera]);

  return (
    <div className="heatmap-page">
      <div className="heatmap-header">
        <h1>🧠 AI Insights</h1>
        <p>Live AI Analytics Dashboard</p>
      </div>

      <CameraSelector />

      <AIInsightsModern data={analytics} />
    </div>
  );
}

export default AIInsightsPage;