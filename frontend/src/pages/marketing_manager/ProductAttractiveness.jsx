import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function ProductAttractiveness() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);
  const [sliderVal, setSliderVal] = useState(75);
  const [selectedEngagementCard, setSelectedEngagementCard] = useState(null);

  const selectedPeriod = localPeriod || globalFilter?.dateRange || "Last 7 Days";

  const handleDateChange = (p) => setLocalPeriod(p);

  // 1. KPI SECTION (6 REQUIRED METRICS)
  const kpis = [
    { label: "Average Attention Score", val: "84.2/100", sub: "↑ 6.1% vs prev", color: "text-purple-400" },
    { label: "Average Ad Rate", val: "68.5%", sub: "↑ 4.2% vs prev", color: "text-blue-400" },
    { label: "Average Pickup Rate", val: "42.1%", sub: "↑ 5.8% vs prev", color: "text-teal-400" },
    { label: "Conversion Rate", val: "14.6%", sub: "↑ 7.5% vs prev", color: "text-emerald-400" },
    { label: "Product Interaction Rate", val: "38.2%", sub: "↑ 3.9% vs prev", color: "text-amber-400" },
    { label: "Product Attractiveness Score", val: "87.4/100", sub: "↑ 8.2% vs prev", color: "text-indigo-400" }
  ];

  // 2. CATEGORY LIKELIHOOD SCORE ANALYTICS (BAR, PIE, DONUT)
  const categoryLikelihoodData = [
    { category: "Electronics", score: 88, color: "#8B5CF6" },
    { category: "Apparel", score: 76, color: "#3B82F6" },
    { category: "Grocery", score: 65, color: "#10B981" },
    { category: "Beverages", score: 82, color: "#06B6D4" },
    { category: "Beauty & Personal", score: 71, color: "#F59E0B" }
  ];

  const likelihoodDistribution = [
    { range: "0–20", count: 5, pct: "5%" },
    { range: "21–40", count: 12, pct: "12%" },
    { range: "41–60", count: 28, pct: "28%" },
    { range: "61–80", count: 35, pct: "35%" },
    { range: "81–100", count: 20, pct: "20%" }
  ];

  // DYNAMIC LIKELIHOOD SLIDER PRODUCTS (UPDATES WHEN USER DRAGS SLIDER)
  const sliderProducts = [
    { min: 0, max: 25, name: "Product F (Shelf E)", likelihood: 18, attention: 34, pickupProb: "12%", convProb: "3.2%" },
    { min: 26, max: 50, name: "Product E (Shelf D)", likelihood: 42, attention: 48, pickupProb: "28%", convProb: "8.4%" },
    { min: 51, max: 70, name: "Product D (Shelf C)", likelihood: 64, attention: 68, pickupProb: "45%", convProb: "12.1%" },
    { min: 71, max: 85, name: "Product B (Shelf A)", likelihood: 78, attention: 82, pickupProb: "62%", convProb: "16.8%" },
    { min: 86, max: 100, name: "Product A (Shelf A)", likelihood: 92, attention: 96, pickupProb: "84%", convProb: "22.5%" }
  ];

  const currentSliderProduct = sliderProducts.find(p => sliderVal >= p.min && sliderVal <= p.max) || sliderProducts[3];

  // 3. RECENT PRODUCT SEGMENTS WITH DISTINCT DATA
  const distinctSegments = [
    { name: "Active Segment", visitors: "4,280", eng: "42.5%", conv: "18.2%", roi: "3.8x", statusColor: "text-emerald-400" },
    { name: "Occasion", visitors: "2,150", eng: "36.1%", conv: "14.8%", roi: "3.1x", statusColor: "text-blue-400" },
    { name: "Old Segment", visitors: "890", eng: "19.4%", conv: "7.2%", roi: "1.8x", statusColor: "text-amber-400" },
    { name: "High Value", visitors: "3,420", eng: "54.8%", conv: "24.6%", roi: "4.5x", statusColor: "text-purple-400" },
    { name: "Season", visitors: "2,980", eng: "46.2%", conv: "19.5%", roi: "3.9x", statusColor: "text-teal-400" }
  ];

  // 4. COMPACT PRODUCT ENGAGEMENT CARDS
  const engagementOverviewCards = [
    { title: "Electronics Zone", overview: "High Visual Engagement", val: "$48,200", rate: "44.2%", score: "88/100", peak: "5 PM – 7 PM", promo: "Buy 2 Get 1 Free" },
    { title: "Apparel Endcap", overview: "Steady Footfall Dwell", val: "$28,400", rate: "36.8%", score: "76/100", peak: "2 PM – 4 PM", promo: "Weekend Flash Sale" },
    { title: "Grocery Promo Spot", overview: "High Conversion Intent", val: "$34,100", rate: "41.5%", score: "82/100", peak: "11 AM – 1 PM", promo: "Loyalty Bundle" },
    { title: "Entrance Spotlight", overview: "Maximum Initial Impression", val: "$52,800", rate: "48.6%", score: "92/100", peak: "6 PM – 8 PM", promo: "New Arrival Launch" }
  ];

  // PROMOTION TABLES DATA
  const promoEngagementValue = [
    { promo: "Buy 2 Get 1 Free – Electronics", zone: "Electronics", engValue: "₹1,85,000", engRate: "44.2%", perfScore: "94/100", status: "Active" },
    { promo: "Weekend Flash Sale – Apparel", zone: "Apparel", engValue: "₹92,000", engRate: "36.8%", perfScore: "78/100", status: "Active" },
    { promo: "Loyalty Points – Grocery", zone: "Grocery", engValue: "₹64,000", engRate: "41.5%", perfScore: "82/100", status: "Active" },
    { promo: "New Arrival Spotlight", zone: "Entrance", engValue: "₹1,24,000", engRate: "48.6%", perfScore: "91/100", status: "Completed" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-8">
      {/* PAGE HEADER WITH MASTER DATE SELECTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white">Product Analytics</h1>
      </div>

      {/* 1. REQUIRED 6 KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
            <span className="text-slate-400 text-[10px] block font-medium font-sans truncate">{k.label}</span>
            <h2 className="text-lg font-black text-white">{k.val}</h2>
            <span className={`text-[10px] font-bold ${k.color}`}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* 2. ATTRACTIVENESS / LIKELIHOOD SCORE ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* BAR CHART: Category Likelihood Score */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Category Likelihood Score (Bar)</h3>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryLikelihoodData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Likelihood Score">
                  {categoryLikelihoodData.map((c, idx) => (
                    <Cell key={idx} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* DONUT & PIE CHARTS: Category Likelihood Score */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Likelihood Share (Donut & Pie)</h3>
          <div className="h-40 relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryLikelihoodData} innerRadius={36} outerRadius={56} dataKey="score">
                  {categoryLikelihoodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">76.4</strong>
              <span className="text-[8px] text-slate-400 block">Avg Score</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {categoryLikelihoodData.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 truncate">{cat.category}</span>
                </span>
                <strong className="text-white ml-1">{cat.score}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* LIKELIHOOD SCORE DISTRIBUTION CHART */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Likelihood Score Distribution</h3>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={likelihoodDistribution}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Products Count" />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* DYNAMIC LIKELIHOOD SCORE SLIDER INTERACTION */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1E293B] pb-3 gap-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Likelihood Score Slider</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Drag slider to dynamically evaluate product likelihood, attention, pickup & conversion probabilities</span>
          </div>
          <span className="text-amber-400 font-bold text-sm bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
            Selected Score Threshold: {sliderVal}/100
          </span>
        </div>

        <div className="space-y-2 py-2">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            className="w-full h-2 bg-[#070C18] rounded-lg appearance-none cursor-pointer accent-amber-500 border border-[#1E293B]"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-bold">
            <span>0 (Low Likelihood)</span>
            <span>50 (Medium)</span>
            <span>100 (High Likelihood)</span>
          </div>
        </div>

        {/* DYNAMIC DETAILS DISPLAY */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-[#070C18] border border-[#1E293B] rounded-xl text-center">
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">Product Name</span>
            <strong className="text-white text-xs font-bold">{currentSliderProduct.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">Likelihood Score</span>
            <strong className="text-amber-400 text-xs font-bold">{currentSliderProduct.likelihood}/100</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">Attention Score</span>
            <strong className="text-purple-400 text-xs font-bold">{currentSliderProduct.attention}/100</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">Pickup Probability</span>
            <strong className="text-teal-400 text-xs font-bold">{currentSliderProduct.pickupProb}</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">Conversion Probability</span>
            <strong className="text-emerald-400 text-xs font-bold">{currentSliderProduct.convProb}</strong>
          </div>
        </div>
      </div>

      {/* 3. RECENT PRODUCT SEGMENTS (NON-REPEATED DISTINCT DATA) */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Product Segments Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {distinctSegments.map((seg, idx) => (
            <div key={idx} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold text-xs font-sans">{seg.name}</span>
                <span className={`text-[10px] font-bold ${seg.statusColor}`}>{seg.roi} ROI</span>
              </div>
              <div className="space-y-1 text-[10px] pt-1">
                <div className="flex justify-between text-slate-400"><span className="font-sans">Visitors:</span> <strong className="text-white">{seg.visitors}</strong></div>
                <div className="flex justify-between text-slate-400"><span className="font-sans">Engagement:</span> <strong className="text-purple-400">{seg.eng}</strong></div>
                <div className="flex justify-between text-slate-400"><span className="font-sans">Conversion:</span> <strong className="text-emerald-400">{seg.conv}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PRODUCT ENGAGEMENT SECTION (COMPACT CARDS + EXPANDABLE DETAILS & PROMOTION TABLES) */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Engagement Overview</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Click any card to expand full engagement telemetry details</span>
          </div>
        </div>

        {/* COMPACT CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {engagementOverviewCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedEngagementCard(card)}
              className="p-3.5 bg-[#070C18] border border-[#1E293B] hover:border-amber-500/60 rounded-xl cursor-pointer transition space-y-2 group"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-white font-bold text-xs font-sans group-hover:text-amber-400 transition">{card.title}</h4>
                <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Expand ↗</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans truncate">{card.overview}</p>
              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-slate-400 font-sans">Engagement Value:</span>
                <strong className="text-emerald-400 font-bold">{card.val}</strong>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-sans">Engagement Rate:</span>
                <strong className="text-purple-400 font-bold">{card.rate}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* PROMOTION ENGAGEMENT TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Engagement Value by Promotion */}
          <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-2">Engagement Value by Promotion</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400">
                    <th className="pb-1.5">Promotion</th><th className="pb-1.5">Zone</th><th className="pb-1.5">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {promoEngagementValue.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#0D1527]">
                      <td className="py-2 text-white font-bold font-sans">{p.promo}</td>
                      <td className="py-2 text-slate-400">{p.zone}</td>
                      <td className="py-2 text-emerald-400 font-bold">{p.engValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Engagement Performance by Promotion */}
          <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-2">Engagement Performance by Promotion</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400">
                    <th className="pb-1.5">Promotion</th><th className="pb-1.5">Rate</th><th className="pb-1.5">Score</th><th className="pb-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {promoEngagementValue.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#0D1527]">
                      <td className="py-2 text-white font-bold font-sans">{p.promo}</td>
                      <td className="py-2 text-purple-400 font-bold">{p.engRate}</td>
                      <td className="py-2 text-amber-400 font-bold">{p.perfScore}</td>
                      <td className="py-2 text-slate-300">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED DETAILS MODAL WHEN CARD CLICKED */}
      {selectedEngagementCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-amber-500/50 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl font-mono">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-white">{selectedEngagementCard.title} Details</h3>
              <button onClick={() => setSelectedEngagementCard(null)} className="text-slate-400 hover:text-white font-bold text-base">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300"><span className="font-sans">Engagement Overview:</span> <strong className="text-white font-sans">{selectedEngagementCard.overview}</strong></div>
              <div className="flex justify-between text-slate-300"><span className="font-sans">Engagement Value:</span> <strong className="text-emerald-400">{selectedEngagementCard.val}</strong></div>
              <div className="flex justify-between text-slate-300"><span className="font-sans">Engagement Rate:</span> <strong className="text-purple-400">{selectedEngagementCard.rate}</strong></div>
              <div className="flex justify-between text-slate-300"><span className="font-sans">Avg Engagement Score:</span> <strong className="text-amber-400">{selectedEngagementCard.score}</strong></div>
              <div className="flex justify-between text-slate-300"><span className="font-sans">Peak Engagement Time:</span> <strong className="text-blue-400">{selectedEngagementCard.peak}</strong></div>
              <div className="flex justify-between text-slate-300"><span className="font-sans">Associated Promotion:</span> <strong className="text-white font-sans">{selectedEngagementCard.promo}</strong></div>
            </div>
            <button onClick={() => setSelectedEngagementCard(null)} className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition mt-2">
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
