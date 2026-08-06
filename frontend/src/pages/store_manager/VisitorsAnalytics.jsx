import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { formatNumber, getCentralScaledData } from "../../services/centralData";

const PERIOD_OPTIONS = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Custom Date Range"];

export default function VisitorsAnalytics() {
  const { telemetry } = useCams();

  // Widget Date Filter States
  const [hourPeriod, setHourPeriod] = useState("Today");
  const [zonePeriod, setZonePeriod] = useState("Today");
  const [segmentPeriod, setSegmentPeriod] = useState("Today");
  const [topZonesPeriod, setTopZonesPeriod] = useState("Today");
  const [activityPeriod, setActivityPeriod] = useState("Today");

  // 1. Visitors by Hour (Centralized Sync)
  const hourData = getCentralScaledData(hourPeriod);
  const visitorsByHour = hourData.visitorsByHour;

  // 2. Visitors by Zone (Centralized Sync)
  const zoneData = getCentralScaledData(zonePeriod);
  const visitorsByZone = zoneData.customersByZone;

  // 3. New vs Returning Visitors (Centralized Sync)
  const segmentData = getCentralScaledData(segmentPeriod);
  const segmentationData = segmentData.segmentationData;
  const totalSegmentVisitors = segmentData.kpis.totalVisitors;

  // 4. Top Zones List (Centralized Sync)
  const topZonesData = getCentralScaledData(topZonesPeriod);
  const topVisitors = topZonesData.kpis.totalVisitors;
  const topZonesList = [
    { rank: 1, name: "Main Entrance & Foyer", visitors: Math.round(topVisitors * 0.28), share: 28, color: "bg-blue-500" },
    { rank: 2, name: "Bakery Endcap Hotspot", visitors: Math.round(topVisitors * 0.22), share: 22, color: "bg-emerald-500" },
    { rank: 3, name: "Dairy & Beverage Aisle", visitors: Math.round(topVisitors * 0.19), share: 19, color: "bg-purple-500" },
    { rank: 4, name: "Fresh Produce Bins", visitors: Math.round(topVisitors * 0.16), share: 16, color: "bg-amber-500" },
    { rank: 5, name: "Cosmetics Display", visitors: Math.round(topVisitors * 0.15), share: 15, color: "bg-cyan-500" }
  ];

  // 5. Recent Visitor Activities Log
  const actMult = Math.round(getCentralScaledData(activityPeriod).mult);
  const recentVisitorActivities = [
    { time: "Just Now", zone: "Entrance", type: "New Visitor", count: 3 * actMult, details: "Group entered via Main Entrance", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "5 min ago", zone: "Bakery", type: "Returning Visitor", count: 1 * actMult, details: "Frequent shopper at Bakery shelf", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "12 min ago", zone: "Cosmetics", type: "New Visitor", count: 2 * actMult, details: "Browsing beauty promotions", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "20 min ago", zone: "Checkout", type: "Returning Visitor", count: 4 * actMult, details: "Completed billing at Counter 2", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "32 min ago", zone: "Produce", type: "New Visitor", count: 2 * actMult, details: "Selecting fresh organic items", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs pb-6">
      {/* 1. TOP METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Total Visitors</span>
            <h2 className="text-xl font-black text-white font-mono">{telemetry.totalVisitors.toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ {telemetry.totalVisitorsChange}%</span>
          </div>
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-xl">👥</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Avg Attention Time</span>
            <h2 className="text-xl font-black text-white font-mono">{telemetry.avgAttentionTime}s</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ {telemetry.avgAttentionTimeChange}%</span>
          </div>
          <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-xl">👤</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">New Visitors</span>
            <h2 className="text-xl font-black text-white font-mono">{Math.round(telemetry.totalVisitors * 0.63).toLocaleString()}</h2>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">63% of total</span>
          </div>
          <div className="w-12 h-12 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-xl">👤+</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Returning Visitors</span>
            <h2 className="text-xl font-black text-white font-mono">{Math.round(telemetry.totalVisitors * 0.37).toLocaleString()}</h2>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">37% of total</span>
          </div>
          <div className="w-12 h-12 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl">🕒</div>
        </div>
      </div>

      {/* ROW 1: VISITORS BY HOUR & VISITORS BY ZONE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* VISITORS BY HOUR */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Hour</h3>
            <select
              value={hourPeriod}
              onChange={(e) => setHourPeriod(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {PERIOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorsByHour}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* VISITORS BY ZONE */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Zone</h3>
            <select
              value={zonePeriod}
              onChange={(e) => setZonePeriod(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {PERIOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorsByZone}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]} name="Visitors">
                  {visitorsByZone.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: NEW VS RETURNING & TOP ZONES LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NEW VS RETURNING DONUT CHART */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">New vs Returning Visitors</h3>
            <select
              value={segmentPeriod}
              onChange={(e) => setSegmentPeriod(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {PERIOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentationData} innerRadius={45} outerRadius={65} dataKey="value">
                  {segmentationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[9px] text-slate-400 block">Total</span>
              <strong className="text-xs text-white block">{totalSegmentVisitors.toLocaleString()}</strong>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {segmentationData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </span>
                <strong className="text-white ml-1">{formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* TOP ZONES LIST */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Zones List</h3>
            <select
              value={topZonesPeriod}
              onChange={(e) => setTopZonesPeriod(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {PERIOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {topZonesList.map((z) => (
              <div key={z.rank} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#070C18] border border-[#1E293B] flex items-center justify-center text-[9px] font-black text-cyan-400">
                      #{z.rank}
                    </span>
                    <span className="font-bold text-white truncate max-w-[180px]">{z.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-bold">{z.visitors.toLocaleString()} visitors</span>
                    <span className="text-emerald-400 font-extrabold text-[10px]">{z.share}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className={`h-full ${z.color} rounded-full transition-all duration-500`} style={{ width: `${z.share * 3}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: RECENT VISITOR ACTIVITIES LOG */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Visitor Activity Logs</h3>
          <select
            value={activityPeriod}
            onChange={(e) => setActivityPeriod(e.target.value)}
            className="bg-[#070C18] border border-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {PERIOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="pb-2">Time</th>
                <th className="pb-2">Zone</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-cyan-400 font-bold">Visitors Count</th>
                <th className="pb-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {recentVisitorActivities.map((act, i) => (
                <tr key={i} className="hover:bg-[#070C18]/50 transition">
                  <td className="py-2.5 text-slate-400">{act.time}</td>
                  <td className="py-2.5 font-bold text-white">{act.zone}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${act.badgeColor}`}>
                      {act.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-cyan-400 font-extrabold font-mono">{act.count}</td>
                  <td className="py-2.5 text-slate-400">{act.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
