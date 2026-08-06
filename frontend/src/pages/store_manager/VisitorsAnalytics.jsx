import React from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { formatNumber } from "../../services/centralData";

export default function VisitorsAnalytics() {
  const { telemetry } = useCams();

  const visitorsByHour = [
    { time: "9 AM", visitors: Math.round(telemetry.peakHourTraffic * 0.3) },
    { time: "12 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.75) },
    { time: "3 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.9) },
    { time: "5 PM", visitors: telemetry.peakHourTraffic },
    { time: "7 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.8) },
    { time: "9 PM", visitors: Math.round(telemetry.peakHourTraffic * 0.35) }
  ];

  const visitorsByZone = [
    { zone: "Entrance", count: Math.round(telemetry.totalVisitors * 0.22), fill: "#2563EB" },
    { zone: "Bakery", count: Math.round(telemetry.totalVisitors * 0.18), fill: "#10B981" },
    { zone: "Dairy", count: Math.round(telemetry.totalVisitors * 0.17), fill: "#8B5CF6" },
    { zone: "Produce", count: Math.round(telemetry.totalVisitors * 0.14), fill: "#F59E0B" },
    { zone: "Cosmetics", count: Math.round(telemetry.totalVisitors * 0.1), fill: "#06B6D4" },
    { zone: "Checkout", count: Math.round(telemetry.totalVisitors * 0.09), fill: "#EC4899" }
  ];

  const segmentationData = [
    { name: "New Visitors", value: Math.round(telemetry.totalVisitors * 0.63), color: "#2563EB" },
    { name: "Returning Visitors", value: Math.round(telemetry.totalVisitors * 0.37), color: "#10B981" }
  ];

  const recentVisitorActivities = [
    { time: "Just Now", zone: "Entrance", type: "New Visitor", details: "Group of 3 people entered", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "5 min ago", zone: "Bakery", type: "Returning Visitor", details: "Frequent shopper", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "12 min ago", zone: "Cosmetics", type: "New Visitor", details: "Browsing promotions", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "20 min ago", zone: "Checkout", type: "Returning Visitor", details: "Completed billing", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
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

      {/* Exactly Two Components Per Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* VISITORS BY HOUR */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Hour</h3>
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
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Zone</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorsByZone}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Visitors">
                  {visitorsByZone.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NEW VS RETURNING DONUT CHART */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">New vs Returning Visitors</h3>
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
              <strong className="text-xs text-white block">{telemetry.totalVisitors.toLocaleString()}</strong>
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

        {/* RECENT VISITOR ACTIVITIES EVENT STREAM */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Visitor Activities Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Zone</th>
                  <th className="pb-2">Type</th>
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
                    <td className="py-2.5 text-slate-400">{act.details}</td>
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
