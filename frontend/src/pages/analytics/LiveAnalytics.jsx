import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
import NoAnalyticsNotice from "../../components/dashboard/NoAnalyticsNotice";
import { Users, Package, Clock, Video, Activity, Target, Eye, Store, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function LiveAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const liveRes = await api.get("/analytics/live");
        setMetrics(liveRes.data);
      } catch (e) {
        console.error("Failed to fetch live analytics", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const hasData = metrics && metrics.has_data !== false && (metrics.active_cameras > 0 || metrics.current_customers > 0 || metrics.current_visitors > 0);

  return (
    <Layout title="Live Analytics">
      <div className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
              Real-Time Retail Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1">Live AI computer vision stream metrics, updated continuously.</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Engine Active</span>
          </div>
        </div>

        {loading && !metrics ? (
          <div className="p-12 text-center text-sm text-slate-400">Initializing Live Stream Analytics...</div>
        ) : !hasData ? (
          <NoAnalyticsNotice title="No Live Analytics Streaming" />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard title="Active Customers" value={metrics.current_customers} icon={<Users className="w-5 h-5" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
              <KpiCard title="Detected Products" value={metrics.current_products} icon={<Package className="w-5 h-5" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
              <KpiCard title="Active Cameras" value={metrics.active_cameras} icon={<Video className="w-5 h-5" />} colorClass="text-purple-400" gradientClass="bg-purple-500" />
              <KpiCard title="System FPS" value={metrics.fps} icon={<Activity className="w-5 h-5" />} colorClass="text-indigo-400" gradientClass="bg-indigo-500" />
              <KpiCard title="Store Occupancy" value={`${metrics.store_occupancy}%`} icon={<Store className="w-5 h-5" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
              <KpiCard title="Avg Attention" value={`${metrics.average_attention}%`} icon={<Target className="w-5 h-5" />} colorClass="text-pink-400" gradientClass="bg-pink-500" />
              <KpiCard title="Avg Dwell Time" value={`${metrics.average_dwell}s`} icon={<Clock className="w-5 h-5" />} colorClass="text-cyan-400" gradientClass="bg-cyan-500" />
              <KpiCard title="Billing Queue" value={metrics.current_queue} icon={<Users className="w-5 h-5" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
              <KpiCard title="Total Visitors" value={metrics.current_visitors} icon={<Eye className="w-5 h-5" />} colorClass="text-teal-400" gradientClass="bg-teal-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hourly Footfall Chart */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Live Visitor Trend (Today)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.hourly_visitors}>
                      <defs>
                        <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fill="url(#liveGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Zone Traffic Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4">Zone Traffic Levels</h3>
                <div className="space-y-3">
                  {metrics.zone_traffic?.map((z, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-white">{z.zone}</div>
                        <div className="text-[10px] text-slate-400">{z.traffic_level}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400">{z.count} active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
