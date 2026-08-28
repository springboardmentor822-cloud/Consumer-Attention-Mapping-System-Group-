import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import CustomDateSelector from "../../components/CustomDateSelector";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function CustomerEngagement() {
  const { globalFilter } = useCams();
  const [segment, setSegment] = useState("All Segments");
  const [localPeriod, setLocalPeriod] = useState(null);
  const [localCustomRange, setLocalCustomRange] = useState(null);

  const selectedPeriod = localPeriod || globalFilter?.dateRange || "Last 7 Days";
  const customRange = localCustomRange || (globalFilter?.dateRange === "Custom Date Range" ? globalFilter : null);

  const handleDateChange = (newPeriod, customData = null) => {
    setLocalPeriod(newPeriod);
    if (newPeriod === "Custom Date Range" && customData) {
      setLocalCustomRange(customData);
    } else if (newPeriod !== "Custom Date Range") {
      setLocalCustomRange(null);
    }
  };

  // Scale multiplier based on date period
  let mult = 1.0;
  if (selectedPeriod === "Today") mult = 0.15;
  else if (selectedPeriod === "Yesterday") mult = 0.14;
  else if (selectedPeriod === "Last 7 Days") mult = 1.0;
  else if (selectedPeriod === "Last 30 Days") mult = 4.1;
  else if (selectedPeriod === "Custom Date Range" && customRange?.startDate && customRange?.endDate) {
    const diffDays = Math.max(1, Math.round((new Date(customRange.endDate) - new Date(customRange.startDate)) / (1000 * 60 * 60 * 24)));
    mult = parseFloat((diffDays / 7).toFixed(2));
  }

  const engagementTrend = [
    { day: "Mon", rate: 28.4, sessions: Math.round(3200 * mult) },
    { day: "Tue", rate: 31.2, sessions: Math.round(3850 * mult) },
    { day: "Wed", rate: 29.8, sessions: Math.round(3400 * mult) },
    { day: "Thu", rate: 34.5, sessions: Math.round(4100 * mult) },
    { day: "Fri", rate: 36.2, sessions: Math.round(4800 * mult) },
    { day: "Sat", rate: 38.9, sessions: Math.round(5600 * mult) },
    { day: "Sun", rate: 33.7, sessions: Math.round(4900 * mult) },
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
    { name: "High-Value Shoppers", count: Math.round(2840 * mult), eng: "42.1%", dwell: "24.8s", conv: "22.4%", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    { name: "Frequent Visitors", count: Math.round(5120 * mult), eng: "36.8%", dwell: "18.2s", conv: "16.9%", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { name: "Occasional Shoppers", count: Math.round(8400 * mult), eng: "28.5%", dwell: "12.4s", conv: "11.3%", badge: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
    { name: "First-time Visitors", count: Math.round(3960 * mult), eng: "21.2%", dwell: "8.6s", conv: "7.8%", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  ];

  const topEngagementZones = [
    { zone: "Electronics Section", sessions: Math.round(4200 * mult), avgDwell: "28.7s", eng: "38.4%" },
    { zone: "Promotions Corner", sessions: Math.round(3800 * mult), avgDwell: "22.6s", eng: "35.1%" },
    { zone: "Entrance Display", sessions: Math.round(6100 * mult), avgDwell: "12.4s", eng: "32.9%" },
    { zone: "Checkout Area", sessions: Math.round(5200 * mult), avgDwell: "34.1s", eng: "29.8%" },
    { zone: "Apparel Section", sessions: Math.round(3400 * mult), avgDwell: "19.2s", eng: "26.5%" },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-6">
      {/* PAGE HEADER WITH MASTER DATE FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white">Customer Engagement</h1>
          {selectedPeriod === "Custom Date Range" && customRange?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {customRange.label}
            </span>
          )}
        </div>
      </div>

      {/* SEGMENT FILTER BAR */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 font-mono font-bold">
          Active Segment: <span className="text-amber-400">{segment}</span>
        </span>
        <div className="flex items-center space-x-2">
          {["All Segments", "High-Value", "Frequent", "Occasional"].map(s => (
            <button key={s} onClick={() => setSegment(s)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${segment === s ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {[
          { label: "Avg. Engagement Rate", val: "33.6%", sub: "↑ 9.7% vs last week" },
          { label: "Total Sessions", val: Math.round(29850 * mult).toLocaleString(), sub: `Period: ${selectedPeriod}` },
          { label: "Avg. Session Duration", val: "18.4s", sub: "↑ 12.3%" },
          { label: "Return Visitor Rate", val: "42.8%", sub: "↑ 5.2%" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium font-sans">{k.label}</span>
            <h2 className="text-lg font-black text-white mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* REQUIREMENT 8: SYNCHRONIZED STORE HEATMAP MODEL INTEGRATION */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Synchronized Store Engagement Heatmap</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">Centralized telemetry synced with Dashboard floorplan blueprint</span>
          </div>
          
        </div>
        <div className="w-full flex justify-center py-2 overflow-hidden">
          <StoreHeatmapModel dateFilter={selectedPeriod} customRangeLabel={customRange?.label} onDateChange={handleDateChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* Engagement Trend */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Engagement Rate Trend</h3>
            
          </div>
          <div className="h-52">
            <ComponentErrorBoundary>
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
</ComponentErrorBoundary>
          </div>
        </div>

        {/* Radar */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Engagement Profile</h3>
          <div className="h-52">
            <ComponentErrorBoundary>
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
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {segments.map((s, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-white leading-tight font-sans">{s.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${s.badge}`}>Segment</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-sans">Total Visitors</span>
                <span className="text-white font-bold">{s.count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-sans">Engagement</span>
                <span className="text-purple-400 font-bold">{s.eng}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-sans">Avg Dwell</span>
                <span className="text-blue-400 font-bold">{s.dwell}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-sans">Conversion</span>
                <span className="text-emerald-400 font-bold">{s.conv}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Zones Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Top Engagement Zones</h3>
        <div className="overflow-x-auto">
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
                  <td className="py-2.5 font-bold text-white">{z.zone}</td>
                  <td className="py-2.5 text-slate-300 font-mono">{z.sessions.toLocaleString()}</td>
                  <td className="py-2.5 text-blue-400 font-bold">{z.avgDwell}</td>
                  <td className="py-2.5">
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
    </div>
  );
}
