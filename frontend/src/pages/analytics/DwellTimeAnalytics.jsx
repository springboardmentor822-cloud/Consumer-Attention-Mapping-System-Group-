import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
import NoAnalyticsNotice from "../../components/dashboard/NoAnalyticsNotice";
import { Clock, ArrowUpCircle, ArrowDownCircle, Users, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function DwellTimeAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/analytics/dwell");
        setData(res.data);
      } catch (e) {
        console.error("Failed to fetch dwell analytics", e);
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
    <Layout title="Dwell Time Analytics">
      <div className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Customer Dwell Time & Duration Analysis
            </h1>
            <p className="text-xs text-slate-400 mt-1">Tracks total in-store duration, zone residence times, and shelf engagement windows.</p>
          </div>
        </div>

        {loading && !data ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading Dwell Time Analytics...</div>
        ) : !hasData ? (
          <NoAnalyticsNotice title="No Dwell Time Analytics Recorded" />
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title="Avg Dwell Time" value={`${data.average_dwell}s`} icon={<Clock className="w-5 h-5" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
              <KpiCard title="Maximum Dwell" value={`${data.maximum_dwell}s`} icon={<ArrowUpCircle className="w-5 h-5" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
              <KpiCard title="Minimum Dwell" value={`${data.minimum_dwell}s`} icon={<ArrowDownCircle className="w-5 h-5" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Zone Wise Dwell */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4">Zone-Wise Average Dwell Time</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.zone_wise_dwell}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="zone" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                      <Bar dataKey="dwell" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hourly Dwell Trend */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4">Hourly Dwell Time Distribution</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hourly_dwell}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                      <Bar dataKey="dwell" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Customer Dwell Rankings Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Customer Dwell Time Rankings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-semibold">Customer ID</th>
                      <th className="pb-2 font-semibold">Current Zone</th>
                      <th className="pb-2 font-semibold">Dwell Duration</th>
                      <th className="pb-2 font-semibold">Attention Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.customer_ranking?.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-bold text-white">{cust.customer_id}</td>
                        <td className="py-2.5 text-slate-300">{cust.zone}</td>
                        <td className="py-2.5 text-cyan-400 font-bold">{cust.dwell_time}s</td>
                        <td className="py-2.5 text-indigo-400 font-bold">{cust.attention_score}%</td>
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
