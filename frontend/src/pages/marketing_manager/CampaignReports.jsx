import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, AreaChart, Area
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

export default function CampaignReports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("Monthly");

  const monthlyData = [
    { month: "Jan", revenue: 52000, spend: 18000, roi: 2.9 },
    { month: "Feb", revenue: 61000, spend: 19500, roi: 3.1 },
    { month: "Mar", revenue: 75000, spend: 22000, roi: 3.4 },
    { month: "Apr", revenue: 68000, spend: 20000, roi: 3.4 },
    { month: "May", revenue: 89000, spend: 24000, roi: 3.7 },
    { month: "Jun", revenue: 102000, spend: 27000, roi: 3.8 },
  ];

  const campaignSummaries = [
    { name: "Summer Sale 2025", period: "May 1–22", impressions: "820K", revenue: "₹3.25L", roi: "4.2x", status: "✅ Completed" },
    { name: "New Arrival Launch", period: "Apr 10–30", impressions: "610K", revenue: "₹2.18L", roi: "3.8x", status: "✅ Completed" },
    { name: "Weekend Bonanza", period: "Apr 5–7", impressions: "540K", revenue: "₹1.72L", roi: "3.2x", status: "✅ Completed" },
    { name: "Festive Offer", period: "Mar 20–31", impressions: "310K", revenue: "₹1.12L", roi: "2.6x", status: "✅ Completed" },
    { name: "Clearance Sale", period: "Mar 5–15", impressions: "170K", revenue: "₹0.65L", roi: "2.1x", status: "⏸️ Paused" },
  ];

  const topInsights = [
    { icon: "📈", title: "ROI peaked in June at 3.8x", desc: "The Festive campaign had the highest ROI improvement month-over-month.", color: "text-emerald-400" },
    { icon: "👁️", title: "Attention time up 18% in Q2", desc: "Consumers spent more time on featured product displays.", color: "text-blue-400" },
    { icon: "⚠️", title: "Clearance Sale underperformed", desc: "Low conversion despite moderate impressions. Review placement strategy.", color: "text-amber-400" },
    { icon: "🎯", title: "Summer Sale: Best performing", desc: "Highest impressions, engagement and revenue across all campaigns.", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">📋 Campaign Reports</h1>
          <p className="text-slate-400 text-xs">Detailed performance reports for all past and ongoing campaigns.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["Weekly", "Monthly", "Quarterly"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${period === p ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{p}</button>
          ))}
          <button className="bg-[#182238] border border-[#273552] text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold">⬇ Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue Generated", val: "₹8.92L", sub: "↑ 22.1% YoY" },
          { label: "Total Ad Spend", val: "₹2.31L", sub: "Under budget" },
          { label: "Overall ROI", val: "3.86x", sub: "↑ 0.4x vs last period" },
          { label: "Reports Generated", val: "48", sub: "This quarter" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Revenue & ROI Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Revenue vs Ad Spend ({period})</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} formatter={(v, n) => [n === "roi" ? `${v}x` : `₹${(v/1000).toFixed(0)}K`, n]} />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="spend" fill="#1E293B" radius={[4, 4, 0, 0]} name="Ad Spend" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">ROI Trend</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="x" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="roi" stroke="#F59E0B" strokeWidth={2} fill="url(#roiGrad)" name="ROI" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {topInsights.map((ins, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{ins.icon}</span>
              <span className={`text-xs font-bold ${ins.color}`}>{ins.title}</span>
            </div>
            <p className="text-[11px] text-slate-400">{ins.desc}</p>
          </div>
        ))}
      </div>

      {/* Campaign Summary Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase">Campaign Summary Report</h3>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">Campaign Name</th><th className="pb-2">Period</th>
              <th className="pb-2">Impressions</th><th className="pb-2">Revenue</th>
              <th className="pb-2">ROI</th><th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {campaignSummaries.map((c, i) => (
              <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                <td className="py-2 font-bold text-white">{c.name}</td>
                <td className="py-2 text-slate-400">{c.period}</td>
                <td className="py-2 text-slate-300 font-mono">{c.impressions}</td>
                <td className="py-2 font-bold text-white">{c.revenue}</td>
                <td className="py-2 text-amber-400 font-black">{c.roi}</td>
                <td className="py-2 text-slate-300">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
