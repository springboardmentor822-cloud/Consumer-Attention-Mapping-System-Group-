import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, FunnelChart, Funnel, LabelList, LineChart, Line
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

export default function ConversionAnalysis() {
  const navigate = useNavigate();
  const [view, setView] = useState("All Products");

  const conversionTrend = [
    { day: "Mon", rate: 11.2, target: 13 }, { day: "Tue", rate: 13.5, target: 13 },
    { day: "Wed", rate: 12.8, target: 13 }, { day: "Thu", rate: 15.2, target: 13 },
    { day: "Fri", rate: 16.9, target: 13 }, { day: "Sat", rate: 18.4, target: 13 },
    { day: "Sun", rate: 14.6, target: 13 },
  ];

  const productConversion = [
    { product: "Product A", views: 4200, pickups: 1890, purchases: 680, rate: 16.2 },
    { product: "Product B", views: 3800, pickups: 1420, purchases: 541, rate: 14.2 },
    { product: "Product C", views: 3100, pickups: 1210, purchases: 523, rate: 16.9 },
    { product: "Product D", views: 2600, pickups: 780, purchases: 255, rate: 9.8 },
    { product: "Product E", views: 2200, pickups: 920, purchases: 275, rate: 12.5 },
  ];

  const funnelSteps = [
    { stage: "Store Visitors", count: 12400, pct: "100%", color: "bg-purple-600" },
    { stage: "Passed Attention Zone", count: 8920, pct: "72%", color: "bg-blue-500" },
    { stage: "Engaged with Product", count: 5640, pct: "45.5%", color: "bg-teal-500" },
    { stage: "Picked Up Product", count: 3220, pct: "26%", color: "bg-amber-500" },
    { stage: "Purchased", count: 1810, pct: "14.6%", color: "bg-emerald-500" },
  ];

  const dropoffReasons = [
    { reason: "Price concern", pct: 38 },
    { reason: "No promotion available", pct: 24 },
    { reason: "Product unavailable", pct: 18 },
    { reason: "Poor shelf placement", pct: 12 },
    { reason: "Other", pct: 8 },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">📈 Conversion Analysis</h1>
          <p className="text-slate-400 text-xs">Deep-dive into consumer journey from attention to purchase conversion.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All Products", "Electronics", "Apparel", "Grocery"].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${view === v ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall Conversion Rate", val: "14.6%", sub: "↑ 7.5% vs last week", col: "text-emerald-400" },
          { label: "Total Conversions", val: "1,810", sub: "This week", col: "text-emerald-400" },
          { label: "Attention-to-Purchase", val: "32.1%", sub: "Of engaged visitors", col: "text-blue-400" },
          { label: "Avg. Drop-off Rate", val: "67.9%", sub: "↓ 3.2% improved", col: "text-amber-400" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className={`text-[10px] font-bold ${k.col}`}>{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Conversion Funnel */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Conversion Funnel</h3>
          <div className="space-y-2 pt-1">
            {funnelSteps.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300 font-bold">{f.stage}</span>
                  <span className="text-white font-mono">{f.count.toLocaleString()} <span className="text-slate-400">({f.pct})</span></span>
                </div>
                <div className="h-2.5 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className={`h-full ${f.color} rounded-full transition-all`} style={{ width: f.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Trend */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Daily Conversion Rate vs Target</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conversionTrend}>
                <defs>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} fill="url(#convGrad)" name="Conversion Rate" />
                <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" name="Target" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Conversion Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase">Product-wise Conversion Analysis</h3>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">Product</th><th className="pb-2">Total Views</th>
              <th className="pb-2">Pick-ups</th><th className="pb-2">Purchases</th>
              <th className="pb-2">Conv. Rate</th><th className="pb-2">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {productConversion.map((p, i) => (
              <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                <td className="py-2 font-bold text-white">{p.product}</td>
                <td className="py-2 text-slate-300 font-mono">{p.views.toLocaleString()}</td>
                <td className="py-2 text-slate-300 font-mono">{p.pickups.toLocaleString()}</td>
                <td className="py-2 text-emerald-400 font-bold">{p.purchases.toLocaleString()}</td>
                <td className="py-2 font-black text-white">{p.rate}%</td>
                <td className="py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.rate >= 15 ? "bg-emerald-500" : p.rate >= 12 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.min(p.rate / 20 * 100, 100)}%` }}></div>
                    </div>
                    <span className={`text-[9px] font-bold ${p.rate >= 15 ? "text-emerald-400" : p.rate >= 12 ? "text-amber-400" : "text-rose-400"}`}>
                      {p.rate >= 15 ? "Excellent" : p.rate >= 12 ? "Good" : "Needs Attention"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drop-off Reasons */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase">Top Drop-off Reasons</h3>
        <div className="space-y-2">
          {dropoffReasons.map((d, i) => (
            <div key={i} className="flex items-center space-x-3">
              <span className="text-slate-400 w-36 truncate">{d.reason}</span>
              <div className="flex-1 h-2 bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full bg-rose-500/70 rounded-full" style={{ width: `${d.pct}%` }}></div>
              </div>
              <span className="text-white font-bold w-8 text-right">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
