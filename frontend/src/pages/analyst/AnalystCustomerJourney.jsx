import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Area
} from "recharts";
import {
  journeyFunnel, zoneTransitions, dropoffPoints, commonPaths,
  customerSegments, dailyTrafficTrend, formatNumber, getCentralScaledData
} from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


const completionTrend = [
  { day: "Mon", completion: 81.2, duration: 20.1, dropoff: 18.8 },
  { day: "Tue", completion: 82.4, duration: 21.3, dropoff: 17.6 },
  { day: "Wed", completion: 83.1, duration: 22.0, dropoff: 16.9 },
  { day: "Thu", completion: 84.6, duration: 22.4, dropoff: 15.4 },
  { day: "Fri", completion: 85.2, duration: 23.1, dropoff: 14.8 },
  { day: "Sat", completion: 86.8, duration: 24.6, dropoff: 13.2 },
  { day: "Sun", completion: 84.2, duration: 22.4, dropoff: 15.8 },
];

const touchpoints = [
  { name: "Entry Display", engagement: 82, conversion: 12, avgTime: "1.4 min" },
  { name: "Promo Endcap", engagement: 78, conversion: 18, avgTime: "2.8 min" },
  { name: "Product Shelf", engagement: 74, conversion: 22, avgTime: "3.2 min" },
  { name: "Demo Station", engagement: 91, conversion: 28, avgTime: "5.1 min" },
  { name: "Checkout Area", engagement: 68, conversion: 45, avgTime: "4.2 min" },
];

const visitorSegs = [
  { name: "Quick Shoppers (<10 min)", count: 4280, pct: 30.0, conv: "8.2%", color: "#06B6D4" },
  { name: "Focused Buyers (10-20 min)", count: 5130, pct: 36.0, conv: "22.4%", color: "#8B5CF6" },
  { name: "Explorers (20-40 min)", count: 3420, pct: 24.0, conv: "28.6%", color: "#10B981" },
  { name: "Deep Browsers (40+ min)", count: 1440, pct: 10.0, conv: "34.1%", color: "#F59E0B" },
];

