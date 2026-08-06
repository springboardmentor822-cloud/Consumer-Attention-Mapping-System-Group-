import React from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { dailyTrafficTrend, entryExitPoints, zones, formatNumber } from "../../services/centralData";

export default function StoreTraffic() {
  const { telemetry } = useCams();

  const trafficFlowTime = [
    { time: "9 AM", visitors: Math.round(telemetry.peakHourTraffic * 0.3) },
    { time: "12 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.75) },
    { time: "3 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.9) },
    { time: "5 PM", visitors: telemetry.peakHourTraffic },
    { time: "7 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.8) },
    { time: "9 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.35) }
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Total Footfall</span>
            <h2 className="text-xl font-black text-white font-mono">{telemetry.totalVisitors.toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ {telemetry.totalVisitorsChange}%</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">👥</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Avg. Dwell Time</span>
            <h2 className="text-xl font-black text-white font-mono">{telemetry.avgDwellTime} min</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ {telemetry.avgDwellTimeChange}%</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">🔄</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Peak Hour Traffic</span>
            <h2 className="text-xl font-black text-white font-mono">{telemetry.peakHourTraffic} / hr</h2>
            <span className="text-[10px] text-slate-400 font-mono">{telemetry.peakHour}</span>
          </div>
          <div className="w-10 h-10 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-lg">🕒</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Primary Entry Point</span>
            <h2 className="text-xl font-black text-white font-mono">Main Entrance</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">58.2% Share</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">🔀</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">Flow Velocity</span>
            <h2 className="text-xl font-black text-white font-mono">1.2 m/s</h2>
            <span className="text-[10px] text-slate-400 font-mono">Normal Pace</span>
          </div>
          <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center text-lg">👨‍👩‍👧‍👦</div>
        </div>
      </div>

      {/* Exactly Two Components Per Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TRAFFIC FLOW OVER TIME */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic Flow Over Time</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficFlowTime}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TRAFFIC BY ZONE */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic by Zone</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones.slice(0, 6)} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={9} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="visitors" radius={[0, 4, 4, 0]} name="Visitors">
                  {zones.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ENTRY & EXIT COUNT */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Entry & Exit Velocity</h3>
          <div className="grid grid-cols-2 gap-3">
            {entryExitPoints.map((pt, i) => (
              <div key={i} className="bg-[#070C18] border border-[#1E293B] p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">{pt.name}</span>
                <h4 className="text-xl font-bold text-white">{formatNumber(pt.entries)}</h4>
                <span className="text-[9px] text-emerald-400 font-bold block">Share: {pt.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* TRAFFIC BY DAY (THIS WEEK) */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic by Day (This Week)</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrafficTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="visitors" fill="#2563EB" radius={[4, 4, 0, 0]} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ZONE TRAFFIC SUMMARY TABLE */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Traffic Summary Matrix</h3>
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
              {zones.map((row, i) => (
                <tr key={i} className="hover:bg-[#070C18]/50 transition">
                  <td className="py-2.5 font-bold text-white">{row.name}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(row.visitors)}</td>
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
