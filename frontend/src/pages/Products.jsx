import { productsApi } from "../api/resources";
import ResourcePage from "./ResourcePage";

export default function Products() {
  return (
    <ResourcePage
      title="Products"
      description="Maintain product details, SKU, category, price, stock, and shelf assignment."
      api={productsApi}
      fields={[
        { name: "shelf_id", label: "Shelf ID", type: "number", required: true },
        { name: "product_name", label: "Product Name", required: true },
        { name: "sku", label: "SKU", required: true },
        { name: "category", label: "Category", required: true },
        { name: "price", label: "Price", type: "number", step: "0.01", required: true },
        { name: "stock_quantity", label: "Stock Quantity", type: "number", required: true },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "shelf_id", label: "Shelf ID" },
        { key: "product_name", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "category", label: "Category" },
        { key: "price", label: "Price" },
        { key: "stock_quantity", label: "Stock" },
      ]}
    />
  );
}
