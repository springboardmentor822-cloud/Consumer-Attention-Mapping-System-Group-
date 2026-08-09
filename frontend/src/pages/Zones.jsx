import { zonesApi } from "../api/resources";
import ResourcePage from "./ResourcePage";

export default function Zones() {
  return (
    <ResourcePage
      title="Zones"
      description="Create, update, delete, search, and review store zones."
      api={zonesApi}
      fields={[
        { name: "store_id", label: "Store ID", type: "number", required: true },
        { name: "zone_name", label: "Zone Name", required: true },
        { name: "description", label: "Description" },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "store_id", label: "Store ID" },
        { key: "zone_name", label: "Zone Name" },
        { key: "description", label: "Description" },
      ]}
    />
  );
}
