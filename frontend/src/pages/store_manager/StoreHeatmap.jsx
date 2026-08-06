import React, { useState } from "react";
import { BarChart, Bar, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { useCams } from "../../services/CamsContext";
import { zones, heatColor } from "../../services/centralData";

export default function StoreHeatmap() {
  const { dateRange, selectedCamera, telemetry } = useCams();
  const [heatmapType, setHeatmapType] = useState("density"); // density | movement | dwell | attention | engagement

  const kpis = [
    { label: "Overall Dwell Score", value: "89/100", change: "↑ 8.2%", icon: "⏱️" },
    { label: "Avg Attention Score", value: `${telemetry.avgAttentionTime}s`, change: `↑ ${telemetry.avgAttentionTimeChange}%`, icon: "⭐" },
    { label: "Active Hotspots", value: "8 Zones", change: "Density Peak", icon: "🔥" },
    { label: "Busiest Corridor", value: "Aisle 4", change: "92% density", icon: "🛣️" },
    { label: "Zone Engagement", value: "84%", change: "Optimal", icon: "🎯" }
  ];

  // Dynamic heat ratings based on active type
  const getHeatValue = (zoneName) => {
    const baseZone = zones.find(z => z.name.toLowerCase().includes(zoneName.toLowerCase())) || { trafficDensity: 50, dwellTime: 15, attentionScore: 70, engagement: 60 };
    switch (heatmapType) {
      case "movement": return baseZone.trafficDensity - 5;
      case "dwell": return Math.round(baseZone.dwellTime * 3.5);
      case "attention": return baseZone.attentionScore;
      case "engagement": return baseZone.engagement;
      case "density":
      default:
        return baseZone.trafficDensity;
    }
  };

  const localGrid = [
    { name: "Entrance", heat: getHeatValue("Entrance") || 95 },
    { name: "Promo Zone", heat: getHeatValue("Promo") || 88 },
    { name: "Bakery", heat: getHeatValue("Bakery") || 92 },
    { name: "Deli", heat: getHeatValue("Deli") || 72 },
    { name: "Aisle 1", heat: getHeatValue("Produce") || 65 },
    { name: "Aisle 2", heat: getHeatValue("Dairy") || 78 },
    { name: "Aisle 3", heat: getHeatValue("Frozen") || 58 },
    { name: "Aisle 4", heat: getHeatValue("Cosmetics") || 84 },
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
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

      {/* Selector button group */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-3 rounded-2xl flex flex-wrap gap-2 items-center justify-between">
        <span className="text-white font-bold uppercase text-[10px] tracking-wider">AI Heatmap Visualization Engine</span>
        <div className="flex gap-1.5">
          {["density", "movement", "dwell", "attention", "engagement"].map((type) => (
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

      {/* Exactly Two Components Per Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dynamic Heatmap Blueprint */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI-Generated Store Layout Heatmap</h3>
            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-bold rounded-lg">LIVE</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {localGrid.map((z, i) => (
              <div key={i} className={`${heatColor(z.heat)} rounded-xl p-3.5 text-center transition-all hover:scale-105 cursor-pointer`}>
                <span className="text-[10px] font-bold block leading-tight truncate">{z.name}</span>
                <span className="text-sm font-black font-mono block mt-1">{z.heat}%</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-[#1E293B]">
            <span>Low {heatmapType}</span>
            <div className="flex-1 h-2 mx-3 bg-gradient-to-r from-blue-600 via-amber-500 to-rose-600 rounded"></div>
            <span>High {heatmapType}</span>
          </div>
        </div>

        {/* Zone comparison metric chart */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Metric Breakdown</h3>
          <div className="h-52 w-full">
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
    </div>
  );
}
