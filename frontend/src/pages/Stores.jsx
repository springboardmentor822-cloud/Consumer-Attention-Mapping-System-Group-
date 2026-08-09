import { storesApi } from "../api/resources";
import { storeStatuses } from "../utils/permissions";
import ResourcePage from "./ResourcePage";

export default function Stores() {
  return (
    <ResourcePage
      title="Stores"
      description="Create, update, delete, search, and review store details."
      api={storesApi}
      fields={[
        { name: "store_name", label: "Store Name", required: true },
        { name: "store_code", label: "Store Code", required: true },
        { name: "location", label: "Location", required: true },
        { name: "manager_name", label: "Manager Name", required: true },
        { name: "status", label: "Status", type: "select", options: storeStatuses, required: true },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "store_name", label: "Store" },
        { key: "store_code", label: "Code" },
        { key: "location", label: "Location" },
        { key: "manager_name", label: "Manager" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
