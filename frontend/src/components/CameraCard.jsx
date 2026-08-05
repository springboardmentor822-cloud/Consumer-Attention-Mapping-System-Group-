import LiveCameraPanel from "./LiveCameraPanel";

import {
  FaCamera,
  FaCheckCircle,
} from "react-icons/fa";

function CameraCard({

  cameraName,

  zone,

  status = "Online",

  showLive = false,

  videoUrl,

}) {

  const online = status.toLowerCase() === "online";

  return (

    <div className="camera-card">

      {/* Header */}

      <div className="camera-header">

        <div className="camera-title">

          <FaCamera />

          <h3>{cameraName}</h3>

        </div>

        <div
          className={`camera-status ${online ? "online" : "offline"}`}
        >

          <FaCheckCircle />

          {status}

        </div>

      </div>

      {/* Live Camera */}

      <div
        className="camera-video"
        style={{
          marginTop: "12px",
        }}
      >

        {showLive && (

          <LiveCameraPanel

            videoUrl={videoUrl}

            cameraName={cameraName}

            zone={zone}

          />

        )}

      </div>

    </div>

  );

}

export default CameraCard;