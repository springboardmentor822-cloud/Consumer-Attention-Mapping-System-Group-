import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import CustomDateSelector from "../../components/CustomDateSelector";

function getMultiplier(period) {
  switch (period) {
    case "Yesterday": return 0.92;
    case "Last 7 Days": return 1.4;
    case "Last 30 Days": return 2.1;
    case "Custom Date Range": return 1.2;
    default: return 1.0;
  }
}

export default function ShelfPerformance() {
  // Widget Period States
  const [timePeriod, setTimePeriod] = useState("Last 7 Days");
  const [zonePeriod, setZonePeriod] = useState("Last 7 Days");
  const [heatmapPeriod, setHeatmapPeriod] = useState("Last 7 Days");
  const [overviewPeriod, setOverviewPeriod] = useState("Last 7 Days");
  const [topPeriod, setTopPeriod] = useState("Last 7 Days");

  // Multipliers
  const multTime = getMultiplier(timePeriod);
  const shelfEngagementTime = [
    { time: "12 AM", engagement: Math.min(99, Math.round(32 * multTime)) },
    { time: "3 AM", engagement: Math.min(99, Math.round(42 * multTime)) },
    { time: "6 AM", engagement: Math.min(99, Math.round(54 * multTime)) },
    { time: "9 AM", engagement: Math.min(99, Math.round(68 * multTime)) },
    { time: "12 PM", engagement: Math.min(99, Math.round(62 * multTime)) },
    { time: "3 PM", engagement: Math.min(99, Math.round(78 * multTime)) },
    { time: "5 PM", engagement: Math.min(99, Math.round(72.4 * multTime)) },
    { time: "6 PM", engagement: Math.min(99, Math.round(70 * multTime)) },
    { time: "9 PM", engagement: Math.min(99, Math.round(72 * multTime)) }
  ];

  const multZone = getMultiplier(zonePeriod);
  const engagementByZone = [
    { zone: "Aisle A", val: Math.min(99, Math.round(85.6 * multZone)), fill: "#2563EB" },
    { zone: "Aisle B", val: Math.min(99, Math.round(72.1 * multZone)), fill: "#10B981" },
    { zone: "Aisle C", val: Math.min(99, Math.round(68.3 * multZone)), fill: "#8B5CF6" },
    { zone: "Promo Area", val: Math.min(99, Math.round(64.2 * multZone)), fill: "#F59E0B" },
    { zone: "Checkout", val: Math.min(99, Math.round(58.7 * multZone)), fill: "#EC4899" },
    { zone: "Others", val: Math.min(99, Math.round(46.3 * multZone)), fill: "#06B6D4" }
  ];

  const multOverview = getMultiplier(overviewPeriod);
  const shelfOverviewTable = [
    { id: 1, name: "Shelf A3", zone: "Aisle A", engagement: `${(85.6 * (multOverview > 1 ? 1.05 : multOverview)).toFixed(1)}%`, dwell: `${Math.round(32 * multOverview)}s`, trend: "↑ 12.4%", color: "text-emerald-400" },
    { id: 2, name: "Shelf A1", zone: "Aisle A", engagement: `${(78.3 * (multOverview > 1 ? 1.03 : multOverview)).toFixed(1)}%`, dwell: `${Math.round(30 * multOverview)}s`, trend: "↑ 8.6%", color: "text-emerald-400" },
    { id: 3, name: "Shelf B2", zone: "Aisle B", engagement: `${(72.1 * (multOverview > 1 ? 1.02 : multOverview)).toFixed(1)}%`, dwell: `${Math.round(26 * multOverview)}s`, trend: "↑ 6.7%", color: "text-emerald-400" },
    { id: 4, name: "Shelf C1", zone: "Aisle C", engagement: `${(68.3 * (multOverview > 1 ? 1.01 : multOverview)).toFixed(1)}%`, dwell: `${Math.round(24 * multOverview)}s`, trend: "↑ 4.3%", color: "text-emerald-400" },
    { id: 5, name: "Promo Shelf 1", zone: "Promo Area", engagement: `${(64.2 * (multOverview > 1 ? 1.0 : multOverview)).toFixed(1)}%`, dwell: `${Math.round(23 * multOverview)}s`, trend: "↑ 3.1%", color: "text-emerald-400" },
    { id: 6, name: "Checkout Shelf", zone: "Checkout", engagement: `${(58.7 * (multOverview > 1 ? 0.98 : multOverview)).toFixed(1)}%`, dwell: `${Math.round(20 * multOverview)}s`, trend: "↓ 2.4%", color: "text-rose-400" },
    { id: 7, name: "End Cap 2", zone: "Aisle B", engagement: `${(46.3 * (multOverview > 1 ? 0.95 : multOverview)).toFixed(1)}%`, dwell: `${Math.round(18 * multOverview)}s`, trend: "↓ 5.6%", color: "text-rose-400" }
  ];

  const multTop = getMultiplier(topPeriod);
  const topPerformingShelvesList = [
    { rank: 1, name: "Shelf A3", zone: "Aisle A", score: `${(85.6 * (multTop > 1 ? 1.05 : multTop)).toFixed(1)}%`, badgeBg: "bg-amber-500 text-black" },
    { rank: 2, name: "Shelf A1", zone: "Aisle A", score: `${(78.3 * (multTop > 1 ? 1.03 : multTop)).toFixed(1)}%`, badgeBg: "bg-slate-700 text-slate-300" },
    { rank: 3, name: "Shelf B2", zone: "Aisle B", score: `${(72.1 * (multTop > 1 ? 1.02 : multTop)).toFixed(1)}%`, badgeBg: "bg-amber-700 text-amber-200" },
    { rank: 4, name: "Shelf C1", zone: "Aisle C", score: `${(68.3 * (multTop > 1 ? 1.01 : multTop)).toFixed(1)}%`, badgeBg: "bg-slate-800 text-slate-400" },
    { rank: 5, name: "Promo Shelf 1", zone: "Promo Area", score: `${(64.2 * (multTop > 1 ? 1.0 : multTop)).toFixed(1)}%`, badgeBg: "bg-slate-800 text-slate-400" }
  ];

  const shelfInsights = [
    { time: "05:30 PM", msg: "Shelf A3 engagement is up by 12.4% compared to baseline.", icon: "↑", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { time: "05:10 PM", msg: "Aisle B shelves have peak engagement between 04:00 PM - 06:00 PM.", icon: "ℹ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { time: "04:45 PM", msg: "End Cap 2 engagement is low. Consider adjusting product placement.", icon: "⚠️", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { time: "04:30 PM", msg: "Promo Shelf 1 dwell time increased by 9.8%.", icon: "↑", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { time: "03:55 PM", msg: "Checkout shelf engagement dropped by 2.4%.", icon: "ℹ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
  ];

  return (
    <div className="space-y-5 font-sans text-xs pb-6">
      {/* 1. TOP 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Avg. Shelf Engagement</span>
            <h2 className="text-xl font-black text-white font-mono">72.4%</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 8.6% vs yesterday</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">
            📊
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
            <span className="text-slate-400 text-[11px] block">Avg. Dwell Time</span>
            <h2 className="text-xl font-black text-white font-mono">28s</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 7.2% vs yesterday</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">
            👁️
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Top Performing Shelf</span>
            <h2 className="text-xl font-black text-white font-mono">Shelf A3</h2>
            <span className="text-[10px] text-slate-400 font-mono">Engagement: 85.6%</span>
          </div>
          <div className="w-10 h-10 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-lg">
            🎯
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Low Performing Shelves</span>
            <h2 className="text-xl font-black text-white font-mono">3</h2>
            <span className="text-[10px] text-rose-400 font-mono">Needs attention</span>
          </div>
          <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center text-lg">
            📈
          </div>
        </div>
      </div>

      {/* 2. THREE CHARTS/VISUALIZATIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SHELF ENGAGEMENT OVER TIME */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Engagement Over Time</h3>
            <CustomDateSelector value={timePeriod} onChange={setTimePeriod} />
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shelfEngagementTime}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="engagement" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Engagement %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ENGAGEMENT BY SHELF ZONE */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Engagement by Shelf Zone</h3>
            <CustomDateSelector value={zonePeriod} onChange={setZonePeriod} />
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementByZone}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]} name="Engagement %">
                  {engagementByZone.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SHELF ENGAGEMENT HEATMAP (REQUIREMENT 3: REPLACED WITH SYNCHRONIZED HEATMAP MODEL INSIDE EXISTING CONTAINER) */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Engagement Heatmap</h3>
            <CustomDateSelector value={heatmapPeriod} onChange={setHeatmapPeriod} />
          </div>
          <div className="w-full h-56 overflow-hidden rounded-xl border border-[#1E293B]">
            <StoreHeatmapModel />
          </div>
        </div>
      </div>

      {/* 3. OVERVIEW TABLE, TOP SHELVES, & INSIGHTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SHELF PERFORMANCE OVERVIEW TABLE */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Performance Overview</h3>
            <CustomDateSelector value={overviewPeriod} onChange={setOverviewPeriod} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Shelf Name</th>
                  <th className="pb-2">Zone</th>
                  <th className="pb-2">Engagement</th>
                  <th className="pb-2">Dwell Time</th>
                  <th className="pb-2">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {shelfOverviewTable.map((row) => (
                  <tr key={row.id} className="hover:bg-[#070C18]/50 transition">
                    <td className="py-2.5 text-slate-500">{row.id}</td>
                    <td className="py-2.5 font-bold text-white">{row.name}</td>
                    <td className="py-2.5 text-slate-400">{row.zone}</td>
                    <td className="py-2.5 text-slate-300">{row.engagement}</td>
                    <td className="py-2.5 text-slate-300">{row.dwell}</td>
                    <td className={`py-2.5 font-bold ${row.color}`}>{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP PERFORMING SHELVES LIST */}
        <div className="lg:col-span-3 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Shelves</h3>
            <CustomDateSelector value={topPeriod} onChange={setTopPeriod} />
          </div>
          <div className="space-y-2.5">
            {topPerformingShelvesList.map((item) => (
              <div key={item.rank} className="p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[10px] ${item.badgeBg}`}>
                    {item.rank}
                  </div>
                  <div>
                    <span className="font-bold text-white block text-xs">{item.name}</span>
                    <span className="text-[9px] text-slate-400 block">{item.zone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 block">{item.score}</span>
                  <span className="text-[9px] text-slate-500 block">Engagement</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHELF INSIGHTS & ALERTS */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono text-[11px]">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Insights & Alerts</h3>
            <span className="text-emerald-400 text-[10px] font-bold">● Active</span>
          </div>
          <div className="space-y-3">
            {shelfInsights.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between space-x-3 p-2 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <div className="flex items-start space-x-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${item.color}`}>
                    {item.icon}
                  </span>
                  <span className="text-slate-300 text-[10px] leading-relaxed">{item.msg}</span>
                </div>
                <span className="text-[9px] text-slate-500 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
