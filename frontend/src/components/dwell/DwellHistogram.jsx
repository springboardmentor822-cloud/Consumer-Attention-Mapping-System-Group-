import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const BAR_COLORS = [
  "#3B82F6",
  "#06B6D4",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
];

const DwellHistogram = ({ analytics }) => {
  const averageDwell = Number(analytics.average_dwell || 0);

  const chartData = useMemo(() => {
    const distribution = analytics.dwell_distribution || [];

    return [
      {
        range: "0-30s",
        customers: distribution[0] || 0,
      },
      {
        range: "30-60s",
        customers: distribution[1] || 0,
      },
      {
        range: "60-90s",
        customers: distribution[2] || 0,
      },
      {
        range: "90-120s",
        customers: distribution[3] || 0,
      },
      {
        range: "120s+",
        customers: distribution[4] || 0,
      },
    ];
  }, [analytics.dwell_distribution]);

  return (
    <div className="dwell-chart-container">

      <div className="chart-header">
        <h3>Customer Dwell Distribution</h3>
        <p>
          Distribution of customers across dwell time ranges.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.15}
          />

          <XAxis
            dataKey="range"
            tick={{ fill: "#CBD5E1" }}
          />

          <YAxis
            tick={{ fill: "#CBD5E1" }}
            allowDecimals={false}
            label={{
              value: "Customers",
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

          <Bar
            dataKey="customers"
            radius={[10, 10, 0, 0]}
            animationDuration={700}
          >
            {chartData.map((item, index) => (
              <Cell
                key={index}
                fill={BAR_COLORS[index]}
              />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>

      <div className="histogram-summary">

        <div>
          <strong>Average Dwell</strong>
          <p>{averageDwell}s</p>
        </div>

        <div>
          <strong>Total Buckets</strong>
          <p>{chartData.length}</p>
        </div>

      </div>

    </div>
  );
};

export default DwellHistogram;