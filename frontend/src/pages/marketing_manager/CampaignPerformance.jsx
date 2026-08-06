import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, ComposedChart
} from "recharts";

const Header = ({ navigate }) => (
  <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center space-x-3">
      <button onClick={() => navigate("/marketing-manager")} className="bg-[#182238] hover:bg-[#202C48] text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-xl border border-[#273552] flex items-center space-x-1.5 transition">
        <span>←</span><span>Back</span>
      </button>
      <span className="text-white font-black text-sm tracking-wide">Consumer Attention Mapping System</span>
      <span className="bg-[#B45309]/30 text-[#F59E0B] border border-[#B45309]/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Marketing Manager Portal</span>
    </div>
    <button className="bg-[#3F1A24] hover:bg-[#52212E] text-[#F87171] border border-[#7F1D1D]/50 font-bold px-3 py-1.5 rounded-xl text-xs transition">Logout</button>
  </div>
);

export default function CampaignPerformance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");

  const performanceTrend = [
    { week: "W1", impressions: 42000, engagement: 28, conversion: 12.4 },
    { week: "W2", impressions: 56000, engagement: 31, conversion: 14.2 },
    { week: "W3", impressions: 48000, engagement: 27, conversion: 11.8 },
    { week: "W4", impressions: 72000, engagement: 36, conversion: 16.9 },
    { week: "W5", impressions: 68000, engagement: 34, conversion: 15.7 },
    { week: "W6", impressions: 82000, engagement: 39, conversion: 18.2 },
  ];

  const campaigns = [
    { id: 1, name: "Summer Sale 2025", status: "Active", budget: "₹2.5L", spent: "₹1.8L", imp: "820K", eng: "34.5%", conv: "16.2%", roi: "4.2x", trend: "↑" },
    { id: 2, name: "New Arrival Launch", status: "Active", budget: "₹1.8L", spent: "₹1.2L", imp: "610K", eng: "33.1%", conv: "14.8%", roi: "3.8x", trend: "↑" },
    { id: 3, name: "Weekend Bonanza", status: "Active", budget: "₹1.2L", spent: "₹0.9L", imp: "540K", eng: "28.9%", conv: "12.7%", roi: "3.2x", trend: "↑" },
    { id: 4, name: "Festive Offer", status: "Completed", budget: "₹0.8L", spent: "₹0.8L", imp: "310K", eng: "26.7%", conv: "11.3%", roi: "2.6x", trend: "→" },
    { id: 5, name: "Clearance Sale", status: "Paused", budget: "₹0.6L", spent: "₹0.4L", imp: "170K", eng: "19.3%", conv: "8.6%", roi: "2.1x", trend: "↓" },
    { id: 6, name: "Back to School", status: "Draft", budget: "₹1.0L", spent: "₹0L", imp: "—", eng: "—", conv: "—", roi: "—", trend: "—" },
  ];

  const channelData = [
    { channel: "In-Store Display", reach: 45000, ctr: 8.4 },
    { channel: "Digital Signage", reach: 32000, ctr: 6.9 },
    { channel: "Shelf Promo", reach: 28000, ctr: 12.1 },
    { channel: "Entrance Banner", reach: 61000, ctr: 5.2 },
    { channel: "Product Spotlight", reach: 18000, ctr: 14.6 },
  ];

  const statusColor = { Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Completed: "bg-blue-500/10 text-blue-400 border-blue-500/30", Paused: "bg-amber-500/10 text-amber-400 border-amber-500/30", Draft: "bg-slate-500/10 text-slate-400 border-slate-500/30" };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">🎯 Campaign Performance</h1>
          <p className="text-slate-400 text-xs">Track and analyze all marketing campaigns across the store network.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All", "Active", "Completed", "Paused"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${activeTab === t ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Campaigns", val: "12", sub: "7 Active" },
          { label: "Total Impressions", val: "2.45M", sub: "↑ 18.6%" },
          { label: "Avg. Engagement", val: "32.8%", sub: "↑ 9.7%" },
          { label: "Avg. Conversion", val: "14.6%", sub: "↑ 7.5%" },
          { label: "Total Budget", val: "₹7.9L", sub: "₹5.1L Spent" },
          { label: "Best ROI", val: "4.2x", sub: "Summer Sale" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Weekly Performance Trend</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar yAxisId="left" dataKey="impressions" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Impressions" />
                <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#F59E0B" strokeWidth={2} name="Engagement %" />
                <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} name="Conversion %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Channel Reach vs CTR</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} />
                <YAxis dataKey="channel" type="category" stroke="#64748B" fontSize={8} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="reach" fill="#2563EB" radius={[0, 4, 4, 0]} name="Reach" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase">All Campaigns</h3>
          <button className="bg-[#D97706] text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs">+ New Campaign</button>
        </div>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">#</th><th className="pb-2">Campaign</th><th className="pb-2">Status</th>
              <th className="pb-2">Budget</th><th className="pb-2">Spent</th><th className="pb-2">Impressions</th>
              <th className="pb-2">Engagement</th><th className="pb-2">Conversion</th><th className="pb-2">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {campaigns.filter(c => activeTab === "All" || c.status === activeTab).map((c) => (
              <tr key={c.id} className="hover:bg-[#0D1527]/50 transition">
                <td className="py-2 text-slate-500">{c.id}</td>
                <td className="py-2 font-bold text-white">{c.name}</td>
                <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColor[c.status]}`}>{c.status}</span></td>
                <td className="py-2 text-slate-300">{c.budget}</td>
                <td className="py-2 text-slate-300">{c.spent}</td>
                <td className="py-2 text-slate-300">{c.imp}</td>
                <td className="py-2 text-blue-400 font-bold">{c.eng}</td>
                <td className="py-2 text-emerald-400 font-bold">{c.conv}</td>
                <td className="py-2 font-black text-amber-400">{c.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
