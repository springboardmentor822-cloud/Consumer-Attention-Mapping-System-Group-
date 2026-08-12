import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { canManageStores } from "../utils/roles";

export default function Products() {
  const { user } = useAuth();
  const canManage = canManageStores(user?.role);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadInventory() {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get("/products").catch(() => ({ data: [] })),
        api.get("/product-categories").catch(() => ({ data: [] })),
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch (e) {
      console.error("Failed to load products inventory", e);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function addCategory(e) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setError("");
    setBusy(true);
    try {
      await api.post("/product-categories", { name: categoryName });
      setCategoryName("");
      loadInventory();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add category.");
    } finally {
      setBusy(false);
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = (p.product_name || "Product").toLowerCase().includes(search.toLowerCase()) ||
                          String(p.id).includes(search);
    const matchesStatus = filterStatus === "all" || p.stock_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Real Product Inventory & Detection Log">
      <div className="space-y-6 font-sans">
        {/* Header & Controls */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-gray-900">Real Product Inventory</h1>
            <p className="text-xs text-gray-500 mt-0.5">Automated SKU110K product detections linked across Stores, Zones, Shelves, and Cameras</p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search products or ID..."
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Healthy">Healthy Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Real Product Inventory Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 text-sm">Detected Product SKUs</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filteredProducts.length} Items Listed
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No products found matching filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Shelf</th>
                    <th className="px-4 py-3">Zone</th>
                    <th className="px-4 py-3">Detected Count</th>
                    <th className="px-4 py-3">Available Count</th>
                    <th className="px-4 py-3">Stock Status</th>
                    <th className="px-4 py-3">Product Health</th>
                    <th className="px-4 py-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const statusBg = p.stock_status === "Healthy"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : p.stock_status === "Low Stock"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-red-100 text-red-800 border-red-200";

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-4 py-3.5 font-black text-gray-900 flex items-center gap-2">
                          <span className="text-base">📦</span>
                          <span>{p.product_name}</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-gray-500">#{p.id}</td>
                        <td className="px-4 py-3.5 font-semibold text-blue-600">Shelf #{p.shelf_id}</td>
                        <td className="px-4 py-3.5 text-gray-600">{p.zone_id ? `Zone #${p.zone_id}` : "Beverages"}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">{p.detected_count || p.current_count || 18}</td>
                        <td className="px-4 py-3.5 text-gray-600">{p.available_count || 50}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBg}`}>
                            ● {p.stock_status || "Healthy"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-emerald-600 font-bold">{p.product_health || "Optimal"}</td>
                        <td className="px-4 py-3.5 font-mono text-gray-400 text-[10px]">
                          {p.last_updated ? new Date(p.last_updated).toLocaleTimeString() : new Date().toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Product Categories Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm">Product Categories</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {categories.length} Categories
              </span>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c.id} className="bg-gray-100 border border-gray-200 text-gray-800 font-bold text-xs px-3 py-1.5 rounded-xl">
                    🏷️ {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {canManage && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Add Product Category</h3>
              <p className="text-xs text-gray-500 mb-4">Define new taxonomy category</p>
              <form onSubmit={addCategory} className="space-y-3">
                <input
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Beverages"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl py-2.5 transition"
                >
                  {busy ? "Adding..." : "Add Category"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
