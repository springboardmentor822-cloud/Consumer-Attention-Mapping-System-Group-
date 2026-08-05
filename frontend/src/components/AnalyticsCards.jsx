import {
  FaStore,
  FaBoxes,
  FaVideo,
  FaUsers,
  FaChartLine,
  FaClock,
} from "react-icons/fa";

import "../styles/AnalyticsCards.css";

function AnalyticsCards({ summary = {}, liveData = {} }) {

  const cards = [

    {
      title: "Total Stores",
      value: summary.total_stores ?? 0,
      icon: <FaStore />,
      className: "card visitors",
    },

    {
      title: "Total Products",
      value: summary.total_products ?? 0,
      icon: <FaBoxes />,
      className: "card current",
    },

    {
      title: "Total Cameras",
      value: summary.total_cameras ?? 0,
      icon: <FaVideo />,
      className: "card attention",
    },

    {
      title: "Current Persons",
      value: liveData.current_persons ?? 0,
      icon: <FaUsers />,
      className: "card engagement",
    },

    {
      title: "Attention Score",
      value: `${liveData.attention_score ?? 0}%`,
      icon: <FaChartLine />,
      className: "card sales",
    },

    {
      title: "Average Dwell",
      value: `${liveData.average_dwell ?? 0}s`,
      icon: <FaClock />,
      className: "card conversion",
    },

  ];

  return (

    <div className="analytics-cards">

      {cards.map((card, index) => (

        <div
          key={index}
          className={card.className}
        >

          <div className="card-icon">

            {card.icon}

          </div>

          <div className="card-content">

            <h4>{card.title}</h4>

            <h2>{card.value}</h2>

          </div>

        </div>

      ))}

    </div>

  );

}

export default AnalyticsCards;