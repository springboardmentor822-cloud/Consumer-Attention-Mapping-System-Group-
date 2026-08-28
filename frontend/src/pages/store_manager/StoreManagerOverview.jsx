import React from "react";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function StoreManagerOverview() {
  // DATASETS
  const trafficOverTime = [
    { time: "12 AM", visitors: 120 },
    { time: "3 AM", visitors: 350 },
    { time: "6 AM", visitors: 780 },
    { time: "9 AM", visitors: 1250 },
    { time: "12 PM", visitors: 1800 },
    { time: "3 PM", visitors: 2100 },
    { time: "5 PM", visitors: 2356 },
    { time: "6 PM", visitors: 2050 },
    { time: "9 PM", visitors: 1850 }
  ];

  const visitorsByZone = [
    { zone: "Entrance", count: 2856, fill: "#2563EB" },
    { zone: "Aisle A", count: 2345, fill: "#10B981" },
    { zone: "Aisle B", count: 2189, fill: "#8B5CF6" },
    { zone: "Aisle C", count: 1789, fill: "#F59E0B" },
    { zone: "Promo Area", count: 1256, fill: "#06B6D4" },
    { zone: "Checkout", count: 1102, fill: "#EC4899" }
  ];

  const customerDistribution = [
    { name: "New Visitors", value: 8102, color: "#2563EB", percent: "63.1%" },
    { name: "Returning Visitors", value: 4743, color: "#10B981", percent: "36.9%" }
  ];

  const zonePerformance = [
    { id: 1, zone: "Entrance", footfall: "2,856", share: "22.2%", dwell: "00:05:36", trend: "↑ 12.5%", color: "text-emerald-400" },
    { id: 2, zone: "Aisle A", footfall: "2,345", share: "18.2%", dwell: "00:06:12", trend: "↑ 10.3%", color: "text-emerald-400" },
    { id: 3, zone: "Aisle B", footfall: "2,189", share: "17.0%", dwell: "00:05:48", trend: "↑ 8.7%", color: "text-emerald-400" },
    { id: 4, zone: "Aisle C", footfall: "1,789", share: "13.9%", dwell: "00:04:15", trend: "↑ 6.2%", color: "text-emerald-400" },
    { id: 5, zone: "Promotion Area", footfall: "1,256", share: "9.8%", dwell: "00:08:20", trend: "↓ 2.1%", color: "text-rose-400" }
  ];

  const recentAlerts = [
    { id: 1, title: "Camera Offline", desc: "Camera CAM-07 in Aisle B is offline.", type: "Critical", time: "08:30 PM", badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
    { id: 2, title: "High Crowd Density", desc: "Crowd density is high in Promo Area.", type: "Warning", time: "08:25 PM", badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    { id: 3, title: "Low Shelf Stock", desc: "Low stock detected in Shelf A3 (Dairy).", type: "Warning", time: "07:50 PM", badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    { id: 4, title: "Long Dwell Time", desc: "Unusually long dwell time in Aisle C.", type: "Warning", time: "07:40 PM", badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
  ];

  return (
    <div className="space-y-5 font-sans text-xs">
      {/* 1. TOP METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Total Visitors</span>
            <h2 className="text-xl font-black text-white font-mono">12,845</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 12.5% vs yesterday</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">
            👥
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Avg. Dwell Time</span>
            <h2 className="text-xl font-black text-white font-mono">28m 36s</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 8.6% vs yesterday</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">
            🔄
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Products Interacted</span>
            <h2 className="text-xl font-black text-white font-mono">1,245</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 11.3% vs yesterday</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">
            🛒
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Traffic Flow</span>
            <h2 className="text-xl font-black text-white font-mono">High</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 9.3% vs yesterday</span>
          </div>
          <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center text-lg">
            🔀
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Active Alerts</span>
            <h2 className="text-xl font-black text-white font-mono">6</h2>
            <span className="text-[10px] text-rose-400 font-bold font-mono">2 Critical • 4 Warning</span>
          </div>
          <div className="w-10 h-10 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center text-lg">
            ⚠️
          </div>
        </div>
      </div>

      {/* 2. MID ROW CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* TRAFFIC OVER TIME */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Traffic Over Time</h3>
            <button className="bg-[#070C18] border border-[#1E293B] px-2.5 py-1 rounded-lg text-slate-300 text-[10px]">
              Today ▾
            </button>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficOverTime}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} itemStyle={{ color: "#F8FAFC" }} labelStyle={{ color: "#94A3B8" }} />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* VISITORS BY ZONE */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Zone</h3>
            <button className="bg-[#070C18] border border-[#1E293B] px-2.5 py-1 rounded-lg text-slate-300 text-[10px]">
              Today ▾
            </button>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorsByZone}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} itemStyle={{ color: "#F8FAFC" }} labelStyle={{ color: "#94A3B8" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Visitors">
                  {visitorsByZone.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* CUSTOMER DISTRIBUTION DONUT */}
        <div className="lg:col-span-3 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Distribution</h3>
            <button className="bg-[#070C18] border border-[#1E293B] px-2.5 py-1 rounded-lg text-slate-300 text-[10px]">
              Today ▾
            </button>
          </div>
          <div className="h-40 w-full relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={customerDistribution} innerRadius={45} outerRadius={65} dataKey="value">
                  {customerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} itemStyle={{ color: "#F8FAFC" }} labelStyle={{ color: "#94A3B8" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <span className="text-[9px] text-slate-400 block">Total</span>
              <strong className="text-xs text-white block">12,845</strong>
            </div>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-slate-300">New Visitors</span>
              </span>
              <strong className="text-white">8,102 ({customerDistribution[0].percent})</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300">Returning Visitors</span>
              </span>
              <strong className="text-white">4,743 ({customerDistribution[1].percent})</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ZONE PERFORMANCE SUMMARY */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Performance Summary</h3>
            <button className="text-[11px] text-blue-400 hover:underline">View all zones →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Zone</th>
                  <th className="pb-2">Footfall</th>
                  <th className="pb-2">% Share</th>
                  <th className="pb-2">Avg. Dwell</th>
                  <th className="pb-2">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {zonePerformance.map((row) => (
                  <tr key={row.id} className="hover:bg-[#070C18]/50 transition">
                    <td className="py-2.5 text-slate-500">{row.id}</td>
                    <td className="py-2.5 font-bold text-white">{row.zone}</td>
                    <td className="py-2.5 text-slate-300">{row.footfall}</td>
                    <td className="py-2.5 text-slate-400">{row.share}</td>
                    <td className="py-2.5 text-slate-300">{row.dwell}</td>
                    <td className={`py-2.5 font-bold ${row.color}`}>{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT LIVE ALERTS */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Live Alerts</h3>
            <button className="text-[11px] text-blue-400 hover:underline">View all alerts →</button>
          </div>
          <div className="space-y-2.5">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${alert.badgeBg}`}>
                    {alert.type}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                    <p className="text-[10px] text-slate-400">{alert.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
