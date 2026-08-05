import {
  FaVideo,
  FaDoorOpen,
  FaCashRegister,
  FaUser,
  FaSquare,
  FaGripLines,
} from "react-icons/fa";

function Legend() {

  const items = [
    {
      icon: <FaVideo />,
      label: "Camera",
      color: "#3B82F6",
    },
    {
      icon: <FaSquare />,
      label: "Shelf",
      color: "#22C55E",
    },
    {
      icon: <FaDoorOpen />,
      label: "Entrance",
      color: "#A855F7",
    },
    {
      icon: <FaCashRegister />,
      label: "Checkout",
      color: "#F59E0B",
    },
    {
      icon: <FaUser />,
      label: "Customer",
      color: "#EF4444",
    },
    {
      icon: <FaGripLines />,
      label: "Walking Path",
      color: "#06B6D4",
    },
  ];

  return (

    <div className="legend-card">

      <h3>

        Store Legend

      </h3>

      <div className="legend-grid">

        {items.map((item) => (

          <div
            key={item.label}
            className="legend-item"
          >

            <span
              className="legend-icon"
              style={{
                color: item.color,
              }}
            >
              {item.icon}
            </span>

            <span>

              {item.label}

            </span>

          </div>

        ))}

      </div>

    </div>

  );

}

export default Legend;