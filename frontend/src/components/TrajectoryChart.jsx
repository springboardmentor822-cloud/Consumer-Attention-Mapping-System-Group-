import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  getTrajectoryAnalytics,
} from "../services/analyticsService";

import "../styles/TrajectoryAnalysis.css";

export default function TrajectoryChart({ cameraId }) {

  const [chartData, setChartData] = useState([]);

  useEffect(() => {

    loadChart();

    const interval = setInterval(() => {

      loadChart();

    }, 3000);

    return () => clearInterval(interval);

  }, [cameraId]);

  async function loadChart() {

    try {

      const data =
        await getTrajectoryAnalytics(cameraId);

      const customers = Object.values(
        data.customers || {}
      );

      customers.sort(
        (a, b) => b.distance - a.distance
      );

      const topFive = customers
        .slice(0, 5)
        .map((customer) => ({
          id: `#${customer.track_id}`,
          distance: customer.distance,
        }));

      setChartData(topFive);

    } catch (error) {

      console.error(
        "Trajectory Chart Error",
        error
      );

    }

  }

  return (

    <div className="trajectory-chart">

      <div className="trajectory-chart-header">

        <h2>
          Top 5 Customer Movement
        </h2>

        <p>
          Distance travelled by the most active customers
        </p>

      </div>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <BarChart
            data={chartData}
            margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
            }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2c3e50"
          />

          <XAxis 
            dataKey="id" 
            tick={{ fill: "#bfc9d4" }}
            axisLine={{ stroke: "#334155" }}
          />

          <YAxis 
            tick={{ fill: "#bfc9d4" }}
            axisLine={{ stroke: "#334155" }}
          />

          <Tooltip 
            contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "#fff",
            }}
          />

          <Bar
            dataKey="distance"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}