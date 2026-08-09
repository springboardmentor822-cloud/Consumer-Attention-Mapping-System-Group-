import { shelvesApi } from "../api/resources";
import ResourcePage from "./ResourcePage";

export default function Shelves() {
  return (
    <ResourcePage
      title="Shelves"
      description="Assign shelves to stores and optionally map cameras to shelf zones."
      api={shelvesApi}
      fields={[
        { name: "store_id", label: "Store ID", type: "number", required: true },
        { name: "shelf_name", label: "Shelf Name", required: true },
        { name: "zone", label: "Zone", required: true },
        { name: "description", label: "Description" },
        { name: "camera_id", label: "Camera ID", type: "number" },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "store_id", label: "Store ID" },
        { key: "shelf_name", label: "Shelf" },
        { key: "zone", label: "Zone" },
        { key: "description", label: "Description" },
        { key: "camera_id", label: "Camera ID" },
      ]}
    />
  );
}
