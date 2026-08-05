import "../styles/StorePerformance.css";
import {
  FaStore,
  FaRupeeSign,
  FaUsers,
  FaStar
} from "react-icons/fa";

function StorePerformance() {

  const performance = [
    {
      title: "Best Store",
      value: "Gorakhpur",
      icon: <FaStore />,
      color: "#8b5cf6",
    },
    {
      title: "Revenue",
      value: "₹2.5 Lakh",
      icon: <FaRupeeSign />,
      color: "#06b6d4",
    },
    {
      title: "Visitors",
      value: "5,240",
      icon: <FaUsers />,
      color: "#22c55e",
    },
    {
      title: "Satisfaction",
      value: "4.9 / 5",
      icon: <FaStar />,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="performance-card">

      <h2>🏪 Store Performance</h2>

      <div className="performance-grid">

        {performance.map((item, index) => (

          <div className="performance-box" key={index}>

            <div
              className="performance-icon"
              style={{ background: item.color }}
            >
              {item.icon}
            </div>

            <h3>{item.value}</h3>

            <p>{item.title}</p>

          </div>

        ))}

      </div>

    </div>
  );
}

export default StorePerformance;