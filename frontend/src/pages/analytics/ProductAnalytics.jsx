import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
import NoAnalyticsNotice from "../../components/dashboard/NoAnalyticsNotice";
import { Package, AlertTriangle, XOctagon, Layers, Store, Video } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function ProductAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/analytics/products");
        setData(res.data);
      } catch (e) {
        console.error("Failed to fetch product analytics", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const hasData = data && data.has_data !== false;

  return (
    <Layout title="Product Analytics">
      <div className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              SKU110K Product Detection & Inventory Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-time object detection counts per shelf, zone, and camera feed.</p>
          </div>
        </div>

        {loading && !data ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading Product Analytics...</div>
        ) : !hasData ? (
          <NoAnalyticsNotice title="No Product Detection Data Available" />
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard title="Total Detected Products" value={data.detected_products} icon={<Package className="w-5 h-5" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
              <KpiCard title="Low Stock Items" value={data.low_stock} icon={<AlertTriangle className="w-5 h-5" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
              <KpiCard title="Out of Stock" value={data.out_of_stock} icon={<XOctagon className="w-5 h-5" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
              <KpiCard title="Shelf Occupancy" value={`${data.shelf_occupancy}%`} icon={<Layers className="w-5 h-5" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
            </div>

            {/* Products Per Zone Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4">Products Detected Per Zone</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.products_per_zone}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="zone" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Products Per Camera Chart */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4">Products Detected Per Camera Feed</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.products_per_camera}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="camera" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Detected Products Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Detected Product Inventory Details
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-semibold">Product Name</th>
                      <th className="pb-2 font-semibold">Detected Count</th>
                      <th className="pb-2 font-semibold">Stock Status</th>
                      <th className="pb-2 font-semibold">Product Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.top_products?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-bold text-white">{p.name}</td>
                        <td className="py-2.5 text-slate-300 font-mono font-bold">{p.count}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.stock_status === "Out of Stock" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            p.stock_status === "Low Stock" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {p.stock_status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400">{p.health}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
