import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis
} from "recharts";

export default function MarketingManagerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("Overview");

  const campaignPerformanceData = [
    { name: "Summer Sale", impressions: 1.5, engagement: 22, conversion: 28 },
    { name: "Weekend Bonanza", impressions: 1.7, engagement: 18, conversion: 35 },
    { name: "New Arrival Launch", impressions: 1.25, engagement: 15, conversion: 22 },
    { name: "Festive Offer", impressions: 0.9, engagement: 24, conversion: 30 },
    { name: "Clearance Sale", impressions: 1.4, engagement: 19, conversion: 26 },
  ];

  const promotionEffectivenessData = [
    { metric: "Footfall", before: 12.5, after: 18.9 },
    { metric: "Avg. Attention", before: 4.1, after: 6.8 },
    { metric: "Engagement Rate", before: 21, after: 33 },
    { metric: "Conversion Rate", before: 9.2, after: 14.6 },
    { metric: "Revenue", before: 5.6, after: 8.9 },
  ];

  const visibilityScoreData = [
    { shelf: "Shelf A", score: 92 },
    { shelf: "Shelf B", score: 78 },
    { shelf: "Shelf C", score: 64 },
    { shelf: "Shelf D", score: 58 },
    { shelf: "Shelf E", score: 42 },
  ];

  const radarData = [
    { subject: "Visual Appeal", ProductA: 90, ProductB: 70, ProductC: 60, ProductD: 50 },
    { subject: "Placement", ProductA: 80, ProductB: 85, ProductC: 65, ProductD: 75 },
    { subject: "Engagement", ProductA: 70, ProductB: 60, ProductC: 90, ProductD: 80 },
    { subject: "Pick Rate", ProductA: 85, ProductB: 75, ProductC: 70, ProductD: 65 },
    { subject: "Purchase Impact", ProductA: 95, ProductB: 80, ProductC: 85, ProductD: 70 },
  ];

  const scatterData = [
    { time: 2, conv: 5 }, { time: 3, conv: 9 }, { time: 4, conv: 11 },
    { time: 5, conv: 12 }, { time: 6, conv: 14 }, { time: 7, conv: 16 },
    { time: 8, conv: 18 }, { time: 9, conv: 19 }, { time: 10, conv: 21 },
    { time: 11, conv: 22 }
  ];

  const topCampaigns = [
    { id: 1, name: "Summer Sale", impressions: "620K", rate: "34.5%", conv: "16.2%", rev: "₹3.25L", roi: "4.2x" },
    { id: 2, name: "New Arrival Launch", impressions: "610K", rate: "33.1%", conv: "14.8%", rev: "₹2.18L", roi: "3.8x" },
    { id: 3, name: "Weekend Bonanza", impressions: "540K", rate: "28.9%", conv: "12.7%", rev: "₹1.72L", roi: "3.2x" },
    { id: 4, name: "Festive Offer", impressions: "310K", rate: "26.7%", conv: "11.3%", rev: "₹1.12L", roi: "2.9x" },
    { id: 5, name: "Clearance Sale", impressions: "170K", rate: "19.3%", conv: "8.6%", rev: "₹0.65L", roi: "2.1x" },
  ];

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 font-sans selection:bg-purple-600">
      {/* FULL-WIDTH MAIN CONTENT AREA (NO SIDEBAR) */}
      <main className="w-full p-6 space-y-6 max-w-[1700px] mx-auto">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Marketing Performance Overview</h1>
            <p className="text-xs text-slate-400">Track campaigns, promotions and consumer engagement</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-[#111A2E] border border-[#1E293B] rounded-xl px-3 py-1.5 flex items-center space-x-2 text-xs text-slate-300">
              <span>📅 May 16 – May 22, 2025</span>
            </div>
            <button className="bg-[#111A2E] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1">
              <span>Filter ▼</span>
            </button>
            <div className="relative bg-[#111A2E] border border-[#1E293B] p-2 rounded-xl text-slate-300">
              🔔
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">5</span>
            </div>
          </div>
        </div>

        {/* 6 TOP KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Campaigns", val: "12", sub: "+20%", color: "text-emerald-400", icon: "📣" },
            { label: "Total Impressions", val: "2.45M", sub: "+18.6%", color: "text-emerald-400", icon: "👁️" },
            { label: "Avg. Attention Time", val: "6.42s", sub: "+14.3%", color: "text-emerald-400", icon: "⏱️" },
            { label: "Engagement Rate", val: "32.8%", sub: "+9.7%", color: "text-emerald-400", icon: "👥" },
            { label: "Conversion Rate", val: "14.6%", sub: "+7.5%", color: "text-emerald-400", icon: "📈" },
            { label: "Revenue Generated", val: "₹8.92L", sub: "+22.1%", color: "text-emerald-400", icon: "₹" },
          ].map((card, i) => (
            <div key={i} className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-3.5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
                <span className="text-xs">{card.icon}</span>
              </div>
              <div className="my-2">
                <span className="text-lg font-extrabold text-white block">{card.val}</span>
                <span className={`text-[10px] font-bold ${card.color}`}>vs last 7 days {card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ROW 1: 3 CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance Overview</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={campaignPerformanceData}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={9} />
                  <YAxis yAxisId="left" stroke="#64748B" fontSize={9} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#0B1329", borderColor: "#1E293B" }} />
                  <Bar yAxisId="left" dataKey="impressions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Promotion Effectiveness (Before vs After)</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={promotionEffectivenessData}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="metric" stroke="#64748B" fontSize={8} />
                  <YAxis stroke="#64748B" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#0B1329", borderColor: "#1E293B" }} />
                  <Bar dataKey="before" fill="#64748B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="after" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Conversion Funnel</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              {[
                { label: "Impressions", val: "2,450,000", pct: "100%", bg: "bg-purple-600/80", w: "w-full" },
                { label: "Viewed", val: "1,255,000", pct: "(51.2%)", bg: "bg-blue-500/80", w: "w-[85%]" },
                { label: "Engaged", val: "802,000", pct: "(32.7%)", bg: "bg-teal-500/80", w: "w-[70%]" },
                { label: "Interested", val: "358,000", pct: "(14.6%)", bg: "bg-amber-500/80", w: "w-[55%]" },
                { label: "Converted", val: "179,000", pct: "(7.3%)", bg: "bg-rose-500/80", w: "w-[40%]" },
              ].map((f, idx) => (
                <div key={idx} className={`${f.w} ${f.bg} rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-white shadow-md`}>
                  <span>{f.label}</span>
                  <span className="font-mono">{f.val} <span className="text-[10px] opacity-80">{f.pct}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 2: 3 CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Visibility Score by Shelf</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={visibilityScoreData}>
                  <XAxis type="number" stroke="#64748B" fontSize={9} domain={[0, 100]} />
                  <YAxis type="category" dataKey="shelf" stroke="#64748B" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#0B1329", borderColor: "#1E293B" }} />
                  <Bar dataKey="score" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Attractiveness Score</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#1E293B" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={9} />
                  <PolarRadiusAxis stroke="#64748B" fontSize={8} />
                  <Radar name="Product A" dataKey="ProductA" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                  <Radar name="Product B" dataKey="ProductB" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention vs Conversion</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="time" name="Avg. Attention (s)" stroke="#64748B" fontSize={9} />
                  <YAxis type="number" dataKey="conv" name="Conversion (%)" stroke="#64748B" fontSize={9} />
                  <ZAxis range={[50, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#0B1329", borderColor: "#1E293B" }} />
                  <Scatter name="Conversion Score" data={scatterData} fill="#10B981" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: BOTTOM TABLES & SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Campaigns</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-500 font-bold">
                    <th className="pb-2"># Campaign Name</th>
                    <th className="pb-2">Impressions</th>
                    <th className="pb-2">Rate</th>
                    <th className="pb-2">Conv</th>
                    <th className="pb-2">Revenue</th>
                    <th className="pb-2">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {topCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-[#131E3A]/50">
                      <td className="py-2.5 font-bold text-white">{c.id}. {c.name}</td>
                      <td className="py-2.5 text-slate-300">{c.impressions}</td>
                      <td className="py-2.5 text-slate-300">{c.rate}</td>
                      <td className="py-2.5 text-slate-300">{c.conv}</td>
                      <td className="py-2.5 font-bold text-emerald-400">{c.rev}</td>
                      <td className="py-2.5 font-bold text-purple-400">{c.roi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Marketing Recommendations (AI Powered)</h3>
            <div className="space-y-3">
              {[
                { title: "Increase visibility of Product C on Shelf B", desc: "High attention, low conversions detected.", badge: "High Impact", col: "text-emerald-400 bg-emerald-950/40 border-emerald-800" },
                { title: "Extend Weekend Bonanza campaign", desc: "Performing well with high engagement.", badge: "Medium Impact", col: "text-blue-400 bg-blue-950/40 border-blue-800" },
                { title: "Relocate Product D to Shelf A", desc: "Low visibility detected on current shelf.", badge: "Medium Impact", col: "text-amber-400 bg-amber-950/40 border-amber-800" },
                { title: "Increase promotion in 6 PM - 9 PM slot", desc: "High footfall but low conversion in this time.", badge: "Low Impact", col: "text-purple-400 bg-purple-950/40 border-purple-800" },
              ].map((rec, i) => (
                <div key={i} className="bg-[#111A2E] border border-[#1E293B] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{rec.desc}</p>
                  </div>
                  <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg ${rec.col}`}>
                    {rec.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Summary</h3>
              <span className="text-[10px] bg-[#131E3A] text-slate-400 px-2 py-1 rounded-lg">Last 7 Days ▼</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#111A2E] border border-[#1E293B] rounded-xl">
                <span className="text-slate-300 font-semibold">Total Active Campaigns</span>
                <span className="font-bold text-white font-mono">7</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#111A2E] border border-[#1E293B] rounded-xl">
                <span className="text-slate-300 font-semibold">Total Completed Campaigns</span>
                <span className="font-bold text-white font-mono">5</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#111A2E] border border-[#1E293B] rounded-xl">
                <span className="text-slate-300 font-semibold">Upcoming Campaigns</span>
                <span className="font-bold text-white font-mono">3</span>
              </div>
              
              <div className="p-3 bg-[#111A2E] border border-[#1E293B] rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Total Budget</span>
                  <span className="text-white">₹12.50L</span>
                </div>
                <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-purple-600 h-full w-[66.8%]" />
                  <div className="bg-emerald-500 h-full w-[33.2%]" />
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>Budget Utilized: <strong className="text-purple-400">₹8.35L (66.8%)</strong></span>
                  <span>Remaining: <strong className="text-emerald-400">₹4.15L (33.2%)</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
