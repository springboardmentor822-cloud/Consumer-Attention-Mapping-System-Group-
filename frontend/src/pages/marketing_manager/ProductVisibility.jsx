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

export default function ProductVisibility() {
  const navigate = useNavigate();
  const [activeShelf, setActiveShelf] = useState("All Shelves");

  const shelfData = [
    { shelf: "Shelf A", score: 92, products: 8, hotspots: 5, visibility: "High" },
    { shelf: "Shelf B", score: 78, products: 10, hotspots: 3, visibility: "Medium" },
    { shelf: "Shelf C", score: 64, products: 12, hotspots: 2, visibility: "Medium" },
    { shelf: "Shelf D", score: 47, products: 9, hotspots: 1, visibility: "Low" },
    { shelf: "Shelf E", score: 38, products: 7, hotspots: 0, visibility: "Low" },
  ];

  const visibilityTrend = [
    { day: "Mon", A: 88, B: 74, C: 60, D: 44, E: 35 },
    { day: "Tue", A: 90, B: 76, C: 62, D: 46, E: 37 },
    { day: "Wed", A: 89, B: 75, C: 63, D: 45, E: 36 },
    { day: "Thu", A: 92, B: 78, C: 65, D: 48, E: 38 },
    { day: "Fri", A: 94, B: 80, C: 67, D: 50, E: 40 },
    { day: "Sat", A: 93, B: 79, C: 66, D: 49, E: 39 },
    { day: "Sun", A: 92, B: 78, C: 64, D: 47, E: 38 },
  ];

  const productVisibilityData = [
    { product: "Product A", shelf: "Shelf A", score: 96, views: "4,200", hotspot: true, improvement: "+2.4%" },
    { product: "Product B", shelf: "Shelf A", score: 89, views: "3,850", hotspot: true, improvement: "+1.8%" },
    { product: "Product C", shelf: "Shelf B", score: 78, views: "2,960", hotspot: false, improvement: "+1.2%" },
    { product: "Product D", shelf: "Shelf C", score: 64, views: "2,100", hotspot: false, improvement: "-0.4%" },
    { product: "Product E", shelf: "Shelf D", score: 48, views: "1,480", hotspot: false, improvement: "-1.8%" },
    { product: "Product F", shelf: "Shelf E", score: 34, views: "890", hotspot: false, improvement: "-2.1%" },
  ];

  const visibilityByTimeData = [
    { time: "9AM", score: 62 }, { time: "10AM", score: 71 }, { time: "11AM", score: 78 },
    { time: "12PM", score: 85 }, { time: "1PM", score: 88 }, { time: "2PM", score: 84 },
    { time: "3PM", score: 82 }, { time: "4PM", score: 89 }, { time: "5PM", score: 92 },
    { time: "6PM", score: 90 }, { time: "7PM", score: 86 }, { time: "8PM", score: 74 },
  ];

  const visibColor = { High: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30", Low: "bg-rose-500/10 text-rose-400 border-rose-500/30" };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">👁️ Product Visibility</h1>
          <p className="text-slate-400 text-xs">Monitor and optimize product visibility scores across all shelves and zones.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All Shelves", "Shelf A", "Shelf B", "Shelf C", "Shelf D"].map(s => (
            <button key={s} onClick={() => setActiveShelf(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${activeShelf === s ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Shelf Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {shelfData.map((s, i) => (
          <div key={i} className={`bg-[#0F172A] border p-4 rounded-2xl space-y-2 ${s.score >= 80 ? "border-emerald-500/20" : s.score >= 60 ? "border-amber-500/20" : "border-rose-500/20"}`}>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-white">{s.shelf}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${visibColor[s.visibility]}`}>{s.visibility}</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{s.score}<span className="text-sm text-slate-400">/100</span></div>
            <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.score >= 80 ? "bg-emerald-500" : s.score >= 60 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${s.score}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>{s.products} Products</span>
              <span>{s.hotspots} Hotspots</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visibility Trend */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Shelf Visibility Score Trend (This Week)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibilityTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} domain={[20, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="A" stroke="#8B5CF6" strokeWidth={2} name="Shelf A" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="B" stroke="#2563EB" strokeWidth={2} name="Shelf B" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="C" stroke="#10B981" strokeWidth={2} name="Shelf C" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="D" stroke="#F59E0B" strokeWidth={2} name="Shelf D" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="E" stroke="#EF4444" strokeWidth={2} name="Shelf E" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visibility by Time */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Avg. Visibility by Time of Day</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibilityByTimeData}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} domain={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={2} fill="url(#visGrad)" name="Avg Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase">Product Visibility Details</h3>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">Product</th><th className="pb-2">Location</th><th className="pb-2">Visibility Score</th>
              <th className="pb-2">Weekly Views</th><th className="pb-2">Hotspot</th><th className="pb-2">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {productVisibilityData.map((p, i) => (
              <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                <td className="py-2 font-bold text-white">{p.product}</td>
                <td className="py-2 text-slate-400">{p.shelf}</td>
                <td className="py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.score >= 80 ? "bg-emerald-500" : p.score >= 60 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${p.score}%` }}></div>
                    </div>
                    <span className="text-white font-bold font-mono">{p.score}</span>
                  </div>
                </td>
                <td className="py-2 text-slate-300 font-mono">{p.views}</td>
                <td className="py-2">{p.hotspot ? <span className="text-amber-400">🔥 Yes</span> : <span className="text-slate-500">—</span>}</td>
                <td className={`py-2 font-bold ${p.improvement.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{p.improvement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
