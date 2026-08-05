import { useCamera } from "../context/CameraContext";

function CameraSelector() {
  const {
    selectedCamera,
    setSelectedCamera,
    cameras,
    currentCamera,
  } = useCamera();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <label
          style={{
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          Select Camera
        </label>

        <select
          value={selectedCamera}
          onChange={(e) =>
            setSelectedCamera(Number(e.target.value))
          }
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #374151",
            backgroundColor: "#1F2937",
            color: "#fff",
            minWidth: "240px",
            cursor: "pointer",
            outline: "none",
            fontSize: "15px",
          }}
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: "#111827",
          padding: "10px 16px",
          borderRadius: "8px",
          color: "#D1D5DB",
          fontSize: "14px",
          border: "1px solid #374151",
        }}
      >
        <strong style={{ color: "#60A5FA" }}>
          Active Zone:
        </strong>{" "}
        {currentCamera.zone}
      </div>
    </div>
  );
}

export default CameraSelector;