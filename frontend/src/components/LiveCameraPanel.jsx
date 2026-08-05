import { FaVideo } from "react-icons/fa";

function LiveCameraPanel({
  videoUrl,
  cameraName = "Camera",
}) {
  return (
    <div className="ai-panel">

      <h2>
        <FaVideo /> Live Camera Feed
      </h2>

      <img
        src={videoUrl}
        alt={cameraName}
        loading="lazy"
        style={{
          width: "100%",
          height: "500px",
          objectFit: "cover",
          borderRadius: "12px",
          border: "2px solid #22c55e",
          backgroundColor: "#111827",
        }}
        onError={(e) => {
          e.currentTarget.alt = "Camera feed unavailable";
        }}
      />

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#22c55e",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          ● LIVE
        </span>
      </div>

    </div>
  );
}

export default LiveCameraPanel;