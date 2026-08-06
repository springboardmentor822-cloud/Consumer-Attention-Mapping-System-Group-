import React, { useState } from "react";
import {
  LineChart, Line, ComposedChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function CampaignPerformance() {
  const [activeTab, setActiveTab] = useState("Campaign Performance");
  const [searchQuery, setSearchQuery] = useState("");

  const navTabs = [
    { name: "Overview", icon: "??" },
    { name: "Campaign Performance", icon: "??" },
    { name: "Promotion Effectiveness", icon: "???" },
    { name: "Product Visibility", icon: "???" },
    { name: "Product Attractiveness", icon: "?" },
    { name: "Customer Engagement", icon: "??" },
    { name: "Conversion Analysis", icon: "??" },
  ];

  // 1. OVER TIME TRENDS DATA
  const overTimeData = [
    { date: "May 16", impressions: 2150, engagements: 1350, conversions: 500 },
    { date: "May 17", impressions: 2400, engagements: 1600, conversions: 720 },
    { date: "May 18", impressions: 1950, engagements: 1220, conversions: 410 },
    { date: "May 19", impressions: 2450, engagements: 1500, conversions: 710 },
    { date: "May 20", impressions: 2420, engagements: 1480, conversions: 750 },
    { date: "May 21", impressions: 2510, engagements: 1780, conversions: 950 },
    { date: "May 22", impressions: 2100, engagements: 1320, conversions: 580 }
  ];

  // 2. CHANNEL PERFORMANCE DATA
  const channelData = [
    { channel: "In-Store Display", impressions: 2100, engagement: 26, conversion: 13 },
    { channel: "Digital Screens", impressions: 820, engagement: 35, conversion: 10 },
    { channel: "Social Media", impressions: 1420, engagement: 22, conversion: 20 },
    { channel: "Email", impressions: 1900, engagement: 24, conversion: 24 },
    { channel: "SMS", impressions: 1620, engagement: 18, conversion: 19 },
    { channel: "Print Media", impressions: 800, engagement: 33, conversion: 12 }
  ];

  // 3. STATUS DISTRIBUTION DONUT DATA
  const statusData = [
    { name: "Active", value: 7, percent: "58.3%", color: "#8B5CF6" },
    { name: "Completed", value: 3, percent: "25.0%", color: "#2563EB" },
    { name: "Scheduled", value: 2, percent: "16.7%", color: "#10B981" }
  ];

  // 4. CAMPAIGN SUMMARY TABLE DATA
  const campaignSummary = [
    { id: 1, name: "Summer Sale", channel: "In-Store Display", status: "Active", statusBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", imp: "820K", eng: "34.5%", conv: "16.2%", rev: "?3.25L", roi: "4.2x", icon: "??" },
    { id: 2, name: "New Arrival Launch", channel: "Digital Screens", status: "Active", statusBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", imp: "610K", eng: "33.1%", conv: "14.8%", rev: "?2.18L", roi: "3.8x", icon: "??" },
    { id: 3, name: "Weekend Bonanza", channel: "Social Media", status: "Active", statusBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", imp: "540K", eng: "28.9%", conv: "12.7%", rev: "?1.72L", roi: "3.2x", icon: "??" },
    { id: 4, name: "Festive Offer", channel: "Email", status: "Completed", statusBg: "bg-blue-500/10 text-blue-400 border-blue-500/30", imp: "310K", eng: "26.7%", conv: "11.3%", rev: "?1.12L", roi: "2.6x", icon: "??" },
    { id: 5, name: "Clearance Sale", channel: "SMS", status: "Active", statusBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", imp: "170K", eng: "19.3%", conv: "8.6%", rev: "?0.65L", roi: "2.1x", icon: "??" },
    { id: 6, name: "Loyalty Program", channel: "Print Media", status: "Scheduled", statusBg: "bg-amber-500/10 text-amber-400 border-amber-500/30", imp: "80K", eng: "15.2%", conv: "6.4%", rev: "?0.32L", roi: "1.6x", icon: "??" }
  ];

  // 5. TOP PERFORMING CAMPAIGNS LEADERBOARD
  const topCampaigns = [
    { name: "Summer Sale", val: "16.2%", width: "w-[85%]" },
    { name: "New Arrival Launch", val: "14.8%", width: "w-[75%]" },
    { name: "Weekend Bonanza", val: "12.7%", width: "w-[65%]" },
    { name: "Festive Offer", val: "11.3%", width: "w-[58%]" },
    { name: "Clearance Sale", val: "8.6%", width: "w-[42%]" }
  ];

  // 6. PERFORMANCE INSIGHTS
  const insights = [
    { title: "Summer Sale campaign has the highest conversion rate (16.2%)", subtitle: "Keep optimizing for better ROI.", icon: "?", iconBg: "bg-emerald-500/10 text-emerald-400" },
    { title: "Digital Screens and In-Store Display channels are driving the most impressions.", subtitle: "", icon: "?", iconBg: "bg-blue-500/10 text-blue-400" },
    { title: "Loyalty Program campaign has lower engagement rate (15.2%).", subtitle: "Consider revising content or targeting.", icon: "??", iconBg: "bg-amber-500/10 text-amber-400" }
  ];

  const filteredCampaigns = campaignSummary.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* 3. TITLE & FILTER CONTROLS */}
      <div className="flex flex-wrap justify-between items-center gap-4 pt-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white">Campaign Performance</h1>
            <span className="text-slate-500 cursor-pointer">?</span>
          </div>
          <p className="text-slate-400 text-xs">Track and evaluate the performance of all marketing campaigns across stores.</p>
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

      {/* 4. TOP KPI CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-medium">Total Campaigns</span>
            <h2 className="text-xl font-black text-white font-mono">12</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 20% vs last 7 days</span>
          </div>
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center text-lg">
            ??
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-medium">Total Impressions</span>
            <h2 className="text-xl font-black text-white font-mono">2.45M</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 18.6% vs last 7 days</span>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center text-lg">
            ???
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-medium">Total Engagements</span>
            <h2 className="text-xl font-black text-white font-mono">786K</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 16.1% vs last 7 days</span>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center text-lg">
            ??
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-medium">Avg. Engagement Rate</span>
            <h2 className="text-xl font-black text-white font-mono">32.8%</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 9.7% vs last 7 days</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-lg">
            ??
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-medium">Conversion Rate</span>
            <h2 className="text-xl font-black text-white font-mono">14.6%</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 7.5% vs last 7 days</span>
          </div>
          <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center text-lg">
            ??
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-medium">Revenue Generated</span>
            <h2 className="text-xl font-black text-white font-mono">? 8.92L</h2>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">? 22.1% vs last 7 days</span>
          </div>
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center text-lg">
            ?
          </div>
        </div>
      </div>

      {/* 5. MID ROW CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* OVER TIME TRENDS */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Impressions, Engagement & Conversions Over Time</h3>
            <button className="bg-[#070C18] border border-[#1E293B] px-2.5 py-1 rounded-lg text-slate-400 text-[10px]">
              Last 7 Days ?
            </button>
          </div>
          <div className="flex items-center space-x-4 text-[9px] pt-1">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>
              <span className="text-slate-400">Impressions</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              <span className="text-slate-400">Engagements</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <span className="text-slate-400">Conversions</span>
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overTimeData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="impressions" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: "#8B5CF6", r: 3 }} name="Impressions" />
                <Line type="monotone" dataKey="engagements" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 3 }} name="Engagements" />
                <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 3 }} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PERFORMANCE BY CHANNEL */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance by Channel</h3>
            <button className="bg-[#070C18] border border-[#1E293B] px-2.5 py-1 rounded-lg text-slate-400 text-[10px]">
              Last 7 Days ?
            </button>
          </div>
          <div className="flex items-center space-x-3 text-[9px] pt-1">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span>
              <span className="text-slate-400">Impressions</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span>
              <span className="text-slate-400">Engagement Rate (%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
              <span className="text-slate-400">Conversion Rate (%)</span>
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={channelData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="channel" stroke="#64748B" fontSize={8} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} domain={[0, 50]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar yAxisId="left" dataKey="impressions" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Impressions" />
                <Bar yAxisId="right" dataKey="engagement" fill="#2563EB" radius={[4, 4, 0, 0]} name="Engagement Rate %" />
                <Bar yAxisId="right" dataKey="conversion" fill="#10B981" radius={[4, 4, 0, 0]} name="Conversion Rate %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PERFORMANCE BY STATUS */}
        <div className="lg:col-span-3 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance by Status</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={45} outerRadius={65} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <strong className="text-base text-white block font-mono">12</strong>
              <span className="text-[9px] text-slate-400 block">Total</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[10px]">
            {statusData.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                  <span className="text-slate-400">{s.name}</span>
                </span>
                <strong className="text-white">{s.value} ({s.percent})</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SUMMARY TABLE */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance Summary</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] rounded-xl px-3 py-1 text-white outline-none focus:border-purple-500 text-xs placeholder:text-slate-500"
              />
              <button className="bg-[#070C18] border border-[#1E293B] px-3 py-1 rounded-xl text-slate-300 text-xs">Columns</button>
              <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center space-x-1">
                <span>??</span>
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400 uppercase text-[9px] tracking-wider">
                  <th className="pb-2.5">Campaign Name</th>
                  <th className="pb-2.5">Channel</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5">Impressions</th>
                  <th className="pb-2.5">Engagement Rate</th>
                  <th className="pb-2.5">Conversion Rate</th>
                  <th className="pb-2.5">Revenue</th>
                  <th className="pb-2.5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {filteredCampaigns.map((row) => (
                  <tr key={row.id} className="hover:bg-[#070C18]/50 transition">
                    <td className="py-2.5 font-bold text-white">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg">{row.icon}</span>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-300">{row.channel}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${row.statusBg}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{row.imp}</td>
                    <td className="py-2.5 text-slate-400">{row.eng}</td>
                    <td className="py-2.5 text-white font-bold">{row.conv}</td>
                    <td className="py-2.5 text-white font-bold">{row.rev}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                        {row.roi}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-[#1E293B]">
            <span>Showing 1 to {filteredCampaigns.length} of 12 campaigns</span>
            <div className="flex items-center space-x-1">
              <button className="px-2.5 py-1 bg-[#070C18] border border-[#1E293B] rounded hover:bg-[#1E293B]">‹</button>
              <button className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded">1</button>
              <button className="px-2.5 py-1 bg-[#070C18] border border-[#1E293B] rounded hover:bg-[#1E293B]">2</button>
              <button className="px-2.5 py-1 bg-[#070C18] border border-[#1E293B] rounded hover:bg-[#1E293B]">›</button>
            </div>
          </div>
        </div>

        {/* TOP CAMPAIGNS & INSIGHTS */}
        <div className="lg:col-span-4 space-y-4 font-mono">
          <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Campaigns</h3>
              <button className="bg-[#070C18] border border-[#1E293B] px-2 py-0.5 rounded text-slate-400 text-[10px]">
                By Conversion Rate ?
              </button>
            </div>
            <div className="space-y-2.5 pt-1">
              {topCampaigns.map((tc, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-300 font-bold">{idx + 1}. {tc.name}</span>
                    <strong className="text-emerald-400">{tc.val}</strong>
                  </div>
                  <div className="h-1.5 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                    <div className={`h-full bg-purple-600 ${tc.width} rounded-full`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Performance Insights</h3>
            <div className="space-y-2.5">
              {insights.map((ins, idx) => (
                <div key={idx} className="p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-start space-x-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${ins.iconBg}`}>
                    {ins.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{ins.title}</h4>
                    {ins.subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{ins.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
