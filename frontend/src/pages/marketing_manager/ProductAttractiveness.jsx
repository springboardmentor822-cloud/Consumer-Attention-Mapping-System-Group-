import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, LineChart, Line, AreaChart, Area
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

export default function ProductAttractiveness() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("All Products");

  const radarData = [
    { subject: "Visual Appeal", A: 90, B: 70, C: 60, D: 40 },
    { subject: "Shelf Placement", A: 85, B: 80, C: 65, D: 50 },
    { subject: "Engagement Rate", A: 75, B: 85, C: 70, D: 60 },
    { subject: "Pick-up Rate", A: 80, B: 65, C: 75, D: 55 },
    { subject: "Purchase Impact", A: 95, B: 75, C: 80, D: 45 },
    { subject: "Brand Recall", A: 78, B: 82, C: 68, D: 52 },
  ];

  const products = [
    { name: "Product A", appeal: 90, placement: 85, engagement: 75, pickup: 80, purchase: 95, score: 87, trend: "+4.2%", color: "text-emerald-400" },
    { name: "Product B", appeal: 70, placement: 80, engagement: 85, pickup: 65, purchase: 75, score: 75, trend: "+2.1%", color: "text-blue-400" },
    { name: "Product C", appeal: 60, placement: 65, engagement: 70, pickup: 75, purchase: 80, score: 70, trend: "+1.8%", color: "text-amber-400" },
    { name: "Product D", appeal: 40, placement: 50, engagement: 60, pickup: 55, purchase: 45, score: 50, trend: "-1.2%", color: "text-rose-400" },
  ];

  const dwellTrend = [
    { time: "9AM", A: 3.2, B: 2.8, C: 2.1, D: 1.5 },
    { time: "11AM", A: 5.4, B: 4.2, C: 3.2, D: 2.1 },
    { time: "1PM", A: 7.8, B: 6.1, C: 4.8, D: 2.9 },
    { time: "3PM", A: 8.9, B: 7.2, C: 5.8, D: 3.4 },
    { time: "5PM", A: 11.2, B: 9.4, C: 7.1, D: 4.2 },
    { time: "7PM", A: 9.8, B: 8.1, C: 6.4, D: 3.8 },
  ];

  const attractivenessFactors = [
    { factor: "Packaging Design", impact: 34, trend: "↑" },
    { factor: "Shelf Eye-Level Position", impact: 28, trend: "↑" },
    { factor: "Promotional Tag Visibility", impact: 22, trend: "↑" },
    { factor: "Product Demo Availability", impact: 16, trend: "→" },
    { factor: "Adjacent Product Influence", impact: 12, trend: "↓" },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">✨ Product Attractiveness</h1>
          <p className="text-slate-400 text-xs">AI-scored analysis of product visual appeal, placement and consumer engagement.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All Products", "Product A", "Product B", "Product C", "Product D"].map(p => (
            <button key={p} onClick={() => setSelected(p)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${selected === p ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Product Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((p, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-white">{p.name}</span>
              <span className={`text-[10px] font-bold ${p.color}`}>{p.trend}</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{p.score}<span className="text-sm text-slate-400">/100</span></div>
            <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${p.score >= 80 ? "bg-emerald-500" : p.score >= 65 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${p.score}%` }}></div>
            </div>
            <span className="text-[9px] text-slate-400">Attractiveness Score</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Radar Chart */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Attractiveness Dimension Comparison</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={8} />
                <PolarRadiusAxis stroke="#64748B" fontSize={7} />
                <Radar name="Product A" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                <Radar name="Product B" dataKey="B" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} />
                <Radar name="Product C" dataKey="C" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.25} />
                <Radar name="Product D" dataKey="D" stroke="#EF4444" fill="#EF4444" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Product A", "Product B", "Product C", "Product D"].map((p, i) => (
              <div key={i} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${["bg-purple-500", "bg-blue-500", "bg-amber-500", "bg-rose-500"][i]}`}></div>
                <span className="text-[10px] text-slate-400">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dwell Time Trend */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Avg. Dwell Time by Product (Today)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dwellTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="s" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="A" stroke="#8B5CF6" strokeWidth={2} name="Product A" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="B" stroke="#2563EB" strokeWidth={2} name="Product B" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="C" stroke="#F59E0B" strokeWidth={2} name="Product C" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="D" stroke="#EF4444" strokeWidth={2} name="Product D" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attractiveness Factors */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase">Top Attractiveness Factors (Impact %)</h3>
        <div className="space-y-3">
          {attractivenessFactors.map((f, i) => (
            <div key={i} className="flex items-center space-x-3">
              <span className="text-slate-400 w-44 truncate">{f.factor}</span>
              <div className="flex-1 h-2.5 bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${f.impact * 2.5}%` }}></div>
              </div>
              <span className="text-white font-bold w-8 text-right">{f.impact}%</span>
              <span className={`w-4 text-center font-bold ${f.trend === "↑" ? "text-emerald-400" : f.trend === "↓" ? "text-rose-400" : "text-slate-400"}`}>{f.trend}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase">Product Attractiveness Breakdown</h3>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">Product</th><th className="pb-2">Visual Appeal</th><th className="pb-2">Placement</th>
              <th className="pb-2">Engagement</th><th className="pb-2">Pick-up Rate</th><th className="pb-2">Overall Score</th><th className="pb-2">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {products.map((p, i) => (
              <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                <td className="py-2 font-bold text-white">{p.name}</td>
                <td className="py-2 text-slate-300">{p.appeal}/100</td>
                <td className="py-2 text-slate-300">{p.placement}/100</td>
                <td className="py-2 text-slate-300">{p.engagement}/100</td>
                <td className="py-2 text-slate-300">{p.pickup}/100</td>
                <td className="py-2"><span className={`font-black text-lg ${p.color}`}>{p.score}</span><span className="text-slate-500">/100</span></td>
                <td className={`py-2 font-bold ${p.color}`}>{p.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
