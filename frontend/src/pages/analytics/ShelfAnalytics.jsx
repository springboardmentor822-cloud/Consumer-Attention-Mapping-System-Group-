import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
import NoAnalyticsNotice from "../../components/dashboard/NoAnalyticsNotice";
import { Layers, Star, ThumbsDown, Eye, Clock, Package } from "lucide-react";

export default function ShelfAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/analytics/shelves");
        setData(res.data);
      } catch (e) {
        console.error("Failed to fetch shelf analytics", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const hasData = data && data.has_data !== false && data.shelves?.length > 0;

  return (
    <Layout title="Shelf Analytics">
      <div className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Shelf Level Performance & Engagement
            </h1>
            <p className="text-xs text-slate-400 mt-1">Monitors visitor footfall, dwell times, and shelf occupancy rates per aisle shelf.</p>
          </div>
        </div>

        {loading && !data ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading Shelf Analytics...</div>
        ) : !hasData ? (
          <NoAnalyticsNotice title="No Shelf Analytics Monitored" />
        ) : (
          <>
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title="Monitored Shelves" value={data.shelves?.length || 0} icon={<Layers className="w-5 h-5" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
              <KpiCard title="Most Visited Shelf" value={data.most_visited_shelf?.shelf_name || "N/A"} icon={<Star className="w-5 h-5" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
              <KpiCard title="Least Visited Shelf" value={data.least_visited_shelf?.shelf_name || "N/A"} icon={<ThumbsDown className="w-5 h-5" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
            </div>

            {/* Shelves Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">Detailed Shelf Analytics Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-semibold">Shelf Label</th>
                      <th className="pb-2 font-semibold">Zone</th>
                      <th className="pb-2 font-semibold">Current Products</th>
                      <th className="pb-2 font-semibold">Visitors</th>
                      <th className="pb-2 font-semibold">Avg Dwell</th>
                      <th className="pb-2 font-semibold">Attention Score</th>
                      <th className="pb-2 font-semibold">Occupancy</th>
                      <th className="pb-2 font-semibold">Health Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.shelves?.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3 font-bold text-white flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          {s.shelf_name}
                        </td>
                        <td className="py-3 text-slate-300">{s.zone}</td>
                        <td className="py-3 text-slate-300 font-mono">{s.current_products}</td>
                        <td className="py-3 text-emerald-400 font-bold">{s.visitors}</td>
                        <td className="py-3 text-cyan-400 font-bold">{s.average_dwell}s</td>
                        <td className="py-3 text-indigo-400 font-bold">{s.attention_score}%</td>
                        <td className="py-3 text-amber-400 font-bold">{s.shelf_occupancy}%</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.shelf_health === "Low Stock" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            s.shelf_health === "Shelf Full" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {s.shelf_health}
                          </span>
                        </td>
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
