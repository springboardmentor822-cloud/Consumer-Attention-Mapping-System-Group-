import React, { useState } from "react";
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, LineChart
} from "recharts";

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const navTabs = [
    { name: "Overview", icon: "??" },
    { name: "Campaign Performance", icon: "??" },
    { name: "Promotion Effectiveness", icon: "???" },
    { name: "Product Visibility", icon: "???" },
    { name: "Product Attractiveness", icon: "?" },
    { name: "Customer Engagement", icon: "??" },
    { name: "Conversion Analysis", icon: "??" },
  ];

  const sparkline1 = [{ v: 10 }, { v: 12 }, { v: 8 }, { v: 14 }, { v: 11 }, { v: 15 }, { v: 12 }];
  const sparkline2 = [{ v: 2.1 }, { v: 2.2 }, { v: 2.0 }, { v: 2.3 }, { v: 2.2 }, { v: 2.4 }, { v: 2.45 }];
  const sparkline3 = [{ v: 5.8 }, { v: 6.0 }, { v: 5.9 }, { v: 6.2 }, { v: 6.1 }, { v: 6.3 }, { v: 6.42 }];
  const sparkline4 = [{ v: 28 }, { v: 30 }, { v: 29 }, { v: 31 }, { v: 30 }, { v: 32 }, { v: 32.8 }];
  const sparkline5 = [{ v: 12 }, { v: 13 }, { v: 12.5 }, { v: 13.8 }, { v: 13 }, { v: 14.2 }, { v: 14.6 }];
  const sparkline6 = [{ v: 7.2 }, { v: 7.5 }, { v: 7.8 }, { v: 8.1 }, { v: 8.0 }, { v: 8.5 }, { v: 8.92 }];

  const campaignPerformanceData = [
    { name: "Summer Sale", impressions: 1650, engagement: 31, conversion: 15 },
    { name: "Weekend Bonanza", impressions: 2200, engagement: 22, conversion: 11 },
    { name: "New Arrival Launch", impressions: 1500, engagement: 28, conversion: 14 },
    { name: "Festive Offer", impressions: 1850, engagement: 33, conversion: 19 },
    { name: "Clearance Sale", impressions: 2050, engagement: 29, conversion: 12 }
  ];

  const promoEffectivenessData = [
    { metric: "Footfall", before: 12.5, after: 18.5 },
    { metric: "Avg. Attention Time", before: 4.1, after: 6.8 },
    { metric: "Engagement Rate", before: 21, after: 33 },
    { metric: "Conversion Rate", before: 9.2, after: 14.6 },
    { metric: "Revenue", before: 5.6, after: 8.9 }
  ];

  const funnelData = [
    { stage: "Impressions", count: "2,450,000", percent: "", bg: "bg-purple-600", width: "w-full" },
    { stage: "Viewed", count: "1,255,000", percent: "(51.2%)", bg: "bg-blue-500", width: "w-[85%]" },
    { stage: "Engaged", count: "802,000", percent: "(32.7%)", bg: "bg-teal-500", width: "w-[68%]" },
    { stage: "Interested", count: "358,000", percent: "(14.6%)", bg: "bg-amber-500", width: "w-[50%]" },
    { stage: "Converted", count: "179,000", percent: "(7.3%)", bg: "bg-rose-500", width: "w-[35%]" }
  ];

  const visibilityByShelfData = [
    { shelf: "Shelf A", score: 92, fill: "#8B5CF6" },
    { shelf: "Shelf B", score: 78, fill: "#2563EB" },
    { shelf: "Shelf C", score: 64, fill: "#06B6D4" },
    { shelf: "Shelf D", score: 58, fill: "#10B981" },
    { shelf: "Shelf E", score: 42, fill: "#F59E0B" }
  ];

  const radarData = [
    { subject: "Visual Appeal", A: 90, B: 70, C: 60, D: 40 },
    { subject: "Placement", A: 85, B: 80, C: 65, D: 50 },
    { subject: "Engagement", A: 75, B: 85, C: 70, D: 60 },
    { subject: "Pick Rate", A: 80, B: 65, C: 75, D: 55 },
    { subject: "Purchase Impact", A: 95, B: 75, C: 80, D: 45 }
  ];

  const scatterHigh = [{ x: 9, y: 17 }, { x: 10, y: 19 }, { x: 11, y: 18 }, { x: 12, y: 22 }, { x: 13, y: 23 }];
  const scatterMed = [{ x: 3, y: 9 }, { x: 5, y: 12 }, { x: 6, y: 11 }, { x: 7, y: 14 }, { x: 8, y: 15 }];
  const scatterLow = [{ x: 1.5, y: 4 }, { x: 2.5, y: 6 }, { x: 4, y: 7 }, { x: 6.5, y: 9 }];

  const topCampaigns = [
    { id: 1, name: "Summer Sale", imp: "820K", eng: "34.5%", conv: "16.2%", rev: "?3.25L", roi: "4.2x" },
    { id: 2, name: "New Arrival Launch", imp: "610K", eng: "33.1%", conv: "14.8%", rev: "?2.18L", roi: "3.8x" },
    { id: 3, name: "Weekend Bonanza", imp: "540K", eng: "28.9%", conv: "12.7%", rev: "?1.72L", roi: "3.2x" },
    { id: 4, name: "Festive Offer", imp: "310K", eng: "26.7%", conv: "11.3%", rev: "?1.12L", roi: "2.6x" },
    { id: 5, name: "Clearance Sale", imp: "170K", eng: "19.3%", conv: "8.6%", rev: "?0.65L", roi: "2.1x" }
  ];

  const aiRecommendations = [
    { title: "Increase visibility of Product C on Shelf B", subtitle: "High attention, low conversions detected.", tag: "High Impact", tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: "??" },
    { title: "Extend Weekend Bonanza campaign", subtitle: "Performing well with high engagement.", tag: "Medium Impact", tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: "??" },
    { title: "Relocate Product D to Shelf A", subtitle: "Low visibility detected on current shelf.", tag: "Medium Impact", tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: "??" },
    { title: "Increase promotion in 6 PM – 9 PM slot", subtitle: "High footfall but low conversions this time.", tag: "Low Impact", tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: "??" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">
      
      {/* 1. TOP HEADER BRAND BAR */}
      <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <button className="bg-[#182238] hover:bg-[#202C48] text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-xl border border-[#273552] flex items-center space-x-1.5 transition">
            <span>?</span>
            <span>Back</span>
          </button>
          <span className="text-white font-black text-sm tracking-wide">Consumer Attention Mapping System</span>
          <span className="bg-[#B45309]/30 text-[#F59E0B] border border-[#B45309]/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
            Marketing Manager Portal
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-slate-950 font-black flex items-center justify-center text-xs">
              M
            </div>
            <div className="leading-tight">
              <span className="text-white font-bold block text-xs">Marketing Manager</span>
              <span className="text-slate-400 text-[10px] block">Marketing Manager</span>
            </div>
          </div>
          <button className="bg-[#3F1A24] hover:bg-[#52212E] text-[#F87171] border border-[#7F1D1D]/50 font-bold px-3 py-1.5 rounded-xl text-xs transition">
            Logout
          </button>
        </div>
      </div>

      {/* 2. TOP NAVIGATION TABS */}
      <div className="border-b border-[#1E293B] pb-2 pt-1">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? "bg-[#D97706] text-slate-950 shadow-md shadow-[#D97706]/20"
                    : "bg-[#0D1527] text-slate-400 hover:text-white border border-[#1E293B] hover:border-[#273552]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DASHBOARD FILTER CONTROLS */}
      <div className="flex flex-wrap justify-between items-center gap-4 pt-1">
        <div>
          <h1 className="text-xl font-black text-white">Marketing Manager Dashboard</h1>
          <p className="text-slate-400 text-xs">Track campaigns, promotions and consumer engagement across all stores.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
            <span>??</span>
            <span>May 16 – May 22, 2025</span>
          </button>
          <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
            <span>??</span>
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 4. KPI CARDS WITH SPARKLINES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
          <span className="text-slate-400 text-[11px] block font-medium">Total Campaigns</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <h2 className="text-xl font-black text-white font-mono">12</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 20%</span>
          </div>
          <div className="h-8 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline1}><Line type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={1.5} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
          <span className="text-slate-400 text-[11px] block font-medium">Total Impressions</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <h2 className="text-xl font-black text-white font-mono">2.45M</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 18.6%</span>
          </div>
          <div className="h-8 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline2}><Line type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={1.5} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
          <span className="text-slate-400 text-[11px] block font-medium">Avg. Attention Time</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <h2 className="text-xl font-black text-white font-mono">6.42s</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 14.3%</span>
          </div>
          <div className="h-8 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline3}><Line type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={1.5} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
          <span className="text-slate-400 text-[11px] block font-medium">Engagement Rate</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <h2 className="text-xl font-black text-white font-mono">32.8%</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 9.7%</span>
          </div>
          <div className="h-8 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline4}><Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={1.5} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
          <span className="text-slate-400 text-[11px] block font-medium">Conversion Rate</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <h2 className="text-xl font-black text-white font-mono">14.6%</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 7.5%</span>
          </div>
          <div className="h-8 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline5}><Line type="monotone" dataKey="v" stroke="#06B6D4" strokeWidth={1.5} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
          <span className="text-slate-400 text-[11px] block font-medium">Revenue Generated</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <h2 className="text-xl font-black text-white font-mono">? 8.92L</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 22.1%</span>
          </div>
          <div className="h-8 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline6}><Line type="monotone" dataKey="v" stroke="#EC4899" strokeWidth={1.5} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. ROW 1 CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Campaign Performance Overview</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={campaignPerformanceData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={8} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} domain={[0, 40]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar yAxisId="left" dataKey="impressions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#2563EB" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Promotion Effectiveness (Before vs After)</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promoEffectivenessData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="metric" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="before" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="after" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Campaign Conversion Funnel</h3>
          <div className="space-y-2 pt-2">
            {funnelData.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300 font-bold">{f.stage}</span>
                  <span className="text-white">{f.count} <span className="text-slate-400">{f.percent}</span></span>
                </div>
                <div className="h-2 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B] flex justify-center">
                  <div className={`h-full ${f.bg} ${f.width} rounded-full`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. ROW 2 CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Product Visibility Score by Shelf</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visibilityByShelfData} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} domain={[0, 100]} />
                <YAxis dataKey="shelf" type="category" stroke="#64748B" fontSize={9} width={60} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {visibilityByShelfData.map((e, idx) => (
                    <Bar key={`cell-${idx}`} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Product Attractiveness Score</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={8} />
                <PolarRadiusAxis stroke="#64748B" fontSize={8} />
                <Radar name="Product A" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                <Radar name="Product B" dataKey="B" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
                <Radar name="Product C" dataKey="C" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Radar name="Product D" dataKey="D" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Attention vs Conversion</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" stroke="#64748B" fontSize={9} unit="s" />
                <YAxis type="number" dataKey="y" stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Scatter name="High" data={scatterHigh} fill="#10B981" />
                <Scatter name="Med" data={scatterMed} fill="#2563EB" />
                <Scatter name="Low" data={scatterLow} fill="#F59E0B" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7. ROW 3 TABLES & RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Top Performing Campaigns</h3>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">#</th>
                <th className="pb-2">Campaign</th>
                <th className="pb-2">Impressions</th>
                <th className="pb-2">Eng.</th>
                <th className="pb-2">Conv.</th>
                <th className="pb-2">Revenue</th>
                <th className="pb-2">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {topCampaigns.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 text-slate-500">{row.id}</td>
                  <td className="py-2 font-bold text-white">{row.name}</td>
                  <td className="py-2 text-slate-300">{row.imp}</td>
                  <td className="py-2 text-slate-400">{row.eng}</td>
                  <td className="py-2 text-slate-300">{row.conv}</td>
                  <td className="py-2 font-bold text-white">{row.rev}</td>
                  <td className="py-2 text-emerald-400 font-bold">{row.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Marketing Recommendations (AI Powered)</h3>
          <div className="space-y-2">
            {aiRecommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>{rec.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                    <span className="text-[10px] text-slate-400 block">{rec.subtitle}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${rec.tagColor}`}>
                  {rec.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase">Campaign Summary</h3>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Active Campaigns</span>
              <strong className="text-white">7</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Completed Campaigns</span>
              <strong className="text-white">5</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Upcoming Campaigns</span>
              <strong className="text-white">3</strong>
            </div>
            <div className="pt-2 border-t border-[#1E293B] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Budget</span>
                <strong className="text-white">?12.55L</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Budget Utilized</span>
                <strong className="text-purple-400 font-bold">?8.33L (66.8%)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining Budget</span>
                <strong className="text-white">?4.22L (33.2%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
