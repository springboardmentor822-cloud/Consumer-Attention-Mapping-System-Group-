import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { useCams } from "../../services/CamsContext";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import CustomDateSelector from "../../components/CustomDateSelector";
import { getCentralScaledData } from "../../services/centralData";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function ShelfPerformance() {
  const { liveTrackedPersons, globalFilter } = useCams(); // Subscribe to context changes
  const [selectedZone, setSelectedZone] = useState(null);

  const selectedPeriod = globalFilter?.dateRange || "Last 7 Days";
  const customRange = globalFilter?.dateRange === "Custom Date Range" ? globalFilter : null;

  // Synchronized Central Scaled Data
  const centralData = getCentralScaledData(selectedPeriod, customRange);
  const mult = centralData.mult;


  // Dynamic Metrics for Shelf Performance Overview
  const avgShelfEngagement = Math.min(99, parseFloat((72.4 * (mult > 5 ? 1.05 : mult < 1 ? 0.95 : 1.0)).toFixed(1)));
  const productsInteracted = Math.round(1245 * mult);
  const avgDwellTime = Math.round(28 * (mult > 5 ? 1.1 : mult < 1 ? 0.95 : 1.0));
  const topShelfScore = Math.min(99, parseFloat((85.6 * (mult > 5 ? 1.05 : mult < 1 ? 0.95 : 1.0)).toFixed(1)));
  const lowPerformingCount = mult > 5 ? 5 : mult > 2 ? 4 : 3;

  // Chart 1: Shelf Engagement Over Time
  const shelfEngagementTime = [
    { time: "12 AM", engagement: Math.min(99, Math.round(32 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "3 AM", engagement: Math.min(99, Math.round(42 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "6 AM", engagement: Math.min(99, Math.round(54 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "9 AM", engagement: Math.min(99, Math.round(68 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "12 PM", engagement: Math.min(99, Math.round(62 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "3 PM", engagement: Math.min(99, Math.round(78 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "5 PM", engagement: Math.min(99, Math.round(72.4 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "6 PM", engagement: Math.min(99, Math.round(70 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) },
    { time: "9 PM", engagement: Math.min(99, Math.round(72 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))) }
  ];

  // Chart 2: Engagement by Shelf Zone
  const engagementByZone = [
    { zone: "Aisle A", val: Math.min(99, Math.round(85.6 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))), fill: "#2563EB" },
    { zone: "Aisle B", val: Math.min(99, Math.round(72.1 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))), fill: "#10B981" },
    { zone: "Aisle C", val: Math.min(99, Math.round(68.3 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))), fill: "#8B5CF6" },
    { zone: "Promo Area", val: Math.min(99, Math.round(64.2 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))), fill: "#F59E0B" },
    { zone: "Checkout", val: Math.min(99, Math.round(58.7 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))), fill: "#EC4899" },
    { zone: "Others", val: Math.min(99, Math.round(46.3 * (mult > 5 ? 1.05 : mult < 1 ? 0.92 : 1.0))), fill: "#06B6D4" }
  ];

  // Retrieve shelves from centralData
  const shelvesList = centralData.shelves || [];

  // Table 1: Shelf Performance Overview (calculated dynamically from PostgreSQL shelves)
  const shelfOverviewTable = shelvesList.map((s, idx) => {
    const isEven = idx % 2 === 0;
    const engagementVal = Math.min(99.9, (s.attentionScore || 80) * (mult > 5 ? 1.02 : mult < 1 ? 0.95 : 1.0));
    const dwellVal = Math.round(((s.attentionScore || 80) * 0.3 + 10) * (mult > 5 ? 1.1 : mult < 1 ? 0.95 : 1.0));
    const trendVal = isEven ? `↑ ${(4.5 * mult).toFixed(1)}%` : `↓ ${(2.1 * mult).toFixed(1)}%`;
    const trendColor = isEven ? "text-emerald-400" : "text-rose-400";
    
    return {
      id: idx + 1,
      name: s.name,
      zone: s.zone,
      engagement: `${engagementVal.toFixed(1)}%`,
      dwell: `${dwellVal}s`,
      trend: trendVal,
      color: trendColor,
      scoreNum: engagementVal
    };
  });

  // Table 2: Top Performing Shelves List (derived directly from real records)
  const topPerformingShelvesList = [...shelfOverviewTable]
    .sort((a, b) => b.scoreNum - a.scoreNum)
    .slice(0, 5)
    .map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      zone: item.zone,
      score: item.engagement,
      badgeBg: idx === 0 ? "bg-amber-500 text-black" : idx === 1 ? "bg-slate-700 text-slate-300" : idx === 2 ? "bg-amber-700 text-amber-200" : "bg-slate-800 text-slate-400"
    }));

  // Dynamic Shelf Insights & Alerts based on selectedPeriod
  const getShelfInsights = (period, range) => {
    const rangeText = period === "Custom Date Range" ? (range?.label || "selected date range") : period.toLowerCase();
    return [
      { time: "05:30 PM", msg: `Shelf A3 engagement is up by ${(12.4 * (mult > 5 ? 1.2 : 1.0)).toFixed(1)}% for ${rangeText} compared to baseline.`, icon: "↑", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      { time: "05:10 PM", msg: `Aisle B shelves recorded peak traffic window for ${rangeText}.`, icon: "ℹ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      { time: "04:45 PM", msg: `End Cap 2 engagement remains lower during ${rangeText}. Consider adjusting placement.`, icon: "⚠️", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      { time: "04:30 PM", msg: `Promo Shelf 1 dwell time increased by ${(9.8 * (mult > 5 ? 1.15 : 1.0)).toFixed(1)}% in ${rangeText}.`, icon: "↑", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      { time: "03:55 PM", msg: `Checkout shelf engagement recorded ${(58.7 * (mult > 5 ? 0.98 : 1.0)).toFixed(1)}% average for ${rangeText}.`, icon: "ℹ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
    ];
  };

  const shelfInsights = getShelfInsights(selectedPeriod, customRange);

  return (
    <div className="space-y-5 font-sans text-xs pb-6">
      {/* PAGE HEADER */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white tracking-wide">Shelf Performance Analytics</h1>
          {selectedPeriod === "Custom Date Range" && customRange?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {customRange.label}
            </span>
          )}
        </div>
      </div>

      {/* 1. TOP 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Avg. Shelf Engagement</span>
            <h2 className="text-xl font-black text-white font-mono">{avgShelfEngagement}%</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 8.6% vs previous period</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">
            📊
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Products Interacted</span>
            <h2 className="text-xl font-black text-white font-mono">{productsInteracted.toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 11.3% vs previous period</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">
            🛒
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Avg. Dwell Time</span>
            <h2 className="text-xl font-black text-white font-mono">{avgDwellTime}s</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 7.2% vs previous period</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">
            👁️
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Top Performing Shelf</span>
            <h2 className="text-xl font-black text-white font-mono">Shelf A3</h2>
            <span className="text-[10px] text-slate-400 font-mono">Engagement: {topShelfScore}%</span>
          </div>
          <div className="w-10 h-10 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-lg">
            🎯
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Low Performing Shelves</span>
            <h2 className="text-xl font-black text-white font-mono">{lowPerformingCount}</h2>
            <span className="text-[10px] text-rose-400 font-mono">Needs attention</span>
          </div>
          <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center text-lg">
            📈
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SHELF ENGAGEMENT OVER TIME */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Engagement Over Time</h3>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={shelfEngagementTime}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} itemStyle={{ color: "#F8FAFC" }} labelStyle={{ color: "#94A3B8" }} />
                <Line type="monotone" dataKey="engagement" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Engagement %" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* ENGAGEMENT BY SHELF ZONE — click a bar to identify the zone */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Engagement by Shelf Zone</h3>
            {selectedZone && (
              <button
                onClick={() => setSelectedZone(null)}
                className="text-[9px] text-slate-400 hover:text-white border border-[#1E293B] hover:border-slate-500 px-2 py-0.5 rounded-lg transition"
              >
                ✕ Clear
              </button>
            )}
          </div>
          <div className="h-44 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={engagementByZone}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const clicked = data.activePayload[0].payload;
                    setSelectedZone(prev =>
                      prev && prev.zone === clicked.zone ? null : clicked
                    );
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }}
                  itemStyle={{ color: "#F8FAFC" }}
                  labelStyle={{ color: "#94A3B8" }}
                  formatter={(value, name, props) => [
                    `${value}%`,
                    `Engagement — ${props.payload.zone}`
                  ]}
                />
                <Bar dataKey="val" radius={[4, 4, 0, 0]} name="Engagement %">
                  {engagementByZone.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={selectedZone && selectedZone.zone !== entry.zone ? 0.35 : 1}
                      stroke={selectedZone && selectedZone.zone === entry.zone ? "#fff" : "transparent"}
                      strokeWidth={selectedZone && selectedZone.zone === entry.zone ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>

          {/* Selected Zone Detail Panel */}
          {selectedZone ? (
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5 border"
              style={{
                backgroundColor: `${selectedZone.fill}18`,
                borderColor: `${selectedZone.fill}55`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedZone.fill }}
                />
                <div>
                  <span className="text-white font-bold text-[11px] block">{selectedZone.zone}</span>
                  <span className="text-[9px] text-slate-400">Selected shelf zone</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-sm block" style={{ color: selectedZone.fill }}>
                  {selectedZone.val}%
                </span>
                <span className="text-[9px] text-slate-400">Engagement</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-[9px] text-slate-600 py-1">
              Click any bar to identify the shelf zone
            </div>
          )}
        </div>

        {/* SHELF ENGAGEMENT HEATMAP */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Engagement Heatmap</h3>
          </div>
          <div className="w-full h-56 overflow-hidden rounded-xl border border-[#1E293B] relative bg-[#040814]">
            <div className="scale-[0.45] sm:scale-[0.52] origin-top-left w-[220%] sm:w-[192%] h-[220%] sm:h-[192%]">
              <StoreHeatmapModel
                dateFilter={selectedPeriod}
                customRangeLabel={customRange?.label}
              />
            </div>
          </div>
        </div>

        {/* SHELF INSIGHTS & ALERTS — moved into 2-col row as 4th cell */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono text-[11px]">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Insights &amp; Alerts</h3>
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

      {/* 3. TWO-COLUMN TABLE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SHELF PERFORMANCE OVERVIEW TABLE */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Performance Overview</h3>
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
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Shelves</h3>
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
      </div>
    </div>
  );
}
