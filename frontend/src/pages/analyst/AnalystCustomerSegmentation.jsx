import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ScatterChart, Scatter
} from "recharts";
import { formatNumber, formatCurrency, getCentralScaledData, customerSegments as staticCustomerSegments, rfmDistribution as staticRfmDistribution } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";

const retentionTrend = [
  { month: "Mar", loyal: 90, potential: 76, atRisk: 52, newCust: 65 },
  { month: "Apr", loyal: 91, potential: 77, atRisk: 48, newCust: 62 },
  { month: "May", loyal: 91, potential: 78, atRisk: 46, newCust: 60 },
  { month: "Jun", loyal: 92, potential: 78, atRisk: 45, newCust: 61 },
  { month: "Jul", loyal: 92, potential: 79, atRisk: 44, newCust: 62 },
  { month: "Aug", loyal: 92, potential: 78, atRisk: 45, newCust: 62 },
];

const segRadar = [
  { metric: "Spend", "Loyal": 95, "Potential": 72, "At-Risk": 58, "New": 48 },
  { metric: "Frequency", "Loyal": 88, "Potential": 65, "At-Risk": 35, "New": 28 },
  { metric: "Recency", "Loyal": 92, "Potential": 78, "At-Risk": 22, "New": 85 },
  { metric: "Engagement", "Loyal": 86, "Potential": 72, "At-Risk": 42, "New": 68 },
  { metric: "Conversion", "Loyal": 82, "Potential": 64, "At-Risk": 38, "New": 52 },
];

const segRecommendations = [
  { segment: "Loyal Champions", action: "Launch VIP loyalty program with exclusive early-access deals and personalized promotions.", impact: "+$12.4K/month", color: "#10B981" },
  { segment: "At-Risk Customers", action: "Send re-engagement campaign with 15% discount on previously purchased categories.", impact: "+$8.2K/month", color: "#F59E0B" },
  { segment: "New Customers", action: "Create onboarding journey with welcome offers and store navigation guide.", impact: "+$6.8K/month", color: "#8B5CF6" },
  { segment: "Hibernating", action: "Win-back email campaign with deep discounts and free delivery on first return order.", impact: "+$3.4K/month", color: "#EF4444" },
];

