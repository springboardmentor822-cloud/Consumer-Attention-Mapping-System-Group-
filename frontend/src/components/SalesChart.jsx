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

function SalesChart({ data }) {
  if (!data) return null;

  const chartData = [
    {
      name: "Current\nPersons",
      value: data.current_persons || 0,
    },
    {
      name: "Total\nCustomers",
      value: data.total_customers || 0,
    },
    {
      name: "Products\nDetected",
      value: data.products_detected || 0,
    },
    {
      name: "Product\nInteraction",
      value: data.product_interactions || 0,
    },
    {
      name: "Attention\nScore",
      value: data.attention_score || 0,
    },
  ];

  const colors = [
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
  ];

  return (
    <div className="dashboard-card">
      <h2
        style={{
          color: "#ffffff",
          marginBottom: "6px",
          fontSize: "24px",
          fontWeight: "700",
        }}
      >
        Live AI Analytics
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: "25px",
          fontSize: "15px",
        }}
      >
        Real-time customer analytics powered by AI detection
      </p>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 5,
            bottom: 20,
          }}
        >
          <CartesianGrid
            stroke="#334155"
            strokeDasharray="5 5"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            stroke="#CBD5E1"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />

          <YAxis
            stroke="#CBD5E1"
            axisLine={false}
            tickLine={false}
            width={40}
          />

          <Tooltip
            cursor={{
              fill: "rgba(255,255,255,0.05)",
            }}
            contentStyle={{
              background: "#1e293b",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
            }}
            labelStyle={{
              color: "#ffffff",
              fontWeight: "bold",
            }}
          />

          <Bar
            dataKey="value"
            radius={[12, 12, 0, 0]}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={colors[index]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SalesChart;