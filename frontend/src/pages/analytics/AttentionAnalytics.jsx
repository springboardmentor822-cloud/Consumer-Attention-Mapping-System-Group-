import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
import NoAnalyticsNotice from "../../components/dashboard/NoAnalyticsNotice";
import { Target, TrendingUp, TrendingDown, Eye, Award, Layers, Users } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function AttentionAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/analytics/attention");
        setData(res.data);
      } catch (e) {
        console.error("Failed to fetch attention analytics", e);
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
    <Layout title="Attention Analytics">
      <div className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Customer Visual Attention & Engagement
            </h1>
            <p className="text-xs text-slate-400 mt-1">Calculated from gaze duration, head pose estimates, and zone interaction times.</p>
          </div>
        </div>

        {loading && !data ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading Attention Analytics...</div>
        ) : !hasData ? (
          <NoAnalyticsNotice title="No Attention Analytics Recorded" />
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title="Avg Attention Score" value={`${data.average_attention_score}%`} icon={<Target className="w-5 h-5" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
              <KpiCard title="Highest Attention Zone" value={data.highest_attention_zone} icon={<TrendingUp className="w-5 h-5" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
              <KpiCard title="Lowest Attention Zone" value={data.lowest_attention_zone} icon={<TrendingDown className="w-5 h-5" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attention Per Zone */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4">Attention Score Per Zone</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.attention_per_zone}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="zone" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                      <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hourly Attention Trend */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4">Hourly Attention Score Trend</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.hourly_attention_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 Most Engaged Customers */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Top 10 Most Engaged Customers
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-semibold">Customer ID</th>
                        <th className="pb-2 font-semibold">Dwell Time</th>
                        <th className="pb-2 font-semibold">Attention Score</th>
                        <th className="pb-2 font-semibold">Zone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {data.top_10_customers?.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 font-bold text-white">{cust.customer_id}</td>
                          <td className="py-2.5 text-slate-300">{cust.dwell_time}s</td>
                          <td className="py-2.5 text-emerald-400 font-bold">{cust.attention_score}%</td>
                          <td className="py-2.5 text-slate-400">{cust.zone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top 10 High Attention Shelves */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Top High Attention Shelves
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-semibold">Shelf</th>
                        <th className="pb-2 font-semibold">Zone</th>
                        <th className="pb-2 font-semibold">Attention Score</th>
                        <th className="pb-2 font-semibold">Visitors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {data.top_10_shelves?.map((sh, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 font-bold text-white">{sh.shelf}</td>
                          <td className="py-2.5 text-slate-300">{sh.zone}</td>
                          <td className="py-2.5 text-indigo-400 font-bold">{sh.score}%</td>
                          <td className="py-2.5 text-slate-400">{sh.visitors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
