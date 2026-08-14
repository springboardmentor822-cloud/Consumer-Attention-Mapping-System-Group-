import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { dailyTrafficTrend, zones, formatNumber, getCentralScaledData } from "../../services/centralData";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";

export default function StoreTraffic() {
  const { globalFilter } = useCams(); // Read unified global filter from context
  const filter = globalFilter;
  const selectedPeriod = filter.dateRange;

  // All data computed from the single filter
  const telemetry = getCentralScaledData(filter).kpis;
  const trafficFlowTime = getCentralScaledData(filter).visitorsByHour;
  const zonesScaled = getCentralScaledData(filter).customersByZone;
  const entryExitScaled = getCentralScaledData(filter).entryExitPoints;
  const dailyMult = getCentralScaledData(filter).mult;
  const dailyTrendScaled = dailyTrafficTrend.map(d => ({
    ...d,
    scaledVisitors: Math.round(d.visitors * (dailyMult > 1 ? dailyMult * 0.15 : dailyMult))
  }));
  const matrixVisitors = getCentralScaledData(filter).kpis.totalVisitors;
  const matrixScaled = zones.map((z, idx) => ({
    ...z,
    scaledVisitors: Math.round(matrixVisitors * (0.22 - idx * 0.025))
  }));

  // Yesterday vs Today camera-performance comparison data
  const dataYesterday = getCentralScaledData("Yesterday");
  const dataToday = getCentralScaledData("Today");

  const cameraComparison = [
    { id: "CAM-01", name: "Main Central Aisle", yesterday: Math.round(dataYesterday.kpis.totalVisitors * 0.40), today: Math.round(dataToday.kpis.totalVisitors * 0.40) },
    { id: "CAM-02", name: "Produce & Scale Station", yesterday: Math.round(dataYesterday.kpis.totalVisitors * 0.25), today: Math.round(dataToday.kpis.totalVisitors * 0.25) },
    { id: "CAM-03", name: "Checkout Counter #1", yesterday: Math.round(dataYesterday.kpis.totalVisitors * 0.20), today: Math.round(dataToday.kpis.totalVisitors * 0.20) },
    { id: "CAM-04", name: "Checkout Counter #2", yesterday: Math.round(dataYesterday.kpis.totalVisitors * 0.15), today: Math.round(dataToday.kpis.totalVisitors * 0.15) }
  ];


  return (
    <div className="space-y-6 font-sans text-xs pb-6">
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-xl font-black text-white tracking-wide">Traffic Analytics</h1>
      </div>

      {/* 1. TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Total Footfall</span>
            <h2 className="text-xl font-black text-white">{telemetry.totalVisitors.toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">↑ {telemetry.totalVisitorsChange}%</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">👥</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Avg. Dwell Time</span>
            <h2 className="text-xl font-black text-white">{telemetry.avgDwellTime} min</h2>
            <span className="text-[10px] text-emerald-400 font-bold">↑ {telemetry.avgDwellTimeChange}%</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">🔄</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Peak Hour Traffic</span>
            <h2 className="text-xl font-black text-white">{telemetry.peakHourTraffic} / hr</h2>
            <span className="text-[10px] text-slate-400">{telemetry.peakHour}</span>
          </div>
          <div className="w-10 h-10 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-lg">🕒</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Primary Entry Point</span>
            <h2 className="text-xl font-black text-white">Main Entrance</h2>
            <span className="text-[10px] text-emerald-400 font-bold">58.2% Share</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">🔀</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Flow Velocity</span>
            <h2 className="text-xl font-black text-white">1.2 m/s</h2>
            <span className="text-[10px] text-slate-400">Normal Pace</span>
          </div>
          <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center text-lg">👨‍👩‍👧‍👦</div>
        </div>
      </div>

      {/* YESTERDAY VS TODAY CAMERA PERFORMANCE COMPARISON */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Yesterday vs Today Camera Performance Comparison</h3>
          </div>
          <span className="text-[10px] text-slate-500">Live Traffic Feed Analysis</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cameraComparison.map((cam) => {
            const pctChange = cam.yesterday > 0 
              ? (((cam.today - cam.yesterday) / cam.yesterday) * 100).toFixed(1) 
              : "0.0";
            const isPositive = parseFloat(pctChange) >= 0;

            return (
              <div key={cam.id} className="bg-[#070C18] border border-[#1E293B] p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">{cam.id}</span>
                    <strong className="text-white text-xs truncate block max-w-[150px]">{cam.name}</strong>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {isPositive ? "↑" : "↓"} {Math.abs(pctChange)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-[11px] pt-1">
                  <div className="bg-[#0F172A] p-2 rounded border border-[#1E293B]">
                    <span className="text-[9px] text-slate-500 block">Yesterday</span>
                    <strong className="text-slate-300 font-mono">{cam.yesterday}</strong>
                  </div>
                  <div className="bg-[#0F172A] p-2 rounded border border-[#1E293B]">
                    <span className="text-[9px] text-slate-500 block">Today</span>
                    <strong className="text-emerald-400 font-mono">{cam.today}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. STORE HEATMAP DISPLAYED DIRECTLY ON STORE TRAFFIC PAGE (REQUIREMENT 2) */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Heatmap & Traffic Flow Matrix</h3>
          </div>
        </div>

        <StoreHeatmapModel />
      </div>

      {/* 3. TRAFFIC FLOW OVER TIME & TRAFFIC BY ZONE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TRAFFIC FLOW OVER TIME */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic Flow Over Time</h3>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficFlowTime}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* TRAFFIC BY ZONE */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic by Zone</h3>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={zonesScaled} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={9} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="val" radius={[0, 4, 4, 0]} name="Visitors">
                  {zonesScaled.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* 4. ENTRY & EXIT VELOCITY & DAILY TRAFFIC TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ENTRY & EXIT VELOCITY */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Entry & Exit Velocity</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {entryExitScaled.map((pt, i) => (
              <div key={i} className="bg-[#070C18] border border-[#1E293B] p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">{pt.name}</span>
                <h4 className="text-xl font-bold text-white">{formatNumber(pt.scaledEntries)}</h4>
                <span className="text-[9px] text-emerald-400 font-bold block">Share: {pt.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* TRAFFIC BY DAY */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic by Day</h3>
          </div>
          <div className="h-44 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendScaled}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="scaledVisitors" fill="#2563EB" radius={[4, 4, 0, 0]} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* 5. ZONE TRAFFIC SUMMARY MATRIX TABLE */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Traffic Summary Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Zone</th>
                <th className="pb-2">Visitors</th>
                <th className="pb-2">% Share</th>
                <th className="pb-2">Avg. Dwell Time</th>
                <th className="pb-2">Attention Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {matrixScaled.map((row, i) => (
                <tr key={i} className="hover:bg-[#070C18]/50 transition">
                  <td className="py-2.5 font-bold text-white">{row.name}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(row.scaledVisitors)}</td>
                  <td className="py-2.5 text-slate-400">{row.trafficDensity}%</td>
                  <td className="py-2.5 text-slate-300">{row.dwellTime} min</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{row.attentionScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
