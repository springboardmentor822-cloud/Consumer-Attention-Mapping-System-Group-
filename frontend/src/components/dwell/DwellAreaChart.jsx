import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const DwellAreaChart = ({ analytics }) => {
  const chartData = useMemo(() => {
    return (analytics.hourly_dwell || []).map((item) => ({
      time: item.hour,
      dwell: item.value,
    }));
  }, [analytics.hourly_dwell]);

  const averageDwell = Number(analytics.average_dwell || 0);

  return (
    <div className="dwell-chart-container">

      <div className="chart-header">
        <h3>Hourly Dwell Trend</h3>
        <p>
          AI monitored average dwell time throughout the day
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <defs>

            <linearGradient
              id="dwellGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#22C55E"
                stopOpacity={0.8}
              />

              <stop
                offset="95%"
                stopColor="#22C55E"
                stopOpacity={0.05}
              />

            </linearGradient>

          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.15}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#CBD5E1" }}
          />

          <YAxis
            tick={{ fill: "#CBD5E1" }}
            label={{
              value: "Seconds",
              angle: -90,
              position: "insideLeft",
              fill: "#CBD5E1",
            }}
          />

          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: "10px",
            }}
          />

          <Area
            type="monotone"
            dataKey="dwell"
            stroke="#22C55E"
            strokeWidth={3}
            fill="url(#dwellGradient)"
            activeDot={{
              r: 6,
            }}
            animationDuration={700}
          />

        </AreaChart>
      </ResponsiveContainer>

      <div className="area-summary">

        <div>

          <strong>Average Dwell</strong>

          <p>{averageDwell}s</p>

        </div>

        <div>

          <strong>Peak Hour</strong>

          <p>
            {chartData.length
              ? chartData.reduce((a, b) =>
                  a.dwell > b.dwell ? a : b
                ).time
              : "--"}
          </p>

        </div>

      </div>

    </div>
  );
};

export default DwellAreaChart;