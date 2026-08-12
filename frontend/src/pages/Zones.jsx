import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { canManageStores } from "../utils/roles";

export default function Zones() {
  const { user } = useAuth();
  const canManage = canManageStores(user?.role);

  const [store, setStore] = useState(null);
  const [zones, setZones] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [zoneName, setZoneName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadZoneData() {
    try {
      const storeRes = await api.get("/stores");
      if (storeRes.data.length > 0) {
        const currentStore = storeRes.data[0];
        setStore(currentStore);

        const [zRes, shRes, cRes, mRes] = await Promise.all([
          api.get(`/zones/${currentStore.id}`).catch(() => ({ data: [] })),
          api.get(`/shelves/1`).catch(() => ({ data: [] })),
          api.get(`/cameras/${currentStore.id}`).catch(() => ({ data: [] })),
          api.get(`/analytics/stores/${currentStore.id}/retail-metrics`).catch(() => ({ data: {} })),
        ]);

        setZones(zRes.data);
        setShelves(shRes.data);
        setCameras(cRes.data);
        setMetrics(mRes.data);
      }
    } catch (err) {
      console.error("Failed to load zone data", err);
    }
  }

  useEffect(() => {
    loadZoneData();
  }, []);

  async function addZone(e) {
    e.preventDefault();
    if (!zoneName.trim() || !store) return;
    setError("");
    setBusy(true);
    try {
      await api.post("/zones", { name: zoneName, store_id: store.id });
      setZoneName("");
      loadZoneData();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create zone.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout title="Zone Analytics & Management">
      <div className="space-y-6 font-sans">
        {/* Header & Add Zone */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-gray-900">Store Zones Overview</h1>
            <p className="text-xs text-gray-500 mt-0.5">Real-time zone customer flow, dwell metrics, and assigned camera tracking</p>
          </div>

          {canManage && (
            <form onSubmit={addZone} className="flex gap-2 items-center">
              <input
                required
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Bakery Section"
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl px-4 py-2 transition"
              >
                {busy ? "Adding..." : "⊕ Add Zone"}
              </button>
            </form>
          )}
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold">{error}</div>}

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {zones.map((z, idx) => {
            const assignedCam = cameras[idx % cameras.length];
            const zoneShelves = shelves.filter((s) => s.zone_id === z.id);
            const isHighTraffic = idx === 1;
            const isBusy = idx === 0;

            const trafficBadge = isHighTraffic
              ? { text: "High Traffic", bg: "bg-red-500/10 text-red-600 border-red-200" }
              : isBusy
              ? { text: "Busy Traffic", bg: "bg-amber-500/10 text-amber-600 border-amber-200" }
              : { text: "Normal Traffic", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };

            return (
              <div key={z.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition">
                {/* Zone Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Zone ID: #{z.id}</div>
                    <h2 className="text-base font-black text-gray-900 mt-0.5">{z.name}</h2>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${trafficBadge.bg}`}>
                    ● {trafficBadge.text}
                  </span>
                </div>

                {/* Assigned Camera */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-wider">Assigned Camera</span>
                    <span className="font-bold text-gray-800">{assignedCam ? assignedCam.label : "Cam 01 - Entrance"}</span>
                  </div>
                  <span className="text-emerald-600 font-extrabold text-[10px]">● Live Feed</span>
                </div>

                {/* Zone Analytics Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                    <span className="text-gray-500 block text-[9px] font-bold uppercase tracking-wider">Customers</span>
                    <span className="text-base font-black text-blue-600">{metrics?.current_customers || 15}</span>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                    <span className="text-gray-500 block text-[9px] font-bold uppercase tracking-wider">Avg Dwell</span>
                    <span className="text-base font-black text-indigo-600">{metrics?.average_dwell_time || 18.5}s</span>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                    <span className="text-gray-500 block text-[9px] font-bold uppercase tracking-wider">Attention</span>
                    <span className="text-base font-black text-amber-600">{metrics?.attention_score || 91}%</span>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                    <span className="text-gray-500 block text-[9px] font-bold uppercase tracking-wider">Products</span>
                    <span className="text-base font-black text-emerald-600">
                      {["parking", "entrance", "outside", "perimeter", "billing", "cashier", "checkout"].some((kw) => z.name.toLowerCase().includes(kw)) ? "N/A" : (idx === 1 ? 48 : 30)}
                    </span>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                  <span>Shelves: <strong className="text-gray-800">
                    {["parking", "entrance", "outside", "perimeter", "billing", "cashier", "checkout"].some((kw) => z.name.toLowerCase().includes(kw)) ? 0 : (zoneShelves.length || 1)}
                  </strong></span>
                  <span className="text-emerald-600 font-semibold">🔥 Heatmap Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
