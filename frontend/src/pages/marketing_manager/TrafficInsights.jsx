import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function TrafficInsights() {
  const { globalFilter } = useCams();
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

  // 1. TRAFFIC VOLUME ANALYSIS (LINE CHART)
  const trafficVolumeTrend = [
    { time: "8 AM", trafficVolume: Math.round(420 * mult), visitorCount: Math.round(380 * mult) },
    { time: "10 AM", trafficVolume: Math.round(920 * mult), visitorCount: Math.round(840 * mult) },
    { time: "12 PM", trafficVolume: Math.round(1580 * mult), visitorCount: Math.round(1450 * mult) },
    { time: "2 PM", trafficVolume: Math.round(1560 * mult), visitorCount: Math.round(1410 * mult) },
    { time: "4 PM", trafficVolume: Math.round(2100 * mult), visitorCount: Math.round(1920 * mult) },
    { time: "6 PM", trafficVolume: Math.round(2820 * mult), visitorCount: Math.round(2580 * mult) },
    { time: "8 PM", trafficVolume: Math.round(1680 * mult), visitorCount: Math.round(1520 * mult) },
  ];

  // 2. TRAFFIC BY ZONE (HIGH / MEDIUM / LOW ZONE ANALYSIS)
  const zoneTrafficHeatmap = [
    { zone: "Store Entrance", traffic: Math.round(8420 * mult), level: "High Traffic", intensity: "bg-rose-500/20 text-rose-400 border-rose-500/30", color: "#EF4444" },
    { zone: "Grocery Aisle", traffic: Math.round(6840 * mult), level: "High Traffic", intensity: "bg-rose-500/20 text-rose-400 border-rose-500/30", color: "#EF4444" },
    { zone: "Checkout Counter", traffic: Math.round(5920 * mult), level: "Medium Traffic", intensity: "bg-amber-500/20 text-amber-400 border-amber-500/30", color: "#F59E0B" },
    { zone: "Apparel Section", traffic: Math.round(4120 * mult), level: "Medium Traffic", intensity: "bg-amber-500/20 text-amber-400 border-amber-500/30", color: "#F59E0B" },
    { zone: "Electronics Zone", traffic: Math.round(3280 * mult), level: "Medium Traffic", intensity: "bg-amber-500/20 text-amber-400 border-amber-500/30", color: "#F59E0B" },
    { zone: "Promotions Corner", traffic: Math.round(2140 * mult), level: "Low Traffic", intensity: "bg-blue-500/20 text-blue-400 border-blue-500/30", color: "#3B82F6" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-6">
      {/* PAGE HEADER WITH MASTER DATE FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white">Traffic Insights</h1>
          {selectedPeriod === "Custom Date Range" && customRange?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {customRange.label}
            </span>
          )}
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {[
          { label: "Total Visitors Period", val: formatNumber(Math.round(16820 * mult)), sub: "↑ 12.4% vs prev period" },
          { label: "Peak Hour Traffic", val: formatNumber(Math.round(2820 * mult)), sub: "6–7 PM peak slot" },
          { label: "Avg. Store Dwell", val: "18.4 min", sub: "↑ 2.1 min" },
          { label: "Footfall Conversion", val: "12.8%", sub: "↑ 1.4%" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium font-sans">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* 1. TRAFFIC VOLUME ANALYSIS (LINE CHART) */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic Volume & Visitor Count Analysis</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Line chart analysis comparing total traffic volume trend vs visitor count trend over time</span>
          </div>
          
        </div>
        <div className="h-56">
          <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficVolumeTrend}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
              <YAxis stroke="#64748B" fontSize={9} />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              <Line type="monotone" dataKey="trafficVolume" stroke="#8B5CF6" strokeWidth={2.5} name="Traffic Volume Trend" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="visitorCount" stroke="#10B981" strokeWidth={2} name="Visitor Count Trend" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
</ComponentErrorBoundary>
        </div>
      </div>

      {/* 2. TRAFFIC BY ZONE (HEATMAP & ZONE ANALYSIS) */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traffic By Zone Heatmap & Analysis</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Zone-wise breakdown categorizing High, Medium, and Low traffic zones</span>
          </div>
          
        </div>

        {/* ZONE TRAFFIC GRID HEATMAP CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {zoneTrafficHeatmap.map((z, idx) => (
            <div key={idx} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold text-xs font-sans">{z.zone}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${z.intensity}`}>{z.level}</span>
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="text-slate-400 text-[10px] font-sans">Total Zone Traffic:</span>
                <strong className="text-lg font-black text-white font-mono">{formatNumber(z.traffic)}</strong>
              </div>
              <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min((z.traffic / (8420 * mult)) * 100, 100)}%`, backgroundColor: z.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
