import React, { useState } from "react";
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, LineChart, Cell
} from "recharts";
import { useCams } from "../../services/CamsContext";

export default function MarketingOverview() {
  const { dateRange, setDateRange, telemetry } = useCams();
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState("All Campaigns");

  // Dynamic Scale multiplier based on dateRange
  let scale = 1.0;
  if (dateRange === "Today") scale = 0.14;
  else if (dateRange === "Yesterday") scale = 0.13;
  else if (dateRange === "Last 7 Days") scale = 1.0;
  else if (dateRange === "Last 30 Days") scale = 4.2;
  else if (dateRange === "This Month") scale = 3.8;
  else if (dateRange === "Custom Date Range") scale = 2.0;

  // Datasets scaled dynamically by period selection
  const campaignPerformanceData = [
    { name: "Summer Sale", impressions: Math.round(1650 * scale), engagement: 31, conversion: 15 },
    { name: "Weekend Bonanza", impressions: Math.round(2200 * scale), engagement: 22, conversion: 11 },
    { name: "New Arrival Launch", impressions: Math.round(1500 * scale), engagement: 28, conversion: 14 },
    { name: "Festive Offer", impressions: Math.round(1850 * scale), engagement: 33, conversion: 19 },
    { name: "Clearance Sale", impressions: Math.round(2050 * scale), engagement: 29, conversion: 12 }
  ];

  const promoEffectivenessData = [
    { metric: "Footfall", before: Math.round(12.5 * scale), after: Math.round(18.5 * scale) },
    { metric: "Attention (s)", before: 4.1, after: 6.8 },
    { metric: "Engagement %", before: 21, after: 33 },
    { metric: "Conversion %", before: 9.2, after: 14.6 },
    { metric: "Revenue ($K)", before: Math.round(5.6 * scale), after: Math.round(8.9 * scale) }
  ];

  const funnelData = [
    { stage: "Impressions", count: Math.round(245000 * scale).toLocaleString(), width: "w-full", bg: "bg-purple-600" },
    { stage: "Viewed", count: Math.round(125500 * scale).toLocaleString(), width: "w-[85%]", bg: "bg-blue-500" },
    { stage: "Engaged", count: Math.round(80200 * scale).toLocaleString(), width: "w-[68%]", bg: "bg-teal-500" },
    { stage: "Interested", count: Math.round(35800 * scale).toLocaleString(), width: "w-[50%]", bg: "bg-amber-500" },
    { stage: "Converted", count: Math.round(17900 * scale).toLocaleString(), width: "w-[35%]", bg: "bg-rose-500" }
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
    { x: 9, y: 17, z: 100, name: "Summer Sale" },
    { x: 10, y: 19, z: 120, name: "Weekend Bonanza" },
    { x: 11, y: 18, z: 110, name: "New Arrival" },
    { x: 6, y: 11, z: 80, name: "Festive Offer" },
    { x: 4, y: 7, z: 60, name: "Clearance Sale" }
  ];

  const topCampaigns = [
    { id: 1, name: "Summer Sale", imp: Math.round(820 * scale) + "K", eng: "34.5%", conv: "16.2%", roi: "4.2x" },
    { id: 2, name: "New Arrival Launch", imp: Math.round(610 * scale) + "K", eng: "33.1%", conv: "14.8%", roi: "3.8x" },
    { id: 3, name: "Weekend Bonanza", imp: Math.round(540 * scale) + "K", eng: "28.9%", conv: "12.7%", roi: "3.2x" },
    { id: 4, name: "Festive Offer", imp: Math.round(310 * scale) + "K", eng: "26.7%", conv: "11.3%", roi: "2.6x" }
  ];

  const topRecommendations = [
    { title: "Increase visibility of Product C on Shelf B", tag: "High Impact", tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { title: "Extend Weekend Bonanza promotion", tag: "Medium Impact", tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { title: "Relocate low-performing endcap display", tag: "High Impact", tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs pb-8">
      {/* HEADER WITH TITLE ONLY AND PERIOD/FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
        <h1 className="text-xl font-black text-white tracking-wide">Marketing Manager Dashboard</h1>

        <div className="flex items-center gap-3">
          <select
            value={selectedCampaignFilter}
            onChange={(e) => setSelectedCampaignFilter(e.target.value)}
            className="bg-[#0A1020] border border-[#273449] text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="All Campaigns">All Active Campaigns</option>
            <option value="Summer Sale">Summer Sale</option>
            <option value="Weekend Bonanza">Weekend Bonanza</option>
            <option value="New Arrival Launch">New Arrival Launch</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#0A1020] border border-[#273449] text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
            <option value="Custom Date Range">Custom Date Range</option>
          </select>
        </div>
      </div>

      {/* 1. KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Total Campaigns</span>
          <h2 className="text-xl font-black text-white font-mono">12 Active</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 20% vs prev</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Total Impressions</span>
          <h2 className="text-xl font-black text-white font-mono">{Math.round(245 * scale)}K</h2>
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
          <h2 className="text-xl font-black text-white font-mono">${Math.round(24800 * scale).toLocaleString()}</h2>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">↑ 22.1% vs prev</span>
        </div>
      </div>

      {/* 2. ANALYTICAL SECTION - STRICTLY TWO COMPONENTS PER ROW */}

      {/* ROW 1: Campaign Performance | Promotion Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance Overview</h3>
          <div className="h-56 w-full">
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
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Promotion Effectiveness Lift (Before vs. After)</h3>
          <div className="h-56 w-full">
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
          </div>
        </div>
      </div>

      {/* ROW 2: Marketing Conversion Funnel | Product Visibility Score by Shelf */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Marketing Conversion Funnel</h3>
          <div className="space-y-3 pt-2">
            {funnelData.map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">{f.stage}</span>
                  <span className="text-white font-bold">{f.count}</span>
                </div>
                <div className="h-3 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className={`h-full ${f.bg} ${f.width} rounded-full`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Visibility Score by Shelf</h3>
          <div className="h-56 w-full">
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
          </div>
        </div>
      </div>

      {/* ROW 3: Product Attractiveness Radar | Attention vs. Conversion Scatter Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Attractiveness Radar</h3>
          <div className="h-52 w-full">
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
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention vs. Conversion Scatter Analysis</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="x" name="Attention (s)" stroke="#64748B" fontSize={8} />
                <YAxis dataKey="y" name="Conversion %" stroke="#64748B" fontSize={8} />
                <ZAxis dataKey="z" range={[60, 200]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Campaigns" data={scatterData} fill="#10B981" />
              </ScatterChart>
            </ResponsiveContainer>
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
