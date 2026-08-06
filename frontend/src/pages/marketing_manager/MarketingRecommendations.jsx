import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line
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

export default function MarketingRecommendations() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  const recommendations = [
    { id: 1, priority: "High", impact: "High Impact", icon: "🔥", title: "Relocate Product C to Shelf A – Eye-Level Position", desc: "AI detected Product C has high attention in demo zones (92 score) but is placed at low-visibility shelf B4. Moving to eye-level Shelf A could boost conversions by an estimated 34%.", category: "Placement", effort: "Low", expectedROI: "+₹1.2L/month", impactColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { id: 2, priority: "High", impact: "High Impact", icon: "📢", title: "Extend Summer Sale Campaign by 2 Weeks", desc: "Current campaign shows 34.5% engagement with an upward trend. Early termination would miss peak weekend traffic. Estimated additional revenue: ₹0.8L.", category: "Campaign", effort: "Low", expectedROI: "+₹0.8L", impactColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { id: 3, priority: "Medium", impact: "Medium Impact", icon: "🎯", title: "Deploy Targeted Promotion in Electronics Zone at 5–7 PM", desc: "Heat maps show peak attention in Electronics between 5–7 PM but no active promotion. A targeted price promotion in this slot could improve conversion by 18%.", category: "Promotion", effort: "Medium", expectedROI: "+₹0.5L/week", impactColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { id: 4, priority: "Medium", impact: "Medium Impact", icon: "🪄", title: "Redesign Apparel Section Display Arrangement", desc: "Consumer attention in Apparel is 12% below target. AI suggests rearranging to a circular customer-flow layout with focal feature displays.", category: "Design", effort: "High", expectedROI: "+₹0.3L/month", impactColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { id: 5, priority: "Medium", impact: "Medium Impact", icon: "⏰", title: "Introduce Flash Sales During Low-Traffic Hours (11AM–1PM)", desc: "Traffic analysis shows a consistent dip between 11AM–1PM. Flash promotions in this window could attract additional 800 visitors/day.", category: "Campaign", effort: "Low", expectedROI: "+₹0.4L/month", impactColor: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    { id: 6, priority: "Low", impact: "Low Impact", icon: "📌", title: "Add QR Codes to Slow-Moving Product Tags", desc: "Products D and E have low conversion despite moderate attention. QR codes with promotional info can nudge purchase decisions.", category: "Engagement", effort: "Low", expectedROI: "+₹0.1L/month", impactColor: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  ];

  const filtered = filter === "All" ? recommendations : recommendations.filter(r => r.priority === filter || r.category === filter);

  const impactData = [
    { name: "Placement", expected: 34, actual: 28 },
    { name: "Campaign", expected: 22, actual: 19 },
    { name: "Promotion", expected: 18, actual: 14 },
    { name: "Design", expected: 12, actual: 9 },
    { name: "Engagement", expected: 8, actual: 6 },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">🤖 Marketing Recommendations</h1>
          <p className="text-slate-400 text-xs">AI-powered action items to improve campaign and engagement performance.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All", "High", "Medium", "Low", "Campaign", "Placement", "Promotion"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${filter === f ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Recommendations", val: recommendations.length.toString(), sub: `${recommendations.filter(r => r.priority === "High").length} High Priority` },
          { label: "Estimated Total ROI Uplift", val: "₹3.3L+", sub: "If all implemented" },
          { label: "Avg. Implementation Effort", val: "Medium", sub: "2–5 days avg." },
          { label: "Recommendations Acted On", val: "4 / 12", sub: "This month" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className="text-[10px] text-slate-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Impact Chart */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase">Expected vs Actual Improvement by Category (%)</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={impactData}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={9} />
              <YAxis stroke="#64748B" fontSize={9} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              <Bar dataKey="expected" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Expected" />
              <Bar dataKey="actual" fill="#10B981" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {filtered.map((rec) => (
          <div key={rec.id} className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl hover:border-[#273552] transition">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <span className="text-2xl mt-0.5">{rec.icon}</span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white leading-snug">{rec.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">{rec.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${rec.impactColor}`}>{rec.impact}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-500/10 text-slate-400 border-slate-500/30">{rec.category}</span>
                <button className="bg-[#D97706] text-slate-950 font-bold px-3 py-1 rounded-lg text-[10px] hover:bg-[#B45309] transition">Take Action</button>
              </div>
            </div>
            <div className="flex items-center space-x-6 mt-3 pt-3 border-t border-[#1E293B]">
              <span className="text-[10px] text-slate-400">⚡ Effort: <span className="text-white font-bold">{rec.effort}</span></span>
              <span className="text-[10px] text-slate-400">📈 Expected ROI: <span className="text-emerald-400 font-bold">{rec.expectedROI}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
