import "../styles/VisitorTrend.css";
import {
  FaChartLine,
  FaArrowUp,
} from "react-icons/fa";

function VisitorTrend() {

  const data = [
    { day: "Mon", visitors: 120 },
    { day: "Tue", visitors: 180 },
    { day: "Wed", visitors: 160 },
    { day: "Thu", visitors: 220 },
    { day: "Fri", visitors: 280 },
    { day: "Sat", visitors: 340 },
    { day: "Sun", visitors: 300 },
  ];

  const maxVisitors = 340;

  return (
    <div className="trend-card">

      <h2>
        <FaChartLine />
        Visitor Trend
      </h2>

      <div className="trend-chart">

        {data.map((item, index) => (

          <div className="bar-group" key={index}>

            <div
              className="bar"
              style={{
                height: `${(item.visitors / maxVisitors) * 220}px`,
              }}
            >
              <span>{item.visitors}</span>
            </div>

            <p>{item.day}</p>

          </div>

        ))}

      </div>

      <div className="trend-footer">

        <FaArrowUp />

        Visitor traffic increased by
        <strong> 18% </strong>
        this week.

      </div>

    </div>
  );
}

export default VisitorTrend;