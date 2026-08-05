import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

function PieAnalyticsChart({ analytics }) {
  const currentPersons = analytics.current_persons ?? 0;
  const interactions = analytics.product_interactions ?? 0;
  const attention = analytics.attention_score ?? 0;

  const data = [
    {
      name: "Current Persons",
      value: currentPersons,
    },
    {
      name: "Interactions",
      value: interactions,
    },
    {
      name: "Attention Score",
      value: attention,
    },
  ];

  const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
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
          color: "#ffffff",
          marginBottom: 20,
          fontWeight: 700,
        }}
      >
        🥧 Customer Activity Distribution
      </h3>

      <ResponsiveContainer
        width="100%"
        height="90%"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={95}
            innerRadius={45}
            paddingAngle={4}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              color: "#ffffff",
            }}
          />

          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              color: "#ffffff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PieAnalyticsChart;