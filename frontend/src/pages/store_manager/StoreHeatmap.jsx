import React, { useState } from "react";
import { BarChart, Bar, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { useCams } from "../../services/CamsContext";
import { zones } from "../../services/centralData";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import CustomDateSelector from "../../components/CustomDateSelector";

export default function StoreHeatmap() {
  const { telemetry } = useCams();
  const [heatmapType, setHeatmapType] = useState("density"); // density | movement | dwell | attention | engagement
  const [period, setPeriod] = useState("Last 7 Days");

  const kpis = [
    { label: "Overall Dwell Score", value: "89/100", change: "↑ 8.2%", icon: "⏱️" },
    { label: "Avg Attention Score", value: `${telemetry.avgAttentionTime}s`, change: `↑ ${telemetry.avgAttentionTimeChange}%`, icon: "⭐" },
    { label: "Active Hotspots", value: "8 Zones", change: "Density Peak", icon: "🔥" },
    { label: "Busiest Corridor", value: "Snacks Shelf", change: "96% density", icon: "🍿" },
    { label: "Zone Engagement", value: "84%", change: "Optimal", icon: "🎯" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs pb-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">{k.label}</span>
              <h2 className="text-xl font-black text-white font-mono">{k.value}</h2>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">{k.change}</span>
            </div>
            <div className="text-lg">{k.icon}</div>
          </div>
        ))}
      </div>

      {/* Main Model Heatmap Blueprint */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Supermarket Real-Time AI Heatmap Matrix</h3>
          <div className="flex items-center gap-2">
            <CustomDateSelector value={period} onChange={setPeriod} />
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">
              ● LIVE TRACKING
            </span>
          </div>
        </div>
        
        <StoreHeatmapModel />
      </div>

      {/* Zone comparison metric chart */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Metric Breakdown</h3>
          <div className="flex gap-1.5">
            {["density", "movement", "dwell", "attention"].map((type) => (
              <button
                key={type}
                onClick={() => setHeatmapType(type)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
                  heatmapType === type
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-400 font-extrabold"
                    : "bg-[#070C18] border-[#1E293B] text-slate-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zones.slice(0, 6)}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={9} />
              <YAxis stroke="#64748B" fontSize={9} />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
              <Bar dataKey={heatmapType === "dwell" ? "dwellTime" : heatmapType === "attention" ? "attentionScore" : "trafficDensity"} radius={[4, 4, 0, 0]}>
                {zones.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
