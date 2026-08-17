import React, { useState } from "react";
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, Cell
} from "recharts";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber, getCentralScaledData } from "../../services/centralData";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function MarketingOverview() {
  const { telemetry, globalFilter } = useCams();

  // Local Page Period & Campaign States (null means inherit global filter)
  const [localPeriod, setLocalPeriod] = useState(null);
  const [localCustomRange, setLocalCustomRange] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState("All Active Campaigns");

  const globalPeriod = localPeriod || globalFilter?.dateRange || "Last 7 Days";
  const globalCustomRange = localCustomRange || (globalFilter?.dateRange === "Custom Date Range" ? globalFilter : null);

  // Widget-specific Date Overrides
  const [w1Period, setW1Period] = useState(null);
  const [w2Period, setW2Period] = useState(null);
  const [w3Period, setW3Period] = useState(null);
  const [w4Period, setW4Period] = useState(null);

  const handleGlobalDateChange = (newPeriod, customData = null) => {
    setLocalPeriod(newPeriod);
    setLocalCustomRange(customData);
    // Reset widget overrides so master filter applies
    setW1Period(null);
    setW2Period(null);
    setW3Period(null);
    setW4Period(null);
  };

  // Helper to compute scale multiplier
  const getScale = (p, cRange) => {
    if (p === "Today") return 0.15;
    if (p === "Yesterday") return 0.14;
    if (p === "Last 7 Days") return 1.0;
    if (p === "Last 30 Days") return 4.1;
    if (p === "Custom Date Range" && cRange?.startDate && cRange?.endDate) {
      const diffDays = Math.max(1, Math.round((new Date(cRange.endDate) - new Date(cRange.startDate)) / (1000 * 60 * 60 * 24)));
      return parseFloat((diffDays / 7).toFixed(2));
    }
    return 1.0;
  };

  // Campaign-specific Multipliers
  const campaignMult = {
    "All Active Campaigns": 1.0,
    "Summer Sale": 0.42,
    "Weekend Bonanza": 0.28,
    "New Arrival Launch": 0.30
  }[selectedCampaign] || 1.0;

  const baseScale = getScale(globalPeriod, globalCustomRange) * campaignMult;

  // Widget 1 Scale
  const scale1 = getScale(w1Period || globalPeriod, w1Period ? null : globalCustomRange) * campaignMult;
  // Widget 2 Scale
  const scale2 = getScale(w2Period || globalPeriod, w2Period ? null : globalCustomRange) * campaignMult;
  // Widget 3 Scale
  const scale3 = getScale(w3Period || globalPeriod, w3Period ? null : globalCustomRange) * campaignMult;

  // 1. KPI Cards
  const totalCampaignsCount = selectedCampaign === "All Active Campaigns" ? 12 : 1;
  const totalImpressionsVal = Math.round(245000 * baseScale);
  const promoRevenueVal = Math.round(24800 * baseScale);

  // 2. Datasets
  const campaignPerformanceData = [
    { name: "Summer Sale", impressions: Math.round(165000 * scale1), engagement: 34.5, conversion: 16.2 },
    { name: "Weekend Bonanza", impressions: Math.round(120000 * scale1), engagement: 28.9, conversion: 12.7 },
    { name: "New Arrival Launch", impressions: Math.round(145000 * scale1), engagement: 33.1, conversion: 14.8 },
    { name: "Festive Offer", impressions: Math.round(85000 * scale1), engagement: 26.7, conversion: 11.3 },
    { name: "Clearance Sale", impressions: Math.round(65000 * scale1), engagement: 19.3, conversion: 8.6 }
  ].filter(c => selectedCampaign === "All Active Campaigns" || c.name === selectedCampaign);

  const promoEffectivenessData = [
    { metric: "Footfall", before: Math.round(12.5 * scale2), after: Math.round(18.5 * scale2) },
    { metric: "Attention (s)", before: 4.1, after: 6.8 },
    { metric: "Engagement %", before: 21, after: 33 },
    { metric: "Conversion %", before: 9.2, after: 14.6 },
    { metric: "Revenue ($K)", before: Math.round(5.6 * scale2), after: Math.round(8.9 * scale2) }
  ];

  // 3. Marketing Conversion Funnel (Requirement 9: Impressions -> Views -> Engagement -> Clicks -> Product Views -> Purchases -> Conversions)
  const totalBaseImp = Math.round(300000 * scale3);
  const funnelStages = [
    { stage: "Impressions", count: totalBaseImp, convPrev: "100%", widthPct: 100, color: "from-[#8B5CF6] to-[#6366F1]" },
    { stage: "Views", count: Math.round(totalBaseImp * 0.70), convPrev: "70.0% from Imp", widthPct: 86, color: "from-[#6366F1] to-[#3B82F6]" },
    { stage: "Engagement", count: Math.round(totalBaseImp * 0.48), convPrev: "68.6% from Views", widthPct: 72, color: "from-[#3B82F6] to-[#06B6D4]" },
    { stage: "Clicks", count: Math.round(totalBaseImp * 0.32), convPrev: "66.7% from Eng", widthPct: 58, color: "from-[#06B6D4] to-[#10B981]" },
    { stage: "Product Views", count: Math.round(totalBaseImp * 0.22), convPrev: "68.8% from Clicks", widthPct: 44, color: "from-[#10B981] to-[#F59E0B]" },
    { stage: "Purchases", count: Math.round(totalBaseImp * 0.14), convPrev: "63.6% from Prod Views", widthPct: 32, color: "from-[#F59E0B] to-[#EC4899]" },
    { stage: "Conversions", count: Math.round(totalBaseImp * 0.10), convPrev: "71.4% from Purchases", widthPct: 22, color: "from-[#EC4899] to-[#EF4444]" }
  ];

  const visibilityByShelfData = [
    { shelf: "Shelf A (Main)", score: 92, fill: "#8B5CF6" },
    { shelf: "Shelf B (Endcap)", score: 78, fill: "#2563EB" },
    { shelf: "Shelf C (Side)", score: 64, fill: "#06B6D4" },
    { shelf: "Shelf D (Lower)", score: 58, fill: "#10B981" },
    { shelf: "Shelf E (Rear)", score: 42, fill: "#F59E0B" }
  ];

  const radarData = [
    { subject: "Visual Appeal", A: 90, B: 70 },
    { subject: "Placement", A: 85, B: 80 },
    { subject: "Engagement", A: 75, B: 85 },
    { subject: "Pick Rate", A: 80, B: 65 },
    { subject: "Purchase Impact", A: 95, B: 75 }
  ];

  const scatterData = [
    { x: 9, y: 17, z: 100, name: "Summer Sale", campaign: "Summer Sale 2025", eng: "34.5%", conv: "16.2%" },
    { x: 10, y: 19, z: 120, name: "Weekend Bonanza", campaign: "Weekend Bonanza", eng: "28.9%", conv: "12.7%" },
    { x: 11, y: 18, z: 110, name: "New Arrival", campaign: "New Arrival Launch", eng: "33.1%", conv: "14.8%" },
    { x: 6, y: 11, z: 80, name: "Festive Offer", campaign: "Festive Offer", eng: "26.7%", conv: "11.3%" }
  ];

  const topCampaigns = [
    { id: 1, name: "Summer Sale", imp: formatNumber(Math.round(165000 * baseScale)), eng: "34.5%", conv: "16.2%", roi: "4.2x" },
    { id: 2, name: "New Arrival Launch", imp: formatNumber(Math.round(145000 * baseScale)), eng: "33.1%", conv: "14.8%", roi: "3.8x" },
    { id: 3, name: "Weekend Bonanza", imp: formatNumber(Math.round(120000 * baseScale)), eng: "28.9%", conv: "12.7%", roi: "3.2x" },
    { id: 4, name: "Festive Offer", imp: formatNumber(Math.round(85000 * baseScale)), eng: "26.7%", conv: "11.3%", roi: "2.6x" }
  ].filter(c => selectedCampaign === "All Active Campaigns" || c.name === selectedCampaign);
  const centralData = getCentralScaledData(globalPeriod, globalCustomRange);
  const zones = centralData?.zones || [];
  const productsList = centralData?.products || [];

  const topRecommendations = [];
  if (productsList.length > 0 && zones.length > 0) {
    const lowConvProduct = [...productsList].sort((a, b) => a.convRate - b.convRate)[0];
    const topZone = [...zones].sort((a, b) => b.revenue - a.revenue)[0];
    const lowDwellZone = [...zones].sort((a, b) => a.dwellTime - b.dwellTime)[0];

    topRecommendations.push({
      title: `Increase visibility of ${lowConvProduct.name} on displays`,
      tag: "High Impact",
      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    });
    topRecommendations.push({
      title: `Co-locate impulse products in high-revenue ${topZone.name} zone`,
      tag: "Medium Impact",
      tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/30"
    });
    topRecommendations.push({
      title: `Restructure layout of low-retention ${lowDwellZone.name} zone`,
      tag: "High Impact",
      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    });
  } else {
    topRecommendations.push({
      title: "Insufficient data for AI insight",
      tag: "Low Impact",
      tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/30"
    });
  }
  // Custom Scatter Tooltip (Requirement 10)
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#070C18] border border-[#1E293B] p-3 rounded-xl shadow-2xl font-mono text-xs space-y-1 z-50">
          <p className="font-bold text-emerald-400 text-sm">{data.campaign}</p>
          <p className="text-slate-300">Attention Time: <strong className="text-white">{data.x}s</strong></p>
          <p className="text-slate-300">Conversion Rate: <strong className="text-white">{data.y}%</strong></p>
          <p className="text-slate-300">Engagement: <strong className="text-blue-400">{data.eng}</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans text-xs pb-8">
      {/* GLOBAL MASTER HEADER WITH CAMPAIGN SELECTOR & MASTER DATE FILTER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">Marketing Manager Dashboard</h1>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Active Campaign Scope: <span className="text-amber-400 font-bold">{selectedCampaign}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {/* Campaign Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 font-mono">Campaign:</span>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All Active Campaigns">All Active Campaigns</option>
              <option value="Summer Sale">Summer Sale</option>
              <option value="Weekend Bonanza">Weekend Bonanza</option>
              <option value="New Arrival Launch">New Arrival Launch</option>
            </select>
          </div>

          {/* Master Global Date Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 font-mono">Global Period:</span>
            <CustomDateSelector value={globalPeriod} onChange={handleGlobalDateChange} />
          </div>
        </div>
      </div>

      {/* 1. KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Total Campaigns</span>
          <h2 className="text-xl font-black text-white font-mono">{totalCampaignsCount} Active</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 20% vs prev</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Total Impressions</span>
          <h2 className="text-xl font-black text-white font-mono">{formatNumber(totalImpressionsVal)}</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 18.6% vs prev</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Avg. Attention Time</span>
          <h2 className="text-xl font-black text-white font-mono">{telemetry.avgAttentionTime}s</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 14.3% vs prev</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Engagement Rate</span>
          <h2 className="text-xl font-black text-white font-mono">32.8%</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 9.7% vs prev</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Conversion Rate</span>
          <h2 className="text-xl font-black text-white font-mono">{telemetry.conversionRate}%</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 7.5% vs prev</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Promotional Revenue</span>
          <h2 className="text-xl font-black text-white font-mono">${formatNumber(promoRevenueVal)}</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 22.1% vs prev</span>
        </div>
      </div>

      {/* ROW 1: Campaign Performance | Promotion Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance Overview</h3>
            
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={campaignPerformanceData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={8} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={8} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={8} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Bar yAxisId="left" dataKey="impressions" fill="#8B5CF6" radius={[3, 3, 0, 0]} name="Impressions" />
                <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} name="Conversion %" />
              </ComposedChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Promotion Effectiveness Lift</h3>
            
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={promoEffectivenessData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="metric" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={8} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Bar dataKey="before" fill="#64748B" radius={[3, 3, 0, 0]} name="Before Promo" />
                <Bar dataKey="after" fill="#F59E0B" radius={[3, 3, 0, 0]} name="After Promo" />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* ROW 2: Marketing Conversion Funnel | Product Visibility Score by Shelf */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REQUIREMENT 9: PROFESSIONAL 7-STAGE MARKETING CONVERSION FUNNEL */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Marketing Conversion Funnel</h3>
            
          </div>

          <div className="space-y-2 pt-1">
            {funnelStages.map((f, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-full py-2 px-3 bg-gradient-to-r ${f.color} rounded-xl shadow-lg border border-white/10 flex items-center justify-between transition-all duration-300`}
                  style={{ width: `${f.widthPct}%` }}
                >
                  <span className="font-extrabold text-white text-[11px] tracking-wider uppercase truncate">{f.stage}</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-white text-[11px] block">{formatNumber(f.count)}</span>
                    <span className="text-[9px] text-white/90 font-bold block">{f.convPrev}</span>
                  </div>
                </div>
                {idx < funnelStages.length - 1 && (
                  <div className="text-slate-500 text-[9px]">▼</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Visibility Score by Shelf</h3>
            
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={visibilityByShelfData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="shelf" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={8} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Bar dataKey="score" radius={[3, 3, 0, 0]} name="Visibility Score">
                  {visibilityByShelfData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* ROW 3: Product Attractiveness Radar | Attention vs. Conversion Scatter Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Attractiveness Radar</h3>
          <div className="h-52 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={8} />
                <PolarRadiusAxis stroke="#64748B" fontSize={8} />
                <Radar name="Product A" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                <Radar name="Product B" dataKey="B" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
              </RadarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* REQUIREMENT 10: ATTENTION VS CONVERSION SCATTER WITH ENHANCED TOOLTIP */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention vs. Conversion Scatter Analysis</h3>
          <div className="h-52 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="x" name="Attention (s)" stroke="#64748B" fontSize={8} />
                <YAxis dataKey="y" name="Conversion %" stroke="#64748B" fontSize={8} />
                <ZAxis dataKey="z" range={[60, 200]} />
                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Campaigns" data={scatterData} fill="#10B981" />
              </ScatterChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* ROW 4: Top Performing Campaigns | Actionable Operational Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Campaigns</h3>
          <div className="divide-y divide-[#1E293B]">
            {topCampaigns.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between text-[11px]">
                <div>
                  <h4 className="text-white font-bold">{c.name}</h4>
                  <span className="text-[9px] text-slate-500">{c.imp} impressions</span>
                </div>
                <div className="text-right space-x-3">
                  <span className="text-emerald-400 font-bold">{c.conv} conv.</span>
                  <span className="text-amber-400 font-bold">{c.roi} ROI</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top High-Priority Recommendations</h3>
          <div className="space-y-3 pt-1">
            {topRecommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-[#0A1020] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <p className="text-white text-[11px] font-bold">{rec.title}</p>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${rec.tagColor}`}>
                  {rec.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
