import React from "react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { formatNumber } from "../../services/centralData";

export default function ProductInteraction() {
  const { dateRange, selectedCamera, telemetry } = useCams();

  const interactionsOverTime = [
    { time: "9 AM", count: Math.round(telemetry.totalVisitors * 0.05) },
    { time: "12 PM", count: Math.round(telemetry.totalVisitors * 0.12) },
    { time: "3 PM", count: Math.round(telemetry.totalVisitors * 0.18) },
    { time: "5 PM", count: Math.round(telemetry.totalVisitors * 0.22) },
    { time: "7 PM", count: Math.round(telemetry.totalVisitors * 0.15) },
    { time: "9 PM", count: Math.round(telemetry.totalVisitors * 0.06) }
  ];

  const categoryData = [
    { name: "Bakery", val: Math.round(telemetry.totalVisitors * 0.12), percent: "30%", color: "#2563EB" },
    { name: "Dairy", val: Math.round(telemetry.totalVisitors * 0.10), percent: "25%", color: "#10B981" },
    { name: "Produce", val: Math.round(telemetry.totalVisitors * 0.08), percent: "20%", color: "#8B5CF6" },
    { name: "Cosmetics", val: Math.round(telemetry.totalVisitors * 0.06), percent: "15%", color: "#EF4444" },
    { name: "Electronics", val: Math.round(telemetry.totalVisitors * 0.04), percent: "10%", color: "#F59E0B" }
  ];

  const funnelData = [
    { stage: "Views detected", count: Math.round(telemetry.totalVisitors * 0.65), percent: "65%" },
    { stage: "Interactions detected", count: Math.round(telemetry.totalVisitors * 0.35), percent: "35%" },
    { stage: "Product Pickups", count: Math.round(telemetry.totalVisitors * 0.15), percent: "15%" },
    { stage: "Cart Additions", count: Math.round(telemetry.totalVisitors * 0.10), percent: "10%" }
  ];

  const recentInteractions = [
    { time: "Just Now", product: "Artisan Sourdough Bread", category: "Bakery", action: "Picked Up", location: "Aisle 1", duration: "12s", badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "3 min ago", product: "Organic Almond Milk", category: "Dairy", action: "Viewed", location: "Aisle 2", duration: "8s", badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "7 min ago", product: "Premium Greek Yogurt", category: "Dairy", action: "Picked Up", location: "Aisle 2", duration: "15s", badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "15 min ago", product: "Free-Range Eggs (12pk)", category: "Dairy", action: "Added to Cart", location: "Aisle 2", duration: "-", badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. TOP METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Products Picked</span>
            <h2 className="text-xl font-black text-white font-mono">{Math.round(telemetry.totalVisitors * 0.15).toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">Camera: {selectedCamera}</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">👥</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Conversion Rate</span>
            <h2 className="text-xl font-black text-white font-mono">{telemetry.conversionRate}%</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">Date Range: {dateRange}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">🛍️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Views detected</span>
            <h2 className="text-xl font-black text-white font-mono">{Math.round(telemetry.totalVisitors * 0.65).toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">65% of total</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">⏱️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Added to Cart</span>
            <h2 className="text-xl font-black text-white font-mono">{Math.round(telemetry.totalVisitors * 0.10).toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">10% of total</span>
          </div>
          <div className="w-10 h-10 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-lg">🛒</div>
        </div>
      </div>

      {/* Exactly Two Components Per Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* INTERACTIONS OVER TIME */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Interactions Over Time</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={interactionsOverTime}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Interactions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CATEGORY DONUT CHART */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interactions by Category</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={45} outerRadius={65} dataKey="val">
                  {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">{Math.round(telemetry.totalVisitors * 0.35).toLocaleString()}</strong>
              <span className="text-[9px] text-slate-400 block">Interactions</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </span>
                <strong className="text-white ml-1">{item.percent}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* INTERACTION FUNNEL PROGRESSION */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interaction Funnel Progression</h3>
          <div className="space-y-3 pt-2">
            {funnelData.map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-300">{f.stage}</span>
                  <span className="text-white font-bold">{formatNumber(f.count)} ({f.percent})</span>
                </div>
                <div className="h-2 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: f.percent }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT PRODUCT INTERACTIONS */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Interactions Detected</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {recentInteractions.map((act, i) => (
                  <tr key={i} className="hover:bg-[#070C18]/50 transition">
                    <td className="py-2.5 text-slate-400">{act.time}</td>
                    <td className="py-2.5 font-bold text-white">{act.product}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${act.badgeBg}`}>
                        {act.action}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{act.location}</td>
                    <td className="py-2.5 text-slate-400">{act.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
