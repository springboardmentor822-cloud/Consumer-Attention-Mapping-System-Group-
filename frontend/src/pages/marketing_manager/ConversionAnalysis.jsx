import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function ConversionAnalysis() {
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

  // 1. CONVERSION RATE OVER TIME (LINE CHART)
  const conversionTrend = [
    { day: "Mon", rate: 11.2, target: 13, conversions: Math.round(180 * mult) },
    { day: "Tue", rate: 13.5, target: 13, conversions: Math.round(240 * mult) },
    { day: "Wed", rate: 12.8, target: 13, conversions: Math.round(210 * mult) },
    { day: "Thu", rate: 15.2, target: 13, conversions: Math.round(290 * mult) },
    { day: "Fri", rate: 16.9, target: 13, conversions: Math.round(350 * mult) },
    { day: "Sat", rate: 18.4, target: 13, conversions: Math.round(410 * mult) },
    { day: "Sun", rate: 14.6, target: 13, conversions: Math.round(260 * mult) },
  ];

  // 2. CONVERSION RATE BY CHANNEL (BAR CHART)
  const channelConversionData = [
    { channel: "In-Store Display", rate: 18.4, conversions: Math.round(620 * mult) },
    { channel: "Digital Signage", rate: 14.2, conversions: Math.round(480 * mult) },
    { channel: "Shelf Endcap Promo", rate: 22.8, conversions: Math.round(710 * mult) },
    { channel: "Entrance Spotlight", rate: 11.5, conversions: Math.round(340 * mult) },
    { channel: "Checkout Counter", rate: 26.1, conversions: Math.round(890 * mult) }
  ];

  // 3. CONVERSION RATE BY PRODUCT CATEGORY (DONUT CHART)
  const categoryConversionData = [
    { category: "Electronics", rate: 16.8, color: "#8B5CF6" },
    { category: "Apparel", rate: 14.2, color: "#3B82F6" },
    { category: "Grocery", rate: 19.5, color: "#10B981" },
    { category: "Beverages", rate: 21.4, color: "#06B6D4" },
    { category: "Beauty", rate: 12.6, color: "#F59E0B" }
  ];

  const productConversion = [
    { product: "Product A", views: Math.round(4200 * mult), pickups: Math.round(1890 * mult), purchases: Math.round(680 * mult), rate: 16.2, category: "Electronics" },
    { product: "Product B", views: Math.round(3800 * mult), pickups: Math.round(1420 * mult), purchases: Math.round(541 * mult), rate: 14.2, category: "Electronics" },
    { product: "Product C", views: Math.round(3100 * mult), pickups: Math.round(1210 * mult), purchases: Math.round(523 * mult), rate: 16.9, category: "Apparel" },
    { product: "Product D", views: Math.round(2600 * mult), pickups: Math.round(780 * mult), purchases: Math.round(255 * mult), rate: 9.8, category: "Grocery" },
    { product: "Product E", views: Math.round(2200 * mult), pickups: Math.round(920 * mult), purchases: Math.round(275 * mult), rate: 12.5, category: "Apparel" },
  ];

  // 7-STAGE MARKETING CONVERSION FUNNEL
  const totalBaseImp = Math.round(250000 * mult);
  const funnelStages = [
    { stage: "Impressions", count: totalBaseImp, convPrev: "100%", widthPct: 100, color: "from-[#8B5CF6] to-[#6366F1]" },
    { stage: "Views", count: Math.round(totalBaseImp * 0.70), convPrev: "70.0% from Imp", widthPct: 86, color: "from-[#6366F1] to-[#3B82F6]" },
    { stage: "Engagement", count: Math.round(totalBaseImp * 0.48), convPrev: "68.6% from Views", widthPct: 72, color: "from-[#3B82F6] to-[#06B6D4]" },
    { stage: "Clicks", count: Math.round(totalBaseImp * 0.32), convPrev: "66.7% from Eng", widthPct: 58, color: "from-[#06B6D4] to-[#10B981]" },
    { stage: "Product Views", count: Math.round(totalBaseImp * 0.22), convPrev: "68.8% from Clicks", widthPct: 44, color: "from-[#10B981] to-[#F59E0B]" },
    { stage: "Purchases", count: Math.round(totalBaseImp * 0.14), convPrev: "63.6% from Prod Views", widthPct: 32, color: "from-[#F59E0B] to-[#EC4899]" },
    { stage: "Conversions", count: Math.round(totalBaseImp * 0.10), convPrev: "71.4% from Purchases", widthPct: 22, color: "from-[#EC4899] to-[#EF4444]" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-6">
      {/* PAGE HEADER WITH MASTER DATE FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white">Conversion Analysis</h1>
          <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            Scope: All Products
          </span>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-400 font-mono">Date Range:</span>
          <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {[
          { label: "Overall Conversion Rate", val: "14.6%", sub: "↑ 7.5% vs last week", col: "text-emerald-400" },
          { label: "Total Conversions", val: formatNumber(Math.round(1810 * mult)), sub: `Period: ${selectedPeriod}`, col: "text-emerald-400" },
          { label: "Attention-to-Purchase", val: "32.1%", sub: "Of engaged visitors", col: "text-blue-400" },
          { label: "Avg. Drop-off Rate", val: "67.9%", sub: "↓ 3.2% improved", col: "text-amber-400" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium font-sans">{k.label}</span>
            <h2 className="text-lg font-black text-white mt-1">{k.val}</h2>
            <span className={`text-[10px] font-bold ${k.col}`}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* 2. ADD CONVERSION ANALYTICS BOXES (OVER TIME, BY CHANNEL, BY CATEGORY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* LINE CHART: Conversion Rate Over Time */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Conversion Rate Over Time</h3>
            <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
          </div>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" domain={[0, 25]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} name="Conversion Rate %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 4" name="Target %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* BAR CHART: Conversion Rate by Channel */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Conversion Rate by Channel</h3>
            <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
          </div>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelConversionData} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} unit="%" />
                <YAxis dataKey="channel" type="category" stroke="#64748B" fontSize={8} width={95} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="rate" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Conv Rate %" />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* DONUT CHART: Conversion Rate by Product Category */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Conversion Rate by Category</h3>
            <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
          </div>
          <div className="h-36 relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryConversionData} innerRadius={36} outerRadius={54} dataKey="rate">
                  {categoryConversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">16.9%</strong>
              <span className="text-[8px] text-slate-400 block">Avg Rate</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {categoryConversionData.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 truncate">{cat.category}</span>
                </span>
                <strong className="text-white ml-1">{cat.rate}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MARKETING CONVERSION FUNNEL & DETAILS TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Marketing Conversion Funnel</h3>
            <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
          </div>
          <div className="space-y-2 pt-1">
            {funnelStages.map((f, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-full py-2 px-3 bg-gradient-to-r ${f.color} rounded-xl shadow-lg border border-white/10 flex items-center justify-between transition-all duration-300`}
                  style={{ width: `${f.widthPct}%` }}
                >
                  <span className="font-extrabold text-white text-[10px] tracking-wider uppercase truncate">{f.stage}</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-white text-[10px] block">{formatNumber(f.count)}</span>
                    <span className="text-[8px] text-white/90 font-bold block">{f.convPrev}</span>
                  </div>
                </div>
                {idx < funnelStages.length - 1 && (
                  <div className="text-slate-500 text-[9px]">▼</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Conversion Table */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Product-wise Conversion Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2">Product</th><th className="pb-2">Category</th><th className="pb-2">Views</th>
                  <th className="pb-2">Pick-ups</th><th className="pb-2">Purchases</th>
                  <th className="pb-2">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {productConversion.map((p, i) => (
                  <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                    <td className="py-2.5 font-bold text-white">{p.product}</td>
                    <td className="py-2.5 text-slate-400 font-sans">{p.category}</td>
                    <td className="py-2.5 text-slate-300 font-mono">{formatNumber(p.views)}</td>
                    <td className="py-2.5 text-slate-300 font-mono">{formatNumber(p.pickups)}</td>
                    <td className="py-2.5 text-emerald-400 font-bold font-mono">{formatNumber(p.purchases)}</td>
                    <td className="py-2.5 font-black text-white font-mono">{p.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
