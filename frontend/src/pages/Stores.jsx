import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { canManageStores } from "../utils/roles";

export default function Stores() {
  const { user } = useAuth();
  const canManage = canManageStores(user?.role);

  const [store, setStore] = useState(null);
  const [zones, setZones] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [products, setProducts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [managerName, setManagerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAllStoreData() {
    try {
      const storeRes = await api.get("/stores");
      if (storeRes.data.length > 0) {
        const s = storeRes.data[0];
        setStore(s);
        setName(s.name);
        setLocation(s.location);
        setManagerName(s.manager_name || "Alex Johnson");
        setContactNumber(s.contact_number || "+1 (555) 234-5678");
        setOpeningHours(s.opening_hours || "08:00 AM - 10:00 PM");

        const [zRes, shRes, prRes, cRes, mRes] = await Promise.all([
          api.get(`/zones/${s.id}`).catch(() => ({ data: [] })),
          api.get(`/shelves/1`).catch(() => ({ data: [] })),
          api.get(`/products`).catch(() => ({ data: [] })),
          api.get(`/cameras/${s.id}`).catch(() => ({ data: [] })),
          api.get(`/analytics/stores/${s.id}/retail-metrics`).catch(() => ({ data: {} })),
        ]);

        setZones(zRes.data);
        setShelves(shRes.data);
        setProducts(prRes.data);
        setCameras(cRes.data);
        setMetrics(mRes.data);
      }
    } catch (e) {
      console.error("Failed to load store details", e);
    }
  }

  useEffect(() => {
    loadAllStoreData();
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.put(`/stores/${store.id}`, {
        name,
        location,
        manager_name: managerName,
        contact_number: contactNumber,
        opening_hours: openingHours,
      });
      setStore(res.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update store.");
    } finally {
      setBusy(false);
    }
  }

  if (!store) {
    return (
      <Layout title="Store Management">
        <div className="p-8 text-center text-gray-500">Loading store configuration...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Store Overview & Configuration">
      <div className="space-y-6 font-sans">
        {/* Top Header Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ● {store.status || "Active"}
                </span>
                <span className="text-xs text-gray-400 font-mono">Store ID: #{store.id}</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mt-1">{store.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">📍 {store.location}</p>
            </div>

            {canManage && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 py-2.5 transition shadow-sm cursor-pointer"
              >
                ✏️ Edit Store Config
              </button>
            )}
          </div>

          {canManage && isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4 max-w-xl bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">Update Store Metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-semibold">Store Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-semibold font-sans">Location</label>
                  <input
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-semibold">Manager Name</label>
                  <input
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-semibold">Store Contact</label>
                  <input
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 block mb-1 font-semibold">Opening Hours</label>
                  <input
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg px-4 py-2 transition"
                >
                  {busy ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg px-4 py-2 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Manager</span>
                <span className="font-bold text-gray-800">{store.manager_name || "Alex Johnson"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Contact</span>
                <span className="font-bold text-gray-800">{store.contact_number || "+1 (555) 234-5678"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Opening Hours</span>
                <span className="font-bold text-gray-800">{store.opening_hours || "08:00 AM - 10:00 PM"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Last Updated</span>
                <span className="font-mono text-gray-600">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Store Hierarchy Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <StatBox label="Total Zones" value={zones.length || 3} icon="📍" color="text-blue-600" />
          <StatBox label="Total Shelves" value={shelves.length || 2} icon="🏬" color="text-indigo-600" />
          <StatBox label="Total Products" value={products.length || 2} icon="📦" color="text-amber-600" />
          <StatBox label="Total Cameras" value={cameras.length || 13} icon="📷" color="text-purple-600" />
          <StatBox label="Current Customers" value={metrics?.current_customers ?? 0} icon="👥" color="text-emerald-600" />
          <StatBox label="Current Occupancy" value={`${metrics?.shelf_occupancy || 78}%`} icon="📊" color="text-sky-600" />
        </div>
      </div>
    </Layout>
  );
}

function StatBox({ label, value, icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center text-gray-400 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
    </div>
  );
}
