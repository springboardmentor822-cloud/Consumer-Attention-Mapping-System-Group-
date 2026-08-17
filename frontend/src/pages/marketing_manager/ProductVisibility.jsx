import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import CustomDateSelector from "../../components/CustomDateSelector";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function ProductVisibility() {
  const { globalFilter } = useCams();
  const [activeShelf, setActiveShelf] = useState("All Shelves");
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

  // Meaningful Retail Analytics KPIs
  const visibilityKPIs = [
    { label: "Average Visibility Score", value: "76.4/100", sub: "↑ 4.2% vs prev period", icon: "👁️", color: "text-emerald-400" },
    { label: "Highest Visibility Score", value: "96/100", sub: "Product A (Shelf A)", icon: "⭐", color: "text-purple-400" },
    { label: "Lowest Visibility Score", value: "34/100", sub: "Product F (Shelf E)", icon: "⚠️", color: "text-rose-400" },
    { label: "Out-of-Stock Products", value: `${Math.round(3 * (mult > 2 ? 1.5 : 1))} Items`, sub: "Requires Replenishment", icon: "📦", color: "text-amber-400" }
  ];

  // Visibility Score by Product Category (Donut Chart)
  const categoryVisibilityData = [
    { name: "Dairy", score: 88, color: "#2563EB" },
    { name: "Bakery", score: 82, color: "#10B981" },
    { name: "Beverages", score: 94, color: "#8B5CF6" },
    { name: "Produce", score: 71, color: "#F59E0B" },
    { name: "Frozen Foods", score: 65, color: "#06B6D4" },
    { name: "Snacks", score: 79, color: "#EC4899" }
  ];

  const visibilityTrend = [
    { day: "Mon", A: 88, B: 74, C: 60, D: 44, E: 35 },
    { day: "Tue", A: 90, B: 76, C: 62, D: 46, E: 37 },
    { day: "Wed", A: 89, B: 75, C: 63, D: 45, E: 36 },
    { day: "Thu", A: 92, B: 78, C: 65, D: 48, E: 38 },
    { day: "Fri", A: 94, B: 80, C: 67, D: 50, E: 40 },
    { day: "Sat", A: 93, B: 79, C: 66, D: 49, E: 39 },
    { day: "Sun", A: 92, B: 78, C: 64, D: 47, E: 38 },
  ];

  const productVisibilityData = [
    { product: "Product A", shelf: "Shelf A", score: 96, views: Math.round(4200 * mult).toLocaleString(), hotspot: true, improvement: "+2.4%" },
    { product: "Product B", shelf: "Shelf A", score: 89, views: Math.round(3850 * mult).toLocaleString(), hotspot: true, improvement: "+1.8%" },
    { product: "Product C", shelf: "Shelf B", score: 78, views: Math.round(2960 * mult).toLocaleString(), hotspot: false, improvement: "+1.2%" },
    { product: "Product D", shelf: "Shelf C", score: 64, views: Math.round(2100 * mult).toLocaleString(), hotspot: false, improvement: "-0.4%" },
    { product: "Product E", shelf: "Shelf D", score: 48, views: Math.round(1480 * mult).toLocaleString(), hotspot: false, improvement: "-1.8%" },
    { product: "Product F", shelf: "Shelf E", score: 34, views: Math.round(890 * mult).toLocaleString(), hotspot: false, improvement: "-2.1%" },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-6">
      {/* PAGE HEADER WITH MASTER DATE FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white">Product Visibility</h1>
          {selectedPeriod === "Custom Date Range" && customRange?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {customRange.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-400 font-mono">Date Range:</span>
          <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibilityKPIs.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between font-mono">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] block font-medium font-sans">{k.label}</span>
              <h2 className="text-xl font-black text-white">{k.value}</h2>
              <span className={`text-[10px] font-bold ${k.color}`}>{k.sub}</span>
            </div>
            <div className="text-2xl">{k.icon}</div>
          </div>
        ))}
      </div>

      {/* REQUIREMENT 2: SYNCHRONIZED STORE HEATMAP MODEL INTEGRATION */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Synchronized Product Visibility Floorplan Heatmap</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">Centralized heatmap synchronized across Store Manager and Marketing Manager portals</span>
          </div>
          
        </div>
        <div className="w-full flex justify-center py-2 overflow-hidden">
          <StoreHeatmapModel dateFilter={selectedPeriod} customRangeLabel={customRange?.label} onDateChange={handleDateChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visibility Trend */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shelf Visibility Score Trend</h3>
            
          </div>
          <div className="h-52">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibilityTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} domain={[20, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="A" stroke="#8B5CF6" strokeWidth={2} name="Shelf A" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="B" stroke="#2563EB" strokeWidth={2} name="Shelf B" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="C" stroke="#10B981" strokeWidth={2} name="Shelf C" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="D" stroke="#F59E0B" strokeWidth={2} name="Shelf D" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="E" stroke="#EF4444" strokeWidth={2} name="Shelf E" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* VISIBILITY SCORE BY PRODUCT CATEGORY DONUT CHART */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visibility Score by Category</h3>
            
          </div>
          <div className="h-40 w-full relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryVisibilityData} innerRadius={42} outerRadius={62} dataKey="score">
                  {categoryVisibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">76.4</strong>
              <span className="text-[9px] text-slate-400 block">Avg Score</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {categoryVisibilityData.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 truncate">{cat.name}</span>
                </span>
                <span className="text-white font-bold ml-1">{cat.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Visibility Details</h3>
          <div className="flex items-center space-x-2">
            {["All Shelves", "Shelf A", "Shelf B", "Shelf C", "Shelf D"].map(s => (
              <button key={s} onClick={() => setActiveShelf(s)} className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${activeShelf === s ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-[#070C18] text-slate-400 border-[#1E293B] hover:text-white"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Product</th><th className="pb-2">Location</th><th className="pb-2">Visibility Score</th>
                <th className="pb-2">Period Views</th><th className="pb-2">Hotspot</th><th className="pb-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {productVisibilityData.filter(p => activeShelf === "All Shelves" || p.shelf === activeShelf).map((p, i) => (
                <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                  <td className="py-2.5 font-bold text-white">{p.product}</td>
                  <td className="py-2.5 text-slate-400">{p.shelf}</td>
                  <td className="py-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.score >= 80 ? "bg-emerald-500" : p.score >= 60 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${p.score}%` }}></div>
                      </div>
                      <span className="text-white font-bold font-mono">{p.score}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-300 font-mono">{p.views}</td>
                  <td className="py-2.5">{p.hotspot ? <span className="text-amber-400 font-bold">🔥 Yes</span> : <span className="text-slate-500">—</span>}</td>
                  <td className={`py-2.5 font-bold ${p.improvement.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{p.improvement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
