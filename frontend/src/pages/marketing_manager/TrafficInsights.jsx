import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ComposedChart
} from "recharts";

const Header = ({ navigate }) => (
  <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center space-x-3">
      <button onClick={() => navigate("/marketing-manager")} className="bg-[#182238] hover:bg-[#202C48] text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-xl border border-[#273552] flex items-center space-x-1.5 transition">
        <span>←</span><span>Back</span>
      </button>
      <span className="text-white font-black text-sm tracking-wide">Consumer Attention Mapping System</span>
      <span className="bg-[#B45309]/30 text-[#F59E0B] border border-[#B45309]/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Marketing Manager Portal</span>
    </div>
    <button className="bg-[#3F1A24] hover:bg-[#52212E] text-[#F87171] border border-[#7F1D1D]/50 font-bold px-3 py-1.5 rounded-xl text-xs transition">Logout</button>
  </div>
);

export default function TrafficInsights() {
  const navigate = useNavigate();
  const [view, setView] = useState("Today");

  const hourlyTraffic = [
    { time: "8AM", visitors: 420, conversions: 48 }, { time: "9AM", visitors: 680, conversions: 78 },
    { time: "10AM", visitors: 920, conversions: 112 }, { time: "11AM", visitors: 1240, conversions: 158 },
    { time: "12PM", visitors: 1580, conversions: 202 }, { time: "1PM", visitors: 1820, conversions: 248 },
    { time: "2PM", visitors: 1560, conversions: 218 }, { time: "3PM", visitors: 1720, conversions: 228 },
    { time: "4PM", visitors: 2100, conversions: 294 }, { time: "5PM", visitors: 2480, conversions: 346 },
    { time: "6PM", visitors: 2820, conversions: 394 }, { time: "7PM", visitors: 2240, conversions: 308 },
    { time: "8PM", visitors: 1680, conversions: 228 }, { time: "9PM", visitors: 960, conversions: 128 },
  ];

  const zoneTraffic = [
    { zone: "Entrance", traffic: 8420, peak: "6PM", avg_dwell: "8.4s" },
    { zone: "Electronics", traffic: 3280, peak: "5PM", avg_dwell: "28.7s" },
    { zone: "Apparel", traffic: 4120, peak: "4PM", avg_dwell: "19.2s" },
    { zone: "Grocery", traffic: 6840, peak: "1PM", avg_dwell: "8.4s" },
    { zone: "Checkout", traffic: 5920, peak: "7PM", avg_dwell: "34.1s" },
    { zone: "Promotions", traffic: 2140, peak: "6PM", avg_dwell: "22.6s" },
  ];

  const weeklyComparison = [
    { day: "Mon", thisWeek: 8200, lastWeek: 7600 },
    { day: "Tue", thisWeek: 9100, lastWeek: 8200 },
    { day: "Wed", thisWeek: 8750, lastWeek: 8100 },
    { day: "Thu", thisWeek: 10200, lastWeek: 9400 },
    { day: "Fri", thisWeek: 12400, lastWeek: 11200 },
    { day: "Sat", thisWeek: 16800, lastWeek: 14900 },
    { day: "Sun", thisWeek: 15200, lastWeek: 13800 },
  ];

  const peakHours = [
    { period: "Morning (8–11AM)", traffic: "2,020", pct: "16%", color: "bg-blue-500" },
    { period: "Midday (11AM–2PM)", traffic: "4,640", pct: "37%", color: "bg-purple-500" },
    { period: "Afternoon (2–5PM)", traffic: "3,560", pct: "28%", color: "bg-amber-500" },
    { period: "Evening (5–9PM)", traffic: "5,960", pct: "47%", color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">🚶 Traffic Insights</h1>
          <p className="text-slate-400 text-xs">Analyze consumer footfall patterns, peak hours, and zone-level traffic distribution.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["Today", "This Week", "This Month"].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${view === v ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Visitors Today", val: "16,820", sub: "↑ 12.4% vs yesterday" },
          { label: "Peak Hour Traffic", val: "2,820", sub: "6–7 PM peak" },
          { label: "Avg. Store Dwell", val: "18.4 min", sub: "↑ 2.1 min" },
          { label: "Footfall Conversion", val: "12.8%", sub: "↑ 1.4%" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Hourly Traffic */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase">Hourly Traffic & Conversions (Today)</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyTraffic}>
              <defs>
                <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
              <YAxis yAxisId="left" stroke="#64748B" fontSize={9} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              <Area yAxisId="left" type="monotone" dataKey="visitors" stroke="#8B5CF6" strokeWidth={2} fill="url(#trafficGrad)" name="Visitors" />
              <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#F59E0B" strokeWidth={2} name="Conversions" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Weekly Comparison */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">This Week vs Last Week</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyComparison}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="thisWeek" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="This Week" />
                <Bar dataKey="lastWeek" fill="#1E293B" radius={[4, 4, 0, 0]} name="Last Week" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Traffic by Time Period</h3>
          <div className="space-y-3 pt-1">
            {peakHours.map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300 font-bold">{p.period}</span>
                  <span className="text-white font-mono">{p.traffic} <span className="text-slate-400">({p.pct})</span></span>
                </div>
                <div className="h-2.5 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: p.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Traffic Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase">Zone-level Traffic Analysis</h3>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">Zone</th><th className="pb-2">Today's Traffic</th>
              <th className="pb-2">Peak Hour</th><th className="pb-2">Avg. Dwell</th><th className="pb-2">Traffic Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {zoneTraffic.map((z, i) => {
              const total = zoneTraffic.reduce((s, x) => s + x.traffic, 0);
              const pct = Math.round((z.traffic / total) * 100);
              return (
                <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                  <td className="py-2 font-bold text-white">{z.zone}</td>
                  <td className="py-2 text-slate-300 font-mono">{z.traffic.toLocaleString()}</td>
                  <td className="py-2 text-amber-400 font-bold">{z.peak}</td>
                  <td className="py-2 text-blue-400 font-bold">{z.avg_dwell}</td>
                  <td className="py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct * 3}%` }}></div>
                      </div>
                      <span className="text-white font-bold">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
