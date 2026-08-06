import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, ScatterChart, Scatter, ZAxis
} from "recharts";
import { products, formatNumber, formatCurrency } from "../../services/centralData";

const totalProducts = products.length;
const bestProduct = products.reduce((a, b) => a.views > b.views ? a : b);
const worstProduct = products.reduce((a, b) => a.views < b.views ? a : b);
const avgConversion = (products.reduce((s, p) => s + p.convRate, 0) / totalProducts).toFixed(1);
const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);

const kpis = [
  { label: "Products Tracked", value: totalProducts, change: "Active SKU Tracking", icon: "📦" },
  { label: "Top Product (Views)", value: bestProduct.name, change: `${formatNumber(bestProduct.views)} views`, icon: "🏆" },
  { label: "Underperforming SKU", value: worstProduct.name, change: `${formatNumber(worstProduct.views)} views`, icon: "⚠️" },
  { label: "Avg Conversion Rate", value: `${avgConversion}%`, change: "Optimal", icon: "📈" },
  { label: "Total Product Revenue", value: formatCurrency(totalRevenue), change: "+15.2% lift", icon: "💰" },
];

const scatterData = products.map(p => ({
  x: p.pickups,
  y: p.convRate,
  z: p.views,
  name: p.name
}));

export default function AnalystProductAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Product Analytics</h1>
          <p className="text-slate-400 text-xs">Granular analysis of product-level interactions, browse-to-purchase funnels, views, and pickup trends.</p>
        </div>
        <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
          <span>📅</span><span>Aug 1 – Aug 7, 2026</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Product Rankings Bar + Pickups vs Conv Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Products by Attention Score</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice().sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 6)}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="attentionScore" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pickups vs Conversion Scatter</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Pickups" stroke="#64748B" fontSize={9} unit=" pickups" />
                <YAxis type="number" dataKey="y" name="Conversion Rate" stroke="#64748B" fontSize={9} unit="%" />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Scatter name="SKUs" data={scatterData} fill="#A855F7" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Performance Standings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Product Name</th><th className="pb-2">Category</th><th className="pb-2">Zone</th><th className="pb-2">Views</th><th className="pb-2">Pickups</th><th className="pb-2">Purchases</th><th className="pb-2">Conv.</th><th className="pb-2">Revenue</th><th className="pb-2">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {products.map((p, i) => (
                <tr key={i} className="hover:bg-[#111827]/50 transition">
                  <td className="py-2.5 font-bold text-white">{p.name}</td>
                  <td className="py-2.5 text-slate-300">{p.category}</td>
                  <td className="py-2.5 text-slate-300">{p.zone}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(p.views)}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(p.pickups)}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(p.purchases)}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{p.convRate}%</td>
                  <td className="py-2.5 text-white font-bold">${formatNumber(p.revenue)}</td>
                  <td className="py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.attentionScore >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"}`}>{p.attentionScore}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
