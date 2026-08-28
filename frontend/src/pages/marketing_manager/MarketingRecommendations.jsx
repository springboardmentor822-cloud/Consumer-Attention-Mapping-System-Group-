import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber, getCentralScaledData } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function MarketingRecommendations() {
  const { globalFilter } = useCams();
  const [filter, setFilter] = useState("All");
  const [localPeriod, setLocalPeriod] = useState(null);

  const selectedPeriod = localPeriod || globalFilter?.dateRange || "Last 7 Days";
  const handleDateChange = (p) => setLocalPeriod(p);

  const centralData = getCentralScaledData(selectedPeriod);
  const mult = centralData?.mult || 1.0;
  const products = centralData?.products || [];
  const zones = centralData?.zones || [];

  // Generate dynamic recommendations
  const recommendations = [];
  if (products && products.length > 0 && zones && zones.length > 0) {
    const lowConvProduct = [...products].sort((a, b) => a.convRate - b.convRate)[0];
    recommendations.push({
      rank: 1,
      id: 1,
      priority: "High",
      impact: "High Impact",
      icon: "🔥",
      title: `Relocate ${lowConvProduct.name} to Eye-Level Shelf Position`,
      desc: `Telemetry indicates ${lowConvProduct.name} has a conversion rate of ${lowConvProduct.convRate}% despite high visual attraction in the ${lowConvProduct.zone} zone. Relocating it to an eye-level Shelf slot could boost conversions by an estimated 30%.`,
      category: "Placement",
      effort: "Low",
      expectedROI: `+$${formatNumber(Math.round(lowConvProduct.revenue * 0.35))}/month`,
      impactColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    });

    const worstZone = zones.length > 0 ? zones.reduce((a, b) => a.conversionRate < b.conversionRate ? a : b) : { name: "-", conversionRate: 0, revenue: 0 };
    recommendations.push({
      rank: 2,
      id: 2,
      priority: "High",
      impact: "High Impact",
      icon: "📢",
      title: `Deploy Price Promotion in ${worstZone.name} Zone`,
      desc: `The ${worstZone.name} zone attracted ${formatNumber(worstZone.visitors)} visitors, but conversion was only ${worstZone.conversionRate}%. Deploying an instant price promotion or a buy-one-get-one coupon is predicted to lift conversions.`,
      category: "Promotion",
      effort: "Low",
      expectedROI: `+$${formatNumber(Math.round(worstZone.revenue * 0.2))}/month`,
      impactColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    });

    const bestZone = zones.length > 0 ? zones.reduce((a, b) => a.revenue > b.revenue ? a : b) : { name: "-", revenue: 0 };
    recommendations.push({
      rank: 3,
      id: 3,
      priority: "Medium",
      impact: "Medium Impact",
      icon: "🎯",
      title: `Expand Capacity in ${bestZone.name} Zone`,
      desc: `${bestZone.name} is the highest-revenue zone with a total revenue of $${formatNumber(bestZone.revenue)}. Expand display slots by 20% to capture additional demand and avoid out-of-stocks.`,
      category: "Placement",
      effort: "Medium",
      expectedROI: `+$${formatNumber(Math.round(bestZone.revenue * 0.15))}/month`,
      impactColor: "bg-blue-500/10 text-blue-400 border-blue-500/30"
    });

    const lowDwellZone = [...zones].sort((a, b) => a.dwellTime - b.dwellTime)[0];
    recommendations.push({
      rank: 4,
      id: 4,
      priority: "Medium",
      impact: "Medium Impact",
      icon: "🪄",
      title: `Redesign Layout for ${lowDwellZone.name} Zone`,
      desc: `Average dwell time in ${lowDwellZone.name} is only ${lowDwellZone.dwellTime} min. Rearrange the aisle to a circular customer-flow layout with focal displays to increase shopper engagement.`,
      category: "Design",
      effort: "High",
      expectedROI: `+$${formatNumber(Math.round(lowDwellZone.revenue * 0.12))}/month`,
      impactColor: "bg-blue-500/10 text-blue-400 border-blue-500/30"
    });

    recommendations.push({
      rank: 5,
      id: 5,
      priority: "Medium",
      impact: "Medium Impact",
      icon: "⏰",
      title: `Flash Sales targeting ${bestZone.name} products`,
      desc: `Deploy short flash sales on high-margin products in the ${bestZone.name} category to attract more footfall during morning traffic valleys.`,
      category: "Campaign",
      effort: "Low",
      expectedROI: `+$${formatNumber(Math.round(bestZone.revenue * 0.08))}/month`,
      impactColor: "bg-amber-500/10 text-amber-400 border-amber-500/30"
    });

    const slowProduct = [...products].sort((a, b) => a.views - a.views)[0];
    recommendations.push({
      rank: 6,
      id: 6,
      priority: "Low",
      impact: "Low Impact",
      icon: "📌",
      title: `Add QR Codes to ${slowProduct.name} displays`,
      desc: `${slowProduct.name} suffers from low visual interaction (${formatNumber(slowProduct.views)} views). Dynamic QR codes leading to interactive product guides can nudge attention.`,
      category: "Engagement",
      effort: "Low",
      expectedROI: `+$${formatNumber(Math.round(slowProduct.revenue * 0.05))}/month`,
      impactColor: "bg-purple-500/10 text-purple-400 border-purple-500/30"
    });
  }

  const filtered = filter === "All"
    ? recommendations
    : recommendations.filter(r => r.priority === filter || r.category === filter);

  const opportunityScopeData = [
    { name: "Placement", count: Math.round(35 * (mult > 1 ? 1 : mult)), color: "#8B5CF6" },
    { name: "Campaign", count: Math.round(25 * (mult > 1 ? 1 : mult)), color: "#3B82F6" },
    { name: "Promotion", count: Math.round(20 * (mult > 1 ? 1 : mult)), color: "#10B981" },
    { name: "Design", count: Math.round(12 * (mult > 1 ? 1 : mult)), color: "#F59E0B" },
    { name: "Engagement", count: Math.round(8 * (mult > 1 ? 1 : mult)), color: "#EC4899" }
  ];

  const sectorUpliftTrend = [
    { month: "W1", expected: Math.round(12 * mult), actual: Math.round(10 * mult) },
    { month: "W2", expected: Math.round(18 * mult), actual: Math.round(16 * mult) },
    { month: "W3", expected: Math.round(26 * mult), actual: Math.round(24 * mult) },
    { month: "W4", expected: Math.round(34 * mult), actual: Math.round(31 * mult) },
    { month: "W5", expected: Math.round(42 * mult), actual: Math.round(39 * mult) },
  ];

  const impactEffortData = [
    { category: "Placement", impactScore: Math.min(100, Math.round(92 * (mult > 1 ? 1 : mult))), effortScore: 25 },
    { category: "Campaign", impactScore: Math.min(100, Math.round(84 * (mult > 1 ? 1 : mult))), effortScore: 30 },
    { category: "Promotion", impactScore: Math.min(100, Math.round(76 * (mult > 1 ? 1 : mult))), effortScore: 45 },
    { category: "Design", impactScore: Math.min(100, Math.round(62 * (mult > 1 ? 1 : mult))), effortScore: 85 },
    { category: "Engagement", impactScore: Math.min(100, Math.round(48 * (mult > 1 ? 1 : mult))), effortScore: 20 },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-8">
      {/* PAGE HEADER WITH MASTER DATE SELECTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white">Marketing Recommendations</h1>
      </div>

      {/* 1. ACTIVE FILTERS */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0F172A] border border-[#1E293B] p-3 rounded-xl font-mono">
        <span className="text-xs text-slate-400 font-bold">
          Active Filter: <span className="text-amber-400">{filter}</span> ({filtered.length} items)
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {["All", "High", "Medium", "Low", "Campaign", "Placement", "Promotion"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                filter === f ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-[#070C18] text-slate-400 border-[#1E293B] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 2. TOP RECOMMENDATIONS RANKED LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-[#1E293B] pb-2">Top Recommendations Ranking</h3>
        {filtered.map((rec) => (
          <div key={rec.id} className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl hover:border-amber-500/50 transition font-mono">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">Rank #{rec.rank}</span>
                <span className="text-2xl mt-0.5">{rec.icon}</span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white leading-snug font-sans">{rec.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl font-sans">{rec.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${rec.impactColor}`}>{rec.impact}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-500/10 text-slate-400 border-slate-500/30">{rec.category}</span>
                <button onClick={() => alert(`Applied Recommendation: ${rec.title}`)} className="bg-amber-500 text-slate-950 font-extrabold px-3 py-1 rounded-lg text-[10px] hover:bg-amber-400 transition">Take Action</button>
              </div>
            </div>
            <div className="flex items-center space-x-6 mt-3 pt-3 border-t border-[#1E293B]">
              <span className="text-[10px] text-slate-400 font-sans">⚡ Implementation Effort: <strong className="text-white">{rec.effort}</strong></span>
              <span className="text-[10px] text-slate-400 font-sans">📈 Expected ROI Impact: <strong className="text-emerald-400">{rec.expectedROI}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. RECOMMENDATION IMPACT VS IMPLEMENTATION EFFORT COMPARISON CHART */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Recommendation Impact vs Implementation Effort Comparison</h3>
        <div className="h-44">
          <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
            <BarChart data={impactEffortData}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="category" stroke="#64748B" fontSize={9} />
              <YAxis stroke="#64748B" fontSize={9} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              <Bar dataKey="impactScore" fill="#10B981" radius={[4, 4, 0, 0]} name="Expected Impact Score" />
              <Bar dataKey="effortScore" fill="#EF4444" radius={[4, 4, 0, 0]} name="Implementation Effort Score" />
            </BarChart>
          </ResponsiveContainer>
</ComponentErrorBoundary>
        </div>
      </div>

      {/* 4. REMAINING SECTIONS: OPPORTUNITY SCOPE & SECTOR UPLIFT OVER TIME */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* DONUT CHART: Opportunity Scope Categories */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Opportunity Scope Categories (Donut)</h3>
          <div className="h-40 relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={opportunityScopeData} innerRadius={40} outerRadius={60} dataKey="count">
                  {opportunityScopeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">100%</strong>
              <span className="text-[8px] text-slate-400 block">Scope Share</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px] pt-2 border-t border-[#1E293B]">
            {opportunityScopeData.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 truncate">{cat.name}</span>
                </span>
                <strong className="text-white ml-1">{cat.count}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* LINE CHART: Sector Uplift Over Time */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Sector Uplift Over Time (Expected vs Actual %)</h3>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={sectorUpliftTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="expected" stroke="#8B5CF6" strokeWidth={2} name="Expected Uplift %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Actual Uplift %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
