import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend
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
    <div className="flex items-center space-x-3">
      <span className="text-slate-400 text-xs">📅 May 16 – May 22, 2025</span>
      <button className="bg-[#3F1A24] hover:bg-[#52212E] text-[#F87171] border border-[#7F1D1D]/50 font-bold px-3 py-1.5 rounded-xl text-xs transition">Logout</button>
    </div>
  </div>
);

export default function AttentionInsights() {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState("All Zones");

  const attentionTrend = [
    { time: "9AM", avg: 3.2, peak: 5.1 }, { time: "10AM", avg: 4.1, peak: 6.8 },
    { time: "11AM", avg: 5.8, peak: 8.2 }, { time: "12PM", avg: 7.2, peak: 10.1 },
    { time: "1PM", avg: 6.9, peak: 9.4 }, { time: "2PM", avg: 5.5, peak: 7.8 },
    { time: "3PM", avg: 6.2, peak: 8.9 }, { time: "4PM", avg: 7.8, peak: 11.2 },
    { time: "5PM", avg: 8.4, peak: 12.5 }, { time: "6PM", avg: 9.1, peak: 13.4 },
    { time: "7PM", avg: 7.3, peak: 10.8 }, { time: "8PM", avg: 5.1, peak: 7.2 },
  ];

  const zoneAttention = [
    { zone: "Entrance", score: 88, dwell: "12.4s", visitors: 1420 },
    { zone: "Electronics", score: 94, dwell: "28.7s", visitors: 892 },
    { zone: "Apparel", score: 76, dwell: "19.2s", visitors: 1105 },
    { zone: "Grocery", score: 65, dwell: "8.4s", visitors: 2340 },
    { zone: "Checkout", score: 82, dwell: "34.1s", visitors: 1890 },
    { zone: "Promotions", score: 91, dwell: "22.6s", visitors: 743 },
  ];

  const dwellDistribution = [
    { name: "< 5s", value: 28 }, { name: "5–15s", value: 35 },
    { name: "15–30s", value: 22 }, { name: "30–60s", value: 10 }, { name: "> 60s", value: 5 },
  ];
  const pieColors = ["#8B5CF6", "#2563EB", "#10B981", "#F59E0B", "#EC4899"];

  const attentionByProduct = [
    { product: "Product A", attention: 92, conversion: 18.4 },
    { product: "Product B", attention: 78, conversion: 14.2 },
    { product: "Product C", attention: 85, conversion: 16.9 },
    { product: "Product D", attention: 61, conversion: 9.8 },
    { product: "Product E", attention: 73, conversion: 12.5 },
  ];

  const heatmapData = [
    [80, 60, 90, 70, 40], [55, 88, 72, 45, 65],
    [40, 76, 95, 82, 58], [30, 48, 68, 91, 76],
    [20, 35, 55, 70, 88],
  ];
  const getHeatColor = (v) => {
    if (v >= 85) return "bg-red-500/80";
    if (v >= 70) return "bg-orange-500/70";
    if (v >= 55) return "bg-amber-500/60";
    if (v >= 40) return "bg-yellow-500/50";
    return "bg-blue-500/30";
  };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      {/* PAGE TITLE */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">👁️ Attention Insights</h1>
          <p className="text-slate-400 text-xs">AI-powered consumer attention analysis across all store zones and products.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All Zones", "Electronics", "Apparel", "Grocery"].map(z => (
            <button key={z} onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${selectedZone === z ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Avg. Attention Time", val: "6.42s", delta: "↑ 14.3%", color: "text-emerald-400" },
          { label: "Peak Attention Time", val: "13.4s", delta: "↑ 8.7%", color: "text-emerald-400" },
          { label: "Attention Score", val: "84.2 / 100", delta: "↑ 6.1%", color: "text-emerald-400" },
          { label: "Low-Attention Zones", val: "3 Zones", delta: "↓ 1 Zone", color: "text-amber-400" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className={`text-[10px] font-bold ${k.color}`}>{k.delta}</span>
          </div>
        ))}
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Attention Trend */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Attention Time Trend (Today)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attentionTrend}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="s" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="avg" stroke="#8B5CF6" strokeWidth={2} fill="url(#avgGrad)" name="Avg Attention" />
                <Area type="monotone" dataKey="peak" stroke="#F59E0B" strokeWidth={2} fill="url(#peakGrad)" name="Peak Attention" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dwell Distribution */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Dwell Time Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dwellDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {dwellDistribution.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Heatmap */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase">Store Attention Heatmap</h3>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm bg-blue-500/30 inline-block"></span>Low
              <span className="w-2 h-2 rounded-sm bg-amber-500/60 inline-block ml-1"></span>Med
              <span className="w-2 h-2 rounded-sm bg-red-500/80 inline-block ml-1"></span>High
            </div>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {heatmapData.flat().map((v, i) => (
              <div key={i} className={`h-10 rounded-lg ${getHeatColor(v)} flex items-center justify-center text-[9px] font-bold text-white/80`}>{v}</div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 pt-1">
            <span>Entrance</span><span>Mid-Zone</span><span>Back</span>
          </div>
        </div>

        {/* Zone Attention Table */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Zone-wise Attention Analysis</h3>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Zone</th>
                <th className="pb-2">Attention Score</th>
                <th className="pb-2">Avg Dwell</th>
                <th className="pb-2">Visitors</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {zoneAttention.map((z, i) => (
                <tr key={i}>
                  <td className="py-2 font-bold text-white">{z.zone}</td>
                  <td className="py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${z.score >= 85 ? "bg-emerald-500" : z.score >= 70 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${z.score}%` }}></div>
                      </div>
                      <span className="text-white font-mono">{z.score}</span>
                    </div>
                  </td>
                  <td className="py-2 text-slate-300 font-mono">{z.dwell}</td>
                  <td className="py-2 text-slate-300 font-mono">{z.visitors.toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${z.score >= 85 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : z.score >= 70 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                      {z.score >= 85 ? "High" : z.score >= 70 ? "Medium" : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Attention vs Conversion */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase">Product Attention vs Conversion Rate</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attentionByProduct}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="product" stroke="#64748B" fontSize={9} />
              <YAxis yAxisId="left" stroke="#64748B" fontSize={9} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              <Bar yAxisId="left" dataKey="attention" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Attention Score" />
              <Bar yAxisId="right" dataKey="conversion" fill="#10B981" radius={[4, 4, 0, 0]} name="Conversion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
