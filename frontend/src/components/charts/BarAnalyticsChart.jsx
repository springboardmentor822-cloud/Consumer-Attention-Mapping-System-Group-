import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

function BarAnalyticsChart({ analytics }) {
  const data = [
    {
      name: "Current",
      value: analytics.current_persons ?? 0,
    },
    {
      name: "Customers",
      value: analytics.total_customers ?? 0,
    },
    {
      name: "Attention",
      value: analytics.attention_score ?? 0,
    },
    {
      name: "Interactions",
      value: analytics.product_interactions ?? 0,
    },
    {
      name: "Heatmap",
      value: analytics.heatmap_points ?? 0,
    },
  ];

  const colors = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#a855f7",
    "#ef4444",
  ];

  return (
    <div
      style={{
        background: "#1f2937",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 8px 18px rgba(0,0,0,.25)",
        height: 380,
      }}
    >
      <h3
        style={{
          color: "#fff",
          marginBottom: 20,
          fontWeight: 700,
        }}
      >
        📊 AI Metrics Comparison
      </h3>

      <ResponsiveContainer
        width="100%"
        height="90%"
      >
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
          />

          <XAxis
            dataKey="name"
            tick={{
              fill: "#d1d5db",
              fontSize: 12,
            }}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fill: "#d1d5db",
              fontSize: 12,
            }}
          />

          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              color: "#fff",
            }}
            cursor={{
              fill: "rgba(255,255,255,0.05)",
            }}
          />

          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarAnalyticsChart;