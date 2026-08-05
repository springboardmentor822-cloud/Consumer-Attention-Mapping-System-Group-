import "../styles/AttentionHeatmap.css";
import { FaFire } from "react-icons/fa";

function AttentionHeatmap() {

  const zones = [
    { name: "Entrance", level: "low" },
    { name: "Shelf A", level: "high" },
    { name: "Shelf B", level: "medium" },
    { name: "Shelf C", level: "low" },
    { name: "Billing", level: "high" },
    { name: "Exit", level: "low" },
  ];

  return (

    <div className="heatmap-card">

      <h2>

        <FaFire />

        Customer Attention Heatmap

      </h2>

      <div className="heatmap-grid">

        {zones.map((zone,index)=>(

          <div
            key={index}
            className={`heatmap-zone ${zone.level}`}
          >

            <h3>{zone.name}</h3>

            <p>

              {zone.level==="high"
                ? "High Attention"
                : zone.level==="medium"
                ? "Medium Attention"
                : "Low Attention"}

            </p>

          </div>

        ))}

      </div>

      <div className="heatmap-legend">

        <div>

          <span className="legend high"></span>

          High Attention

        </div>

        <div>

          <span className="legend medium"></span>

          Medium Attention

        </div>

        <div>

          <span className="legend low"></span>

          Low Attention

        </div>

      </div>

    </div>

  );

}

export default AttentionHeatmap;