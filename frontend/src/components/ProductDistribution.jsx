import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "../styles/ProductDistribution.css";

const data = [
  { name: "Dairy", value: 35 },
  { name: "Bakery", value: 20 },
  { name: "Snacks", value: 25 },
  { name: "Beverage", value: 20 },
];

const COLORS = [
  "#C4B5FD",
  "#5EEAD4",
  "#86EFAC",
  "#FDBA74",
];

function ProductDistribution() {
  return (
    <div className="product-card">

      <h2>🧀 Product Category Distribution</h2>

      <ResponsiveContainer width="100%" height={320}>

        <PieChart>

          <Pie
            data={data}
            cx="45%"
            cy="50%"
            outerRadius={95}
            dataKey="value"
            label={({ percent }) =>
              `${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
              />
            ))}
          </Pie>

          <Tooltip />

          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
          />

        </PieChart>

      </ResponsiveContainer>

    </div>
  );
}

export default ProductDistribution;