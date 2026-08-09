import { Link } from "react-router-dom";
import { camerasApi } from "../api/resources";
import { cameraStatuses } from "../utils/permissions";
import ResourcePage from "./ResourcePage";

export default function Cameras() {
  return (
    <ResourcePage
      title="Cameras"
      description="Create, update, delete, search, and review camera details."
      api={camerasApi}
      fields={[
        { name: "store_id", label: "Store ID", type: "number", required: true },
        { name: "camera_name", label: "Camera Name", required: true },
        { name: "camera_ip", label: "Camera IP", required: true },
        { name: "camera_location", label: "Camera Location", required: true },
        { name: "status", label: "Status", type: "select", options: cameraStatuses, required: true },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "store_id", label: "Store ID" },
        { key: "camera_name", label: "Camera" },
        { key: "camera_ip", label: "IP" },
        { key: "camera_location", label: "Location" },
        { key: "status", label: "Status" },
      ]}
      linkColumn={{
        label: "Live",
        render: (camera) => (
          <div className="flex gap-3 text-xs">
            <Link to={`/video?camera_id=${camera.id}`} className="text-blue-400 hover:text-blue-300">
              Process Video
            </Link>
            <Link to="/camera-grid" className="text-emerald-400 hover:text-emerald-300">
              View Grid
            </Link>
          </div>
        ),
      }}
    />
  );
}
