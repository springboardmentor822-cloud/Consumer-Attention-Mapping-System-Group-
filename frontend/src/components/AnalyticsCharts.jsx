import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

import "../styles/AnalyticsCharts.css";

function AnalyticsCharts({ data }) {

  if (!data) return null;

  const chartData = [

    {
      name: "Persons",
      value: data.current_persons || 0,
    },

    {
      name: "Customers",
      value: data.total_customers || 0,
    },

    {
      name: "Products",
      value: data.products_detected || 0,
    },

    {
      name: "Interactions",
      value: data.product_interactions || 0,
    },

    {
      name: "Attention",
      value: data.attention_score || 0,
    },

    {
      name: "Heatmap",
      value: data.heatmap_points || 0,
    },

  ];

  const colors = [

    "#3b82f6",

    "#22c55e",

    "#8b5cf6",

    "#ec4899",

    "#f59e0b",

    "#ef4444",

  ];

  return (

    <div className="analytics-charts">

      <div className="chart-card">

        <h3>📊 Live AI Analytics</h3>

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <BarChart data={chartData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              interval={0}
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="value"
              radius={[8,8,0,0]}
            >

              {

                chartData.map((item,index)=>(

                  <Cell
                    key={index}
                    fill={colors[index]}
                  />

                ))

              }

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

      <div className="chart-card">

        <h3>📈 Live AI Statistics</h3>

        <table
          style={{
            width:"100%",
            color:"white",
            borderCollapse:"collapse",
            marginTop:"20px"
          }}
        >

          <tbody>

            <tr>
              <td>Current Persons</td>
              <td>{data.current_persons}</td>
            </tr>

            <tr>
              <td>Total Customers</td>
              <td>{data.total_customers}</td>
            </tr>

            <tr>
              <td>Products Detected</td>
              <td>{data.products_detected}</td>
            </tr>

            <tr>
              <td>Product Interactions</td>
              <td>{data.product_interactions}</td>
            </tr>

            <tr>
              <td>Attention Score</td>
              <td>{data.attention_score}%</td>
            </tr>

            <tr>
              <td>Average Dwell</td>
              <td>{data.average_dwell}s</td>
            </tr>

            <tr>
              <td>Heatmap Points</td>
              <td>{data.heatmap_points}</td>
            </tr>

            <tr>
              <td>Camera Status</td>
              <td>{data.camera_status}</td>
            </tr>

            <tr>
              <td>System Status</td>
              <td>{data.system_status}</td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default AnalyticsCharts;