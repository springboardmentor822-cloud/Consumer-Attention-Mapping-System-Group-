import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

function LineAnalyticsChart({ analytics }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const point = {
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      persons: analytics.current_persons ?? 0,
    };

    setHistory((prev) => {
      const updated = [...prev, point];

      // Keep only the latest 10 points
      if (updated.length > 10) {
        updated.shift();
      }

      return updated;
    });
  }, [analytics.current_persons]);

  return (
    <div
      style={{
        background: "#1f2937",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
      }}
    >
      <h3
        style={{
          color: "#fff",
          marginBottom: 20,
        }}
      >
        📈 Live Customer Trend
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={history}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#d1d5db", fontSize: 12 }}
          />

          <YAxis
            allowDecimals={false}
            tick={{ fill: "#d1d5db", fontSize: 12 }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="persons"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{
              r: 5,
            }}
            activeDot={{
              r: 8,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineAnalyticsChart;