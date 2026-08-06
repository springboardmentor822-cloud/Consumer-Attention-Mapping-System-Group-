import React from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell
} from "recharts";
import { zones, formatNumber, formatCurrency } from "../../services/centralData";

const totalZones = zones.length;
const bestZone = zones.reduce((a, b) => a.attentionScore > b.attentionScore ? a : b);
const worstZone = zones.reduce((a, b) => a.attentionScore < b.attentionScore ? a : b);
const avgEngagement = (zones.reduce((s, z) => s + z.engagement, 0) / totalZones).toFixed(1);
const avgRevenue = zones.reduce((s, z) => s + z.revenue, 0) / totalZones;

const zoneKpis = [
  { label: "Total Zones Tracked", value: totalZones, change: "Active", icon: "🏢" },
  { label: "Top Performing Zone", value: bestZone.name, change: `${bestZone.attentionScore}% score`, icon: "🏆" },
  { label: "Underperforming Zone", value: worstZone.name, change: `${worstZone.attentionScore}% score`, icon: "⚠️" },
  { label: "Avg Engagement Score", value: `${avgEngagement}%`, change: "Optimal", icon: "✨" },
  { label: "Avg Revenue per Zone", value: formatCurrency(avgRevenue), change: "+12.4% vs last period", icon: "💰" },
];

export default function AnalystZonePerformance() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Zone Performance</h1>
          <p className="text-slate-400 text-xs">Evaluate the effectiveness of every store zone based on customer engagement, traffic density, and sales conversions.</p>
        </div>
        <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
          <span>📅</span><span>Aug 1 – Aug 7, 2026</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {zoneKpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Radar Comparison + Zone Conversions Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Metric Radar Comparison</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={zones.slice(0, 6)}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                <PolarRadiusAxis stroke="#1E293B" fontSize={8} />
                <Radar name="Attention" dataKey="attentionScore" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                <Radar name="Engagement" dataKey="engagement" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                <Radar name="Conversion" dataKey="conversionRate" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Conversion Rates by Zone</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones.slice(0, 7)}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="conversionRate" radius={[4, 4, 0, 0]}>
                  {zones.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Zone Name</th><th className="pb-2">Visitors</th><th className="pb-2">Avg Dwell</th><th className="pb-2">Attention</th><th className="pb-2">Conversion</th><th className="pb-2">Revenue</th><th className="pb-2">Engagement</th><th className="pb-2">Traffic Density</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {zones.map((z, i) => (
                <tr key={i} className="hover:bg-[#111827]/50 transition">
                  <td className="py-2.5 font-bold text-white"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: z.color }} />{z.name}</span></td>
                  <td className="py-2.5 text-slate-300">{formatNumber(z.visitors)}</td>
                  <td className="py-2.5 text-slate-300">{z.dwellTime} min</td>
                  <td className="py-2.5 text-slate-300">{z.attentionScore}/100</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{z.conversionRate}%</td>
                  <td className="py-2.5 text-white font-bold">${formatNumber(z.revenue)}</td>
                  <td className="py-2.5 text-slate-300">{z.engagement}%</td>
                  <td className="py-2.5 text-slate-300">{z.trafficDensity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendation Box */}
      <div className="p-4 bg-[#1E1B4B]/30 border border-purple-500/20 rounded-2xl flex items-start gap-3">
        <span className="text-xl">🤖</span>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Zone Layout Optimizer</h4>
          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
            The low attention-to-dwell ratio in the Electronics zone (Z-05) suggests customers spend time looking around but struggle with spatial conversions. Moving high-visibility promo cards to Z-05's center aisle is predicted to lift conversion rate by +3.4% and generate an additional $5,400 monthly.
          </p>
        </div>
      </div>
    </div>
  );
}
