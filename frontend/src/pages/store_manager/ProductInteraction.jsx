import React, { useState } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { formatNumber, getCentralScaledData } from "../../services/centralData";
import CustomDateSelector from "../../components/CustomDateSelector";

export default function ProductInteraction() {
  const { telemetry } = useCams();

  // Period States
  const [timePeriod, setTimePeriod] = useState("Last 7 Days");
  const [catPeriod, setCatPeriod] = useState("Last 7 Days");
  const [funnelPeriod, setFunnelPeriod] = useState("Last 7 Days");
  const [recentPeriod, setRecentPeriod] = useState("Last 7 Days");

  // 1. Interactions Over Time (Centralized Sync)
  const timeData = getCentralScaledData(timePeriod);
  const timeVisitors = timeData.kpis.totalVisitors;
  const interactionsOverTime = [
    { time: "9 AM", count: Math.round(timeVisitors * 0.05) },
    { time: "12 PM", count: Math.round(timeVisitors * 0.12) },
    { time: "3 PM", count: Math.round(timeVisitors * 0.18) },
    { time: "5 PM", count: Math.round(timeVisitors * 0.22) },
    { time: "7 PM", count: Math.round(timeVisitors * 0.15) },
    { time: "9 PM", count: Math.round(timeVisitors * 0.06) }
  ];

  // 2. Interactions by Category (Centralized Sync)
  const catData = getCentralScaledData(catPeriod);
  const catVisitors = catData.kpis.totalVisitors;
  const totalCatVal = Math.round(catVisitors * 0.35);
  const categoryData = [
    { name: "Bakery", val: Math.round(catVisitors * 0.12), percent: "30%", color: "#2563EB" },
    { name: "Dairy", val: Math.round(catVisitors * 0.10), percent: "25%", color: "#10B981" },
    { name: "Produce", val: Math.round(catVisitors * 0.08), percent: "20%", color: "#8B5CF6" },
    { name: "Cosmetics", val: Math.round(catVisitors * 0.06), percent: "15%", color: "#EF4444" },
    { name: "Electronics", val: Math.round(catVisitors * 0.04), percent: "10%", color: "#F59E0B" }
  ];

  // 3. Professional Interaction Funnel Progression (REQUIREMENT 4: VIEWED -> PICKED -> COMPARED -> PURCHASED)
  const funnelDataObj = getCentralScaledData(funnelPeriod);
  const funnelVisitors = funnelDataObj.kpis.totalVisitors;
  const funnelStages = [
    { stage: "Viewed", count: Math.round(funnelVisitors * 0.70), percent: "100%", color: "from-blue-600 to-cyan-500", icon: "👁️" },
    { stage: "Picked", count: Math.round(funnelVisitors * 0.35), percent: "50%", color: "from-cyan-500 to-emerald-500", icon: "🛍️" },
    { stage: "Compared", count: Math.round(funnelVisitors * 0.21), percent: "30%", color: "from-emerald-500 to-amber-500", icon: "⚖️" },
    { stage: "Purchased", count: Math.round(funnelVisitors * 0.14), percent: "20%", color: "from-amber-500 to-rose-500", icon: "🛒" }
  ];

  // 4. Recent Interactions
  const recentInteractions = [
    { time: "Just Now", product: "Artisan Sourdough Bread", category: "Bakery", action: "Picked Up", location: "Aisle 1", duration: "12s", badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "3 min ago", product: "Organic Almond Milk", category: "Dairy", action: "Viewed", location: "Aisle 2", duration: "8s", badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "7 min ago", product: "Premium Greek Yogurt", category: "Dairy", action: "Compared", location: "Aisle 2", duration: "15s", badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    { time: "15 min ago", product: "Free-Range Eggs (12pk)", category: "Dairy", action: "Purchased", location: "Checkout C1", duration: "-", badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs pb-6">
      {/* 1. TOP METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Products Viewed</span>
            <h2 className="text-xl font-black text-white">{Math.round(telemetry.totalVisitors * 0.70).toLocaleString()}</h2>
            <span className="text-[10px] text-cyan-400 font-bold">70% View Velocity</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">👁️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Products Picked</span>
            <h2 className="text-xl font-black text-white">{Math.round(telemetry.totalVisitors * 0.35).toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">50% Funnel Pick</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">🛍️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Products Compared</span>
            <h2 className="text-xl font-black text-white">{Math.round(telemetry.totalVisitors * 0.21).toLocaleString()}</h2>
            <span className="text-[10px] text-amber-400 font-bold">30% Comparison</span>
          </div>
          <div className="w-10 h-10 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-lg">⚖️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Purchased Count</span>
            <h2 className="text-xl font-black text-white">{Math.round(telemetry.totalVisitors * 0.14).toLocaleString()}</h2>
            <span className="text-[10px] text-purple-400 font-bold">20% Conversion</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">🛒</div>
        </div>
      </div>

      {/* 2. INTERACTIONS OVER TIME & CATEGORY DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* INTERACTIONS OVER TIME */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Interactions Over Time</h3>
            <CustomDateSelector value={timePeriod} onChange={(newVal) => setTimePeriod(newVal)} />
          </div>
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
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interactions by Category</h3>
            <CustomDateSelector value={catPeriod} onChange={(newVal) => setCatPeriod(newVal)} />
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={45} outerRadius={65} dataKey="val">
                  {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">{totalCatVal.toLocaleString()}</strong>
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

      {/* 3. PROFESSIONAL FUNNEL CHART & RECENT INTERACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PROFESSIONAL INTERACTION FUNNEL CHART (REQUIREMENT 4) */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Professional Product Interaction Funnel</h3>
            <CustomDateSelector value={funnelPeriod} onChange={(newVal) => setFunnelPeriod(newVal)} />
          </div>

          <div className="space-y-3 pt-2">
            {funnelStages.map((f, idx) => {
              // Calculate tapered width for realistic funnel visual styling
              const widthPct = 100 - idx * 18;
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-full py-2.5 px-4 bg-gradient-to-r ${f.color} rounded-xl shadow-lg border border-white/10 flex items-center justify-between transition-all duration-300`}
                    style={{ width: `${widthPct}%` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{f.icon}</span>
                      <span className="font-extrabold text-white text-xs tracking-wider uppercase">{f.stage}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-white text-xs block">{formatNumber(f.count)}</span>
                      <span className="text-[9px] text-white/80 font-bold block">{f.percent} Conversion</span>
                    </div>
                  </div>
                  {idx < funnelStages.length - 1 && (
                    <div className="text-slate-600 text-xs py-0.5 animate-bounce">▼</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT PRODUCT INTERACTIONS */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Interactions Detected</h3>
            <CustomDateSelector value={recentPeriod} onChange={(newVal) => setRecentPeriod(newVal)} />
          </div>
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
