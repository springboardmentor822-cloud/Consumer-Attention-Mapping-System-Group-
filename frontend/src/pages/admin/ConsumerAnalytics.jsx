import React, { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ConsumerAnalytics() {
  const [storeFilter, setStoreFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("This Week");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Datasets
  const visitorTrendsData = [
    { day: "Mon", totalVisitors: 12400, uniqueVisitors: 9800, dwellMins: 14.2 },
    { day: "Tue", totalVisitors: 14100, uniqueVisitors: 11200, dwellMins: 15.5 },
    { day: "Wed", totalVisitors: 13800, uniqueVisitors: 10900, dwellMins: 14.8 },
    { day: "Thu", totalVisitors: 16500, uniqueVisitors: 13100, dwellMins: 16.9 },
    { day: "Fri", totalVisitors: 21200, uniqueVisitors: 17400, dwellMins: 19.4 },
    { day: "Sat", totalVisitors: 28400, uniqueVisitors: 23200, dwellMins: 22.8 },
    { day: "Sun", totalVisitors: 25600, uniqueVisitors: 20800, dwellMins: 20.5 },
  ];

  const zoneTrafficData = [
    { zone: "Entrance Lobby", traffic: 34200, dwell: 2.1, conversion: "92%" },
    { zone: "Electronics & Tech", traffic: 24800, dwell: 5.4, conversion: "48%" },
    { zone: "Apparel & Fashion", traffic: 28100, dwell: 4.8, conversion: "52%" },
    { zone: "Beauty & Cosmetics", traffic: 18400, dwell: 6.1, conversion: "64%" },
    { zone: "Grocery & FMCG", traffic: 27100, dwell: 3.2, conversion: "78%" },
  ];

  const productInteractions = [
    { id: "P-101", product: "Flagship 5G Smartphone", category: "Electronics", pickups: 4280, returns: 1240, purchases: 1420, engagementRate: "88%" },
    { id: "P-102", product: "Active Noise ANC Headphones", category: "Electronics", pickups: 3120, returns: 890, purchases: 1150, engagementRate: "82%" },
    { id: "P-201", product: "Organic Botanical Face Serum", category: "Cosmetics", pickups: 2940, returns: 410, purchases: 1820, engagementRate: "94%" },
    { id: "P-301", product: "Unisex Cotton Denim Jacket", category: "Fashion", pickups: 2180, returns: 980, purchases: 740, engagementRate: "72%" },
  ];

  const aiInsightsList = [
    { title: "Optimize Beauty Zone Display", impact: "High Impact (+14% Conversion)", desc: "Dwell time in Beauty & Cosmetics averages 6.1 mins (highest in store), but checkout path is distant. Move fast-checkout kiosk adjacent to Zone D." },
    { title: "Reduce Return Rate in Electronics", impact: "Medium Impact (-18% Returns)", desc: "High pickup-to-return ratio on Product P-101. Add interactive spec comparison tablet beside Shelf SH-101." },
    { title: "Weekend Traffic Surge Capacity", impact: "Operational Alert", desc: "Saturday footfall reaches 28.4K. Recommend activating secondary mobile checkout units at Entrance Lobby." }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>📈</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h1 className="text-xl font-black text-white tracking-wide">Consumer Analytics & Behavior Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase tracking-widest">
              AI-Powered Shopper Insights
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive shopper footfall metrics, dwell duration analysis, gaze attention scores, and AI recommendations across stores.
          </p>
        </div>

        <button
          onClick={() => showToast("Exported Consumer Analytics PDF summary")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
        >
          <span>📄</span> Export Analytics Report
        </button>
      </div>

      {/* Advanced Filtering Toolbar */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <span className="text-xs font-extrabold text-slate-400 uppercase">Filters:</span>

          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="All">All Stores Scope</option>
            <option value="Store 1 - Koramangala">Store 1 - Koramangala</option>
            <option value="Store 2 - Indiranagar">Store 2 - Indiranagar</option>
            <option value="Store 3 - Hyderabad">Store 3 - Hyderabad</option>
            <option value="Store 4 - Andheri">Store 4 - Andheri</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="Today">Today (Real-time)</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Quarter To Date">Quarter To Date</option>
          </select>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="All">All Store Zones</option>
            <option value="Electronics">Electronics Zone</option>
            <option value="Apparel">Apparel Zone</option>
            <option value="Grocery">Grocery Zone</option>
            <option value="Cosmetics">Cosmetics Zone</option>
          </select>
        </div>

        <button
          onClick={() => {
            setStoreFilter("All");
            setDateFilter("This Week");
            setZoneFilter("All");
            showToast("Filters reset to default scope");
          }}
          className="text-xs text-slate-400 hover:text-white font-bold"
        >
          Reset Filters ↺
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Visitor Count", val: "132,000", sub: "+12.4% vs last week", col: "text-white" },
          { label: "Unique Visitors", val: "106,400", sub: "80.6% Unique Ratio", col: "text-purple-400" },
          { label: "Avg Dwell Time", val: "17.8 Mins", sub: "+2.1 Mins Engagement", col: "text-emerald-400" },
          { label: "Attention Score", val: "88.4 / 100", sub: "High Gaze Density", col: "text-cyan-400" },
          { label: "Engagement Rate", val: "68.2%", sub: "Touch & Pickup Ratio", col: "text-indigo-400" },
          { label: "Conversion Rate", val: "42.8%", sub: "Dwell to Purchase", col: "text-emerald-400" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase block truncate">{kpi.label}</span>
            <h3 className={`text-base font-black font-mono ${kpi.col}`}>{kpi.val}</h3>
            <span className="text-[10px] font-bold text-slate-400 block">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Interactive Charts: Visitor Trends & Zone Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Trends Area Chart */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📈</span> Shopper Visitor Trends & Unique Footfall
            </h3>
            <span className="text-xs font-mono text-indigo-400">Total: 132K</span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorTrendsData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Area type="monotone" dataKey="totalVisitors" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} name="Total Visitors" />
                <Area type="monotone" dataKey="uniqueVisitors" stroke="#A855F7" fill="#A855F7" fillOpacity={0.2} name="Unique Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Traffic Distribution */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📍</span> Zone-Wise Footfall & Traffic Distribution
            </h3>
            <span className="text-xs font-mono text-emerald-400">5 Zones Mapped</span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneTrafficData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Bar dataKey="traffic" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Footfall Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Interactions Summary & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Interactions Table */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>🛍️</span> Product Engagement & Interaction Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Pick-ups</th>
                  <th className="py-3 px-4">Returns</th>
                  <th className="py-3 px-4">Purchases</th>
                  <th className="py-3 px-4">Engagement Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {productInteractions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{p.product}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">{p.id}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{p.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">{p.pickups}</td>
                    <td className="py-3 px-4 font-mono text-amber-400">{p.returns}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{p.purchases}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                        {p.engagementRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations Engine */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>🤖</span> AI-Driven Store Optimization Recommendations
            </h3>
            <p className="text-xs text-slate-400 mt-1">Machine learning suggestions to optimize shelf layouts & boost engagement</p>

            <div className="space-y-3 mt-4">
              {aiInsightsList.map((ai, i) => (
                <div key={i} className="p-3.5 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1.5 hover:border-slate-500 transition">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white text-xs">{ai.title}</h4>
                    <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                      {ai.impact}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{ai.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => showToast("Applied AI store optimization recommendation to store planogram")}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            Apply Recommended Store Layout Changes →
          </button>
        </div>
      </div>
    </div>
  );
}
