import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function AttentionInsights() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);
  const [customRange, setCustomRange] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const selectedPeriod = localPeriod || globalFilter?.dateRange || "Last 7 Days";

  const handleDateChange = (newPeriod, customData = null) => {
    setLocalPeriod(newPeriod);
    if (newPeriod === "Custom Date Range" && customData) {
      setCustomRange(customData);
    } else if (newPeriod !== "Custom Date Range") {
      setCustomRange(null);
    }
  };

  // Dynamic Scale multiplier based on date period
  let mult = 1.0;
  if (selectedPeriod === "Today") mult = 0.15;
  else if (selectedPeriod === "Yesterday") mult = 0.14;
  else if (selectedPeriod === "Last 7 Days") mult = 1.0;
  else if (selectedPeriod === "Last 30 Days") mult = 4.1;
  else if (selectedPeriod === "Custom Date Range" && customRange?.startDate && customRange?.endDate) {
    const diffDays = Math.max(1, Math.round((new Date(customRange.endDate) - new Date(customRange.startDate)) / (1000 * 60 * 60 * 24)));
    mult = parseFloat((diffDays / 7).toFixed(2));
  }

  // 1. HIGH ATTENTION PRODUCT PERFORMANCE DATA
  const highAttentionProducts = [
    { product: "Product A (Shelf A)", score: 96, engLevel: "High Engagement", views: Math.round(4200 * mult), conv: "22.5%" },
    { product: "Product B (Shelf A)", score: 92, engLevel: "High Engagement", views: Math.round(3850 * mult), conv: "18.4%" },
    { product: "Product C (Shelf B)", score: 85, engLevel: "Moderate Engagement", views: Math.round(2960 * mult), conv: "16.2%" },
    { product: "Product G (Entrance)", score: 82, engLevel: "Moderate Engagement", views: Math.round(3100 * mult), conv: "14.8%" },
    { product: "Product E (Shelf D)", score: 74, engLevel: "Steady Dwell", views: Math.round(1840 * mult), conv: "11.2%" }
  ];

  // 2. ATTENTION SCORE DISTRIBUTION DATA (DONUT & BAR)
  const attentionDistribution = [
    { range: "0–20 (Low)", count: 4, pct: "4%", color: "#EF4444" },
    { range: "21–40 (Fair)", count: 8, pct: "8%", color: "#F59E0B" },
    { range: "41–60 (Avg)", count: 18, pct: "18%", color: "#06B6D4" },
    { range: "61–80 (Good)", count: 42, pct: "42%", color: "#3B82F6" },
    { range: "81–100 (High)", count: 28, pct: "28%", color: "#8B5CF6" }
  ];

  const attentionTrend = [
    { time: "9AM", avg: 3.2, peak: 5.1 }, { time: "10AM", avg: 4.1, peak: 6.8 },
    { time: "11AM", avg: 5.8, peak: 8.2 }, { time: "12PM", avg: 7.2, peak: 10.1 },
    { time: "1PM", avg: 6.9, peak: 9.4 }, { time: "2PM", avg: 5.5, peak: 7.8 },
    { time: "3PM", avg: 6.2, peak: 8.9 }, { time: "4PM", avg: 7.8, peak: 11.2 },
    { time: "5PM", avg: 8.4, peak: 12.5 }, { time: "6PM", avg: 9.1, peak: 13.4 },
    { time: "7PM", avg: 7.3, peak: 10.8 }, { time: "8PM", avg: 5.1, peak: 7.2 },
  ];

  // COMPACT KPI CARDS WITH EXPANSION SUPPORT
  const compactCards = [
    { title: "Avg. Attention Time", val: "6.42s", delta: "↑ 14.3%", color: "text-emerald-400", details: "Average attention time computed across all active camera zones for the selected period." },
    { title: "Peak Attention Time", val: "13.4s", delta: "↑ 8.7%", color: "text-emerald-400", details: "Maximum single-session attention dwell recorded during peak evening store hours (5-7 PM)." },
    { title: "Attention Score Index", val: "84.2 / 100", delta: "↑ 6.1%", color: "text-purple-400", details: "Overall storewide attention performance index scaled against national benchmark averages." },
    { title: "High Attention Zones", val: "4 Zones", delta: "↑ 1 Zone", color: "text-amber-400", details: "Electronics, Entrance, Apparel Endcap, and Checkout Counter registered top attention density." }
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-6">
      {/* PAGE HEADER WITH MASTER DATE FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white">Attention Insights</h1>
        <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
          <span className="text-xs font-bold text-slate-400">Date Range:</span>
          <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
        </div>
      </div>

      {/* COMPACT CLICKABLE KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {compactCards.map((k, i) => (
          <div
            key={i}
            onClick={() => setSelectedCard(k)}
            className="bg-[#0F172A] border border-[#1E293B] hover:border-amber-500/50 p-3.5 rounded-xl cursor-pointer transition space-y-1 group"
          >
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] block font-medium font-sans truncate">{k.title}</span>
              <span className="text-[8px] text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded">Expand ↗</span>
            </div>
            <h2 className="text-lg font-black text-white">{k.val}</h2>
            <span className={`text-[10px] font-bold ${k.color}`}>{k.delta}</span>
          </div>
        ))}
      </div>

      {/* SYNCHRONIZED FLOORPLAN BLUEPRINT HEATMAP */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Synchronized Attention Floorplan Heatmap</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Centralized heatmap synchronized across all Store Manager and Marketing Manager portals</span>
          </div>
          
        </div>
        <div className="w-full flex justify-center py-2 overflow-hidden">
          <StoreHeatmapModel dateFilter={selectedPeriod} customRangeLabel={customRange?.label} onDateChange={handleDateChange} />
        </div>
      </div>

      {/* ATTENTION ANALYTICS: HIGH ATTENTION PRODUCT PERFORMANCE & ATTENTION SCORE DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* HIGH ATTENTION PRODUCT PERFORMANCE */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">High Attention Product Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2">Product</th><th className="pb-2">Attention Score</th><th className="pb-2">Engagement Level</th><th className="pb-2">Conv %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {highAttentionProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#0D1527]/50 transition">
                    <td className="py-2 font-bold text-white">{p.product}</td>
                    <td className="py-2">
                      <span className="text-purple-400 font-bold font-mono">{p.score}/100</span>
                    </td>
                    <td className="py-2 text-slate-300 font-sans">{p.engLevel}</td>
                    <td className="py-2 text-emerald-400 font-bold font-mono">{p.conv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ATTENTION SCORE DISTRIBUTION (DONUT & BAR CHART) */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Attention Score Distribution (Donut & Bar)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Donut Chart */}
            <div className="h-40 relative flex items-center justify-center">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attentionDistribution} innerRadius={34} outerRadius={54} dataKey="count">
                    {attentionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
              <div className="absolute text-center">
                <strong className="text-sm text-white block">84.2</strong>
                <span className="text-[8px] text-slate-400 block">Avg Score</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-40">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <BarChart data={attentionDistribution}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis dataKey="range" stroke="#64748B" fontSize={7} />
                  <YAxis stroke="#64748B" fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Products Count" />
                </BarChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* EXPAND MODAL WHEN CARD CLICKED */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-amber-500/50 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl font-mono">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-white">{selectedCard.title} Details</h3>
              <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-white font-bold text-base">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300"><span className="font-sans">Metric Value:</span> <strong className="text-white">{selectedCard.val}</strong></div>
              <div className="flex justify-between text-slate-300"><span className="font-sans">Period Trend:</span> <strong className={selectedCard.color}>{selectedCard.delta}</strong></div>
              <p className="text-slate-400 text-[11px] font-sans pt-2 border-t border-[#1E293B]">{selectedCard.details}</p>
            </div>
            <button onClick={() => setSelectedCard(null)} className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition mt-2">
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
