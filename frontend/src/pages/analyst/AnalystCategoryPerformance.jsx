import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { categories, formatNumber, formatCurrency } from "../../services/centralData";

const totalCategories = categories.length;
const bestCategory = categories.reduce((a, b) => a.revenue > b.revenue ? a : b);
const worstCategory = categories.reduce((a, b) => a.revenue < b.revenue ? a : b);
const avgConversion = (categories.reduce((s, c) => s + c.convRate, 0) / totalCategories).toFixed(1);
const totalRevenue = categories.reduce((s, c) => s + c.revenue, 0);

const kpis = [
  { label: "Total Categories Tracked", value: totalCategories, change: "Active Merchandising", icon: "🏷️" },
  { label: "Top Category (Sales)", value: bestCategory.name, change: formatCurrency(bestCategory.revenue), icon: "🏆" },
  { label: "Lowest Performing Category", value: worstCategory.name, change: formatCurrency(worstCategory.revenue), icon: "⚠️" },
  { label: "Avg Category Conversion", value: `${avgConversion}%`, change: "High Conversion", icon: "📈" },
  { label: "Total Category Revenue", value: formatCurrency(totalRevenue), change: "+14.2% lift", icon: "💰" },
];

const pieColors = ["#10B981", "#3B82F6", "#06B6D4", "#8B5CF6", "#F59E0B", "#EF4444", "#14B8A6", "#F97316"];
const revenuePie = categories.map((c, i) => ({
  name: c.name,
  value: c.revenue,
  color: pieColors[i % pieColors.length]
}));

export default function AnalystCategoryPerformance() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Category Performance</h1>
          <p className="text-slate-400 text-xs">Evaluate category-level business outcomes by combining engagement, conversion, and revenue metrics.</p>
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

      {/* Category Sales Bar + Revenue Share Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Revenue and Views by Category</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Share</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenuePie} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={3} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={8}>
                  {revenuePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
            {revenuePie.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-slate-300 truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Category Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Category</th><th className="pb-2">SKUs</th><th className="pb-2">Views</th><th className="pb-2">Pickups</th><th className="pb-2">Purchases</th><th className="pb-2">Conversion</th><th className="pb-2">Revenue</th><th className="pb-2">Engagement</th><th className="pb-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {categories.map((c, i) => (
                <tr key={i} className="hover:bg-[#111827]/50 transition">
                  <td className="py-2.5 font-bold text-white">{c.name}</td>
                  <td className="py-2.5 text-slate-300">{c.products}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(c.totalViews)}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(c.totalPickups)}</td>
                  <td className="py-2.5 text-slate-300">{formatNumber(c.totalPurchases)}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{c.convRate}%</td>
                  <td className="py-2.5 text-white font-bold">${formatNumber(c.revenue)}</td>
                  <td className="py-2.5 text-slate-300">{c.engagement}%</td>
                  <td className={`py-2.5 font-bold ${c.trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {c.trend > 0 ? "+" : ""}{c.trend}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
