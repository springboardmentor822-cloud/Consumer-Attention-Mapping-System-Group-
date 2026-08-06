import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
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

export default function CustomerEngagement() {
  const navigate = useNavigate();
  const [segment, setSegment] = useState("All Segments");

  const engagementTrend = [
    { day: "Mon", rate: 28.4, sessions: 3200 }, { day: "Tue", rate: 31.2, sessions: 3850 },
    { day: "Wed", rate: 29.8, sessions: 3400 }, { day: "Thu", rate: 34.5, sessions: 4100 },
    { day: "Fri", rate: 36.2, sessions: 4800 }, { day: "Sat", rate: 38.9, sessions: 5600 },
    { day: "Sun", rate: 33.7, sessions: 4900 },
  ];

  const radarData = [
    { subject: "Visual Attention", A: 88, B: 72, C: 65 },
    { subject: "Dwell Time", A: 82, B: 68, C: 78 },
    { subject: "Interaction Rate", A: 75, B: 85, C: 60 },
    { subject: "Repeat Visits", A: 70, B: 60, C: 82 },
    { subject: "Purchase Intent", A: 92, B: 74, C: 58 },
    { subject: "Brand Recall", A: 78, B: 80, C: 70 },
  ];

  const segments = [
    { name: "High-Value Shoppers", count: 2840, eng: "42.1%", dwell: "24.8s", conv: "22.4%", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    { name: "Frequent Visitors", count: 5120, eng: "36.8%", dwell: "18.2s", conv: "16.9%", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { name: "Occasional Shoppers", count: 8400, eng: "28.5%", dwell: "12.4s", conv: "11.3%", badge: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
    { name: "First-time Visitors", count: 3960, eng: "21.2%", dwell: "8.6s", conv: "7.8%", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  ];

  const topEngagementZones = [
    { zone: "Electronics Section", sessions: 4200, avgDwell: "28.7s", eng: "38.4%" },
    { zone: "Promotions Corner", sessions: 3800, avgDwell: "22.6s", eng: "35.1%" },
    { zone: "Entrance Display", sessions: 6100, avgDwell: "12.4s", eng: "32.9%" },
    { zone: "Checkout Area", sessions: 5200, avgDwell: "34.1s", eng: "29.8%" },
    { zone: "Apparel Section", sessions: 3400, avgDwell: "19.2s", eng: "26.5%" },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">👥 Customer Engagement</h1>
          <p className="text-slate-400 text-xs">Analyze how consumers engage with products, promotions, and store zones.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All Segments", "High-Value", "Frequent", "Occasional"].map(s => (
            <button key={s} onClick={() => setSegment(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${segment === s ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Avg. Engagement Rate", val: "33.6%", sub: "↑ 9.7% vs last week" },
          { label: "Total Sessions", val: "29,850", sub: "This week" },
          { label: "Avg. Session Duration", val: "18.4s", sub: "↑ 12.3%" },
          { label: "Return Visitor Rate", val: "42.8%", sub: "↑ 5.2%" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Engagement Trend */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Engagement Rate Trend (This Week)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={9} unit="%" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line yAxisId="left" type="monotone" dataKey="rate" stroke="#8B5CF6" strokeWidth={2.5} name="Engagement %" dot={{ fill: "#8B5CF6", r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#2563EB" strokeWidth={1.5} name="Sessions" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Engagement Profile by Segment</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={7} />
                <PolarRadiusAxis stroke="#64748B" fontSize={7} />
                <Radar name="High-Value" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                <Radar name="Frequent" dataKey="B" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} />
                <Radar name="Occasional" dataKey="C" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {segments.map((s, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-white leading-tight">{s.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${s.badge}`}>Segment</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Total Visitors</span>
                <span className="text-white font-bold font-mono">{s.count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Engagement</span>
                <span className="text-purple-400 font-bold">{s.eng}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Avg Dwell</span>
                <span className="text-blue-400 font-bold">{s.dwell}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Conversion</span>
                <span className="text-emerald-400 font-bold">{s.conv}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Zones Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase">Top Engagement Zones</h3>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">Zone</th><th className="pb-2">Total Sessions</th>
              <th className="pb-2">Avg Dwell Time</th><th className="pb-2">Engagement Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {topEngagementZones.map((z, i) => (
              <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                <td className="py-2 font-bold text-white">{z.zone}</td>
                <td className="py-2 text-slate-300 font-mono">{z.sessions.toLocaleString()}</td>
                <td className="py-2 text-blue-400 font-bold">{z.avgDwell}</td>
                <td className="py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: z.eng }}></div>
                    </div>
                    <span className="text-emerald-400 font-bold">{z.eng}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
