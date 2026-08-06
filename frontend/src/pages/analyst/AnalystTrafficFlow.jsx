import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell
} from "recharts";
import {
  dailyTrafficTrend, entryExitPoints, bottlenecks, storeHeatmap, zones,
  heatColor, formatNumber
} from "../../services/centralData";

const kpis = [
  { label: "Total Footfall", value: "62,480", change: "↑ 18.4%", icon: "🚦" },
  { label: "Peak Hour Traffic", value: "1,240 / hr", change: "5PM - 7PM", icon: "⏰" },
  { label: "Primary Entry Point", value: "Main Entrance", change: "58.2% share", icon: "🚪" },
  { label: "Primary Exit Point", value: "Main Entrance", change: "54.1% share", icon: "🚶" },
  { label: "Active Bottlenecks", value: "2 Critical", change: "Aisle 4 & Checkout", icon: "⚠️" },
  { label: "Avg Flow Velocity", value: "1.2 m/s", change: "Normal Pace", icon: "⚡" },
];

export default function AnalystTrafficFlow() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Traffic Flow Analysis</h1>
          <p className="text-slate-400 text-xs">Analyze customer movement patterns, pathing density, bottleneck locations, and peak periods throughout the store.</p>
        </div>
        <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
          <span>📅</span><span>Aug 1 – Aug 7, 2026</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Traffic Trends + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Weekly Traffic Density Trends</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrafficTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="visitors" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} strokeWidth={2.5} />
                <Area type="monotone" dataKey="returning" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" /> Total Visitors</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> Returning Customers</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Density Layout Heatmap</h3>
            <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-bold rounded-lg font-mono">LIVE FEED</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {storeHeatmap.map((z, i) => (
              <div key={i} className={`${heatColor(z.heat)} rounded-xl p-2.5 text-center transition-all hover:scale-105 cursor-pointer`}>
                <span className="text-[8px] font-bold block leading-tight">{z.name}</span>
                <span className="text-xs font-black font-mono block mt-0.5">{z.heat}%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-emerald-500/30 rounded" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-amber-500/60 rounded" /> Med</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-orange-500/70 rounded" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-rose-500/80 rounded" /> Peak</span>
          </div>
        </div>
      </div>

      {/* Entry/Exit Performance + Bottleneck Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Entry & Exit Velocity by Point</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entryExitPoints} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={9} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="entries" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="exits" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bottleneck Identification</h3>
          <div className="space-y-2">
            {bottlenecks.map((b, i) => (
              <div key={i} className={`p-3 border rounded-xl flex items-center justify-between ${b.status === "Critical" ? "bg-rose-500/5 border-rose-500/20" : b.status === "High" ? "bg-amber-500/5 border-amber-500/20" : "bg-[#070C18] border-[#1E293B]"}`}>
                <div>
                  <span className="text-[11px] font-bold text-white block">{b.zone}</span>
                  <span className="text-[9px] text-slate-400 font-mono">Avg Wait: {b.avgWait} · Traffic density: {b.density}%</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${b.status === "Critical" ? "text-rose-400" : b.status === "High" ? "text-amber-400" : "text-slate-400"}`}>
                  {b.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Traffic Stats Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone-Level Traffic Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Zone</th><th className="pb-2">Monthly Visitors</th><th className="pb-2">Avg Dwell</th><th className="pb-2">Traffic Density</th><th className="pb-2">Attention Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {zones.map((z, i) => (
                <tr key={i} className="hover:bg-[#111827]/50 transition">
                  <td className="py-2.5 font-bold text-white">{z.name}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(z.visitors)}</td>
                  <td className="py-2.5 text-slate-300">{z.dwellTime} min</td>
                  <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-[#1E293B] rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{ width: `${z.trafficDensity}%` }} /></div><span className="text-cyan-400 font-bold">{z.trafficDensity}%</span></div></td>
                  <td className="py-2.5"><span className="text-emerald-400 font-bold">{z.attentionScore}/100</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