export default function AnalystCustomerSegmentation() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);
  const activeFilter = localPeriod || globalFilter;
  const centralData = getCentralScaledData(activeFilter);
  const customerSegments = centralData?.customerSegments || staticCustomerSegments;
  const rfmDistribution = (centralData?.rfmDistribution || staticRfmDistribution).map((e, i) => ({
    ...e,
    color: e.color || ["#10B981","#3B82F6","#F59E0B","#8B5CF6","#EF4444","#F97316"][i % 6]
  }));

  const segs = customerSegments || [];
  const totalCustomers = segs.reduce((s, c) => s + (c.count || 0), 0);
  const topSeg = segs.length > 0 ? segs.reduce((a, b) => (a.revenue || 0) > (b.revenue || 0) ? a : b) : { name: "-", count: 0, revenue: 0 };

  // Build retention trend from actual segment data
  const loyal = segs.find(s => s.name === "Loyal Champions" || s.name === "Brand Loyal Customer" || s.name === "Explorer")?.retention || 92;
  const potential = segs.find(s => s.name === "Potential Loyalists" || s.name === "Impulse Buyer")?.retention || 78;
  const atRisk = segs.find(s => s.name === "At-Risk Customers" || s.name === "Comparison Shopper")?.retention || 45;
  const newCust = segs.find(s => s.name === "New Customers" || s.name === "Quick Buyer")?.retention || 62;
  const dynamicRetentionTrend = ["Mar","Apr","May","Jun","Jul","Aug"].map((month, i) => ({
    month,
    loyal: parseFloat(Math.max(0, Math.min(100, loyal - (5 - i) * 0.3)).toFixed(1)),
    potential: parseFloat(Math.max(0, Math.min(100, potential - (5 - i) * 0.5)).toFixed(1)),
    atRisk: parseFloat(Math.max(0, Math.min(100, atRisk + (5 - i) * 0.8)).toFixed(1)),
    newCust: parseFloat(Math.max(0, Math.min(100, newCust - (5 - i) * 0.2)).toFixed(1))
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h1 className="text-xl font-black text-white">Customer Segmentation</h1></div>
        <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2"><span>📅</span><span>Aug 1 – Aug 7, 2026</span></button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Customers", value: formatNumber(totalCustomers), change: "Tracked", icon: "👥" },
          { label: "Highest Revenue", value: topSeg.name, change: formatCurrency(topSeg.revenue), icon: "💰" },
          { label: "Most Loyal Cohort", value: "Champions", change: `${customerSegments[0]?.retention || 92}% retention`, icon: "🏆" },
          { label: "At-Risk Customers", value: formatNumber(customerSegments[2]?.count || 0), change: `${customerSegments[2]?.pct || 0}% of total`, icon: "⚠️" },
          { label: "New Customers", value: formatNumber(customerSegments[3]?.count || 0), change: `${customerSegments[3]?.pct || 0}% of total`, icon: "🆕" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Distribution + RFM Scatter + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Distribution</h3>
          <div className="h-44 w-full">
            <ComponentErrorBoundary>
{customerSegments.length === 0 || customerSegments.every(s => !s.pct && !s.count) ? (
  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">No data available for the selected period</div>
) : (
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={customerSegments} dataKey="pct" nameKey="name" innerRadius={35} outerRadius={58} paddingAngle={3} label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false} fontSize={9}>
                  {customerSegments.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </PieChart>
            </ResponsiveContainer>
)}
</ComponentErrorBoundary>
          </div>
          <div className="space-y-1">
            {customerSegments.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}</span>
                <span className="text-white font-bold">{formatNumber(s.count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">RFM Analysis (Recency vs Frequency)</h3>
          <div className="h-52 w-full">
            <ComponentErrorBoundary>
{rfmDistribution.length < 2 ? (
  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">No RFM data available for the selected period</div>
) : (
<ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="recency" name="Recency" stroke="#64748B" fontSize={9} unit=" days" label={{ value: 'Recency (days)', position: 'insideBottom', offset: -2, fontSize: 8, fill: '#64748B' }} />
                <YAxis type="number" dataKey="frequency" name="Frequency" stroke="#64748B" fontSize={9} unit="/mo" label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 8, fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Scatter data={rfmDistribution} fill="#8B5CF6">
                  {rfmDistribution.map((e, i) => <Cell key={i} fill={e.color || "#8B5CF6"} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
)}
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Behavioural Comparison</h3>
          <div className="h-52 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <RadarChart data={segRadar}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="metric" stroke="#94A3B8" fontSize={8} />
                <PolarRadiusAxis stroke="#1E293B" fontSize={8} />
                <Radar name="Loyal" dataKey="Loyal" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                <Radar name="Potential" dataKey="Potential" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                <Radar name="At-Risk" dataKey="At-Risk" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </RadarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* Revenue + Profiles + Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Contribution by Segment</h3>
          <div className="h-48 w-full">
            <ComponentErrorBoundary>
{customerSegments.length === 0 || customerSegments.every(s => !s.revenue) ? (
  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">No revenue data available for the selected period</div>
) : (
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerSegments}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {customerSegments.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
)}
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Retention Trends</h3>
          <div className="h-48 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={dynamicRetentionTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} formatter={(v) => `${parseFloat(v).toFixed(1)}%`} />
                <Line type="monotone" dataKey="loyal" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Loyal" />
                <Line type="monotone" dataKey="potential" stroke="#3B82F6" strokeWidth={2} name="Potential" />
                <Line type="monotone" dataKey="atRisk" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" name="At-Risk" />
                <Line type="monotone" dataKey="newCust" stroke="#8B5CF6" strokeWidth={2} name="New" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* Segment Profiles Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Segment Profiles</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead><tr className="border-b border-[#1E293B] text-slate-400"><th className="pb-2">Segment</th><th className="pb-2">Count</th><th className="pb-2">Share</th><th className="pb-2">Avg Spend</th><th className="pb-2">Frequency</th><th className="pb-2">Conv.</th><th className="pb-2">Revenue</th><th className="pb-2">Retention</th></tr></thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {customerSegments.map((s, i) => (
                <tr key={i} className="hover:bg-[#111827]/50 transition">
                  <td className="py-2.5"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="font-bold text-white">{s.name}</span></span></td>
                  <td className="py-2.5 text-slate-300">{formatNumber(s.count)}</td>
                  <td className="py-2.5 text-slate-300">{s.pct}%</td>
                  <td className="py-2.5 text-white font-bold">${s.avgSpend}</td>
                  <td className="py-2.5 text-slate-300">{s.frequency}/mo</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{s.convRate}%</td>
                  <td className="py-2.5 text-white font-bold">{formatCurrency(s.revenue)}</td>
                  <td className="py-2.5"><span className={`font-bold ${s.retention >= 70 ? "text-emerald-400" : s.retention >= 40 ? "text-amber-400" : "text-rose-400"}`}>{s.retention}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2"><span className="text-lg">🤖</span><h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Segment Recommendations</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {segRecommendations.map((r, i) => (
            <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2 hover:border-purple-500/30 transition">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} /><h4 className="text-xs font-bold text-white">{r.segment}</h4></div>
              <p className="text-[10px] text-slate-400">{r.action}</p>
              <div className="flex justify-between items-center pt-1 border-t border-[#1E293B]">
                <span className="text-[10px] text-emerald-400 font-bold font-mono">Est. Impact: {r.impact}</span>
                <button className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold rounded-lg">Apply →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