export default function AnalystCustomerJourney() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);

  const activeFilter = localPeriod || globalFilter;
  const centralData = getCentralScaledData(activeFilter);
  const mult = centralData?.mult || 1.0;
  const centralKpis = centralData?.kpis || {};

  const funnelData = centralData?.journeyFunnel || journeyFunnel;
  const transitionsData = centralData?.zoneTransitions || zoneTransitions;
  const dropoffsData = centralData?.dropoffPoints || dropoffPoints;
  const pathsData = centralData?.commonPaths || commonPaths;

  // Let's compute KPIs dynamically
  const kpis = [
    { label: "Journey Completion", value: `${centralKpis.conversionRate ? (centralKpis.conversionRate * 4.6).toFixed(1) : "84.2"}%`, change: "↑ 3.8%", icon: "✅" },
    { label: "Avg Duration", value: `${(22.4 * (mult > 5 ? 1.05 : mult < 1 ? 0.95 : 1.0)).toFixed(1)} min`, change: "↑ 1.2 min", icon: "⏱️" },
    { label: "Drop-off Rate", value: `${(15.8 * (mult > 5 ? 0.92 : mult < 1 ? 1.08 : 1.0)).toFixed(1)}%`, change: "↓ 2.1%", icon: "📉" },
    { label: "Zone Transitions", value: `${(4.6 * (mult > 5 ? 1.02 : 1.0)).toFixed(1)} avg`, change: "↑ 0.4", icon: "🔄" },
    { label: "Touchpoints", value: `${(8.2 * (mult > 5 ? 1.03 : 1.0)).toFixed(1)} avg`, change: "↑ 1.1", icon: "📍" },
    { label: "Unique Paths", value: Math.round(142 * mult), change: "↑ 18", icon: "🗺️" },
  ];

  // Dynamic journey insights
  const journeyInsights = [];
  if (!funnelData || funnelData.length === 0) {
    // Insufficient data
  } else {
    const dropoffList = [];
    for (let i = 0; i < funnelData.length - 1; i++) {
      const dropPct = (1 - funnelData[i + 1].count / funnelData[i].count) * 100;
      dropoffList.push({ stage: funnelData[i].stage, nextStage: funnelData[i + 1].stage, dropPct, count: funnelData[i].count - funnelData[i + 1].count });
    }
    const maxDrop = dropoffList.sort((a, b) => b.dropPct - a.dropPct)[0];
    if (maxDrop) {
      journeyInsights.push({
        title: `High drop-off at ${maxDrop.stage} stage`,
        desc: `${maxDrop.dropPct.toFixed(1)}% of visitors leave after ${maxDrop.stage} without transitioning to ${maxDrop.nextStage} (${formatNumber(maxDrop.count)} shoppers lost). Recommend interactive elements to hold engagement.`,
        impact: "High",
        tagColor: "text-rose-400 bg-rose-500/10 border-rose-500/30"
      });
    }

    if (pathsData && pathsData.length > 0) {
      const topPath = [...pathsData].sort((a, b) => b.freq - a.freq)[0];
      journeyInsights.push({
        title: `Aisle pathway guides highest conversion`,
        desc: `Customers following route "${topPath.path}" convert at ${topPath.convRate}%, which is significantly higher than alternative paths. Optimize signage to guide more traffic.`,
        impact: "High",
        tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      });
    }

    journeyInsights.push({
      title: `Extended dwell times drive conversion`,
      desc: `Shoppers with journeys longer than ${(22.4 * mult).toFixed(1)} min convert at a +${Math.round(6.8 * mult)}% higher rate. Adding digital displays directly increases browsing time.`,
      impact: "Medium",
      tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/30"
    });

    if (dropoffsData && dropoffsData.length > 0) {
      const critZone = [...dropoffsData].sort((a, b) => b.pct - a.pct)[0];
      journeyInsights.push({
        title: `${critZone.zone} zone creates journey dead-ends`,
        desc: `${critZone.pct}% of visitors in ${critZone.zone} exit the store path without transitioning further. Place cross-sell displays or discount endcaps near the exit path.`,
        impact: "Medium",
        tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30"
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Customer Journey Analysis</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2"><span>🏪</span><span>All Stores</span></button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium truncate">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Funnel + Transitions + Dropoffs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shopping Journey Funnel</h3>
          <div className="space-y-3 pt-1">
            {funnelData.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-bold">{s.stage}</span>
                  <span className="text-white">{formatNumber(s.count)} <span className="text-slate-400">({s.pct}%)</span></span>
                </div>
                <div className="h-3 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B] flex justify-center">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
                {i < funnelData.length - 1 && <div className="text-[9px] text-slate-500 font-mono text-right">↓ {((1 - funnelData[i + 1].pct / s.pct) * 100).toFixed(1)}% drop</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Transition Map</h3>
          <div className="space-y-2">
            {transitionsData.map((t, i) => (
              <div key={i} className="p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-cyan-400 font-bold">{t.from}</span><span className="text-slate-500">→</span><span className="text-purple-400 font-bold">{t.to}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-slate-300">{formatNumber(t.count)}</span>
                  <span className="text-emerald-400 font-bold">{t.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Drop-off Analysis</h3>
          <div className="space-y-2">
            {dropoffsData.map((d, i) => (
              <div key={i} className={`p-2.5 rounded-xl border ${d.severity === "critical" ? "bg-rose-500/5 border-rose-500/20" : d.severity === "high" ? "bg-amber-500/5 border-amber-500/20" : "bg-[#070C18] border-[#1E293B]"}`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-white font-bold leading-tight">{d.zone}</span>
                  <span className={`text-[9px] font-bold font-mono ${d.severity === "critical" ? "text-rose-400" : d.severity === "high" ? "text-amber-400" : "text-slate-400"}`}>{d.severity.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-[#1E293B] rounded-full overflow-hidden"><div className={`h-full rounded-full ${d.severity === "critical" ? "bg-rose-500" : d.severity === "high" ? "bg-amber-500" : "bg-slate-500"}`} style={{ width: `${d.pct * 3}%` }} /></div>
                  <span className="text-[10px] text-white font-mono font-bold">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trends + Touchpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Journey Completion Trends</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={completionTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="completion" fill="#06B6D4" fillOpacity={0.1} stroke="#06B6D4" strokeWidth={2} />
                <Line type="monotone" dataKey="duration" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 3 }} />
                <Line type="monotone" dataKey="dropoff" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" /> Completion %</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" /> Duration</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> Drop-off</span>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Touchpoint Performance</h3>
          <table className="w-full text-left text-[11px] font-mono">
            <thead><tr className="border-b border-[#1E293B] text-slate-400"><th className="pb-2 pr-3">Touchpoint</th><th className="pb-2 pr-3">Engagement</th><th className="pb-2 pr-3">Conv.</th><th className="pb-2">Time</th></tr></thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {touchpoints.map((t, i) => (
                <tr key={i} className="hover:bg-[#111827]/50 transition">
                  <td className="py-2.5 pr-3 font-bold text-white">{t.name}</td>
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-[#1E293B] rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{ width: `${t.engagement}%` }} /></div><span className="text-cyan-400 font-bold">{t.engagement}%</span></div></td>
                  <td className="py-2.5 pr-3 text-emerald-400 font-bold">{t.conversion}%</td>
                  <td className="py-2.5 text-slate-300">{t.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Segments + Common Paths */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitor Segments by Journey</h3>
          <div className="space-y-2.5">
            {visitorSegs.map((s, i) => (
              <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <div className="flex items-center justify-between mb-2"><span className="text-[11px] text-white font-bold">{s.name}</span><span className="text-[10px] font-mono font-bold" style={{ color: s.color }}>{s.pct}%</span></div>
                <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden mb-2"><div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} /></div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400"><span>{formatNumber(s.count)} visitors</span><span>Conv: <span className="text-emerald-400 font-bold">{s.conv}</span></span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Most Common Navigation Paths</h3>
          <div className="space-y-2">
            {pathsData.map((p, i) => (
              <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between gap-3 hover:border-cyan-500/30 transition">
                <div className="flex items-center gap-2 min-w-0"><span className="text-[10px] text-slate-500 font-mono font-bold w-5 flex-shrink-0">#{i + 1}</span><span className="text-[11px] text-cyan-400 font-mono font-bold truncate">{p.path}</span></div>
                <div className="flex items-center gap-4 text-[10px] font-mono flex-shrink-0"><span className="text-slate-300">{formatNumber(p.freq)}</span><span className="text-emerald-400 font-bold">{p.convRate}%</span><span className="text-slate-400">{p.avgTime} min</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2"><span className="text-lg">🤖</span><h3 className="text-xs font-bold text-white uppercase tracking-wider">Journey-Based AI Insights</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {journeyInsights.length === 0 ? (
            <div className="col-span-2 text-center text-slate-500 py-6">Insufficient data for AI insight</div>
          ) : (
            journeyInsights.map((ins, i) => (
              <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2 hover:border-purple-500/30 transition">
                <div className="flex items-start justify-between gap-2"><h4 className="text-xs font-bold text-white leading-snug">{ins.title}</h4><span className={`px-2 py-0.5 rounded border text-[9px] font-bold whitespace-nowrap ${ins.tagColor}`}>{ins.impact}</span></div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{ins.desc}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
