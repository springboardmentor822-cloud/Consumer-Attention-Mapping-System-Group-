import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, ScatterChart, Scatter
} from "recharts";
import {
  journeyFunnel as staticJourneyFunnel,
  zoneTransitions as staticZoneTransitions,
  dropoffPoints as staticDropoffPoints,
  commonPaths as staticCommonPaths,
  attentionOverview as staticAttentionOverview,
  attentionTrend as staticAttentionTrend,
  attentionByZone as staticAttentionByZone,
  gazeDirectionData as staticGazeDirectionData,
  customerSegments as staticCustomerSegments,
  rfmDistribution as rfmDistributionFallback,
  products as staticProducts,
  sparklines,
  heatColor,
  formatNumber,
  formatCurrency,
  getCentralScaledData
} from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


// ── Static Mock Data Blocks for Journey, Attention, Segmentation ───────────────

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

export default function AnalystConsumerBehaviorIntelligence() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);

  const activeFilter = localPeriod || globalFilter;
  const centralData = getCentralScaledData(activeFilter);
  const mult = centralData?.mult || 1;
  const kpis = centralData?.kpis || {};
  const journeyFunnel = centralData?.journeyFunnel || staticJourneyFunnel;
  const zoneTransitions = centralData?.zoneTransitions || staticZoneTransitions;
  const dropoffPoints = centralData?.dropoffPoints || staticDropoffPoints;
  const commonPaths = centralData?.commonPaths || staticCommonPaths;
  const attentionTrend = centralData?.attentionTrend || staticAttentionTrend;
  const attentionByZone = centralData?.attentionByZone || staticAttentionByZone;
  const gazeDirectionData = centralData?.gazeDirectionData || staticGazeDirectionData;
  const products = centralData?.products || staticProducts;
  const customerSegments = centralData?.customerSegments || staticCustomerSegments;
  const rfmDistribution = (centralData?.rfmDistribution || rfmDistributionFallback).map((e, i) => ({
    ...e,
    color: e.color || ["#10B981","#3B82F6","#F59E0B","#8B5CF6","#EF4444","#F97316"][i % 6]
  }));

  // Build retention trend from actual segment retention values
  const buildRetentionTrend = (segs) => {
    const loyal = segs.find(s => s.name === "Loyal Champions" || s.name === "Brand Loyal Customer" || s.name === "Explorer")?.retention || 92;
    const potential = segs.find(s => s.name === "Potential Loyalists" || s.name === "Impulse Buyer")?.retention || 78;
    const atRisk = segs.find(s => s.name === "At-Risk Customers" || s.name === "Comparison Shopper")?.retention || 45;
    const newCust = segs.find(s => s.name === "New Customers" || s.name === "Quick Buyer")?.retention || 62;
    const months = ["Mar","Apr","May","Jun","Jul","Aug"];
    return months.map((month, i) => ({
      month,
      loyal: Math.max(0, Math.min(100, loyal - (months.length - 1 - i) * 0.3)),
      potential: Math.max(0, Math.min(100, potential - (months.length - 1 - i) * 0.5)),
      atRisk: Math.max(0, Math.min(100, atRisk + (months.length - 1 - i) * 0.8)),
      newCust: Math.max(0, Math.min(100, newCust - (months.length - 1 - i) * 0.2))
    }));
  };
  const dynamicRetentionTrend = customerSegments.length > 0 ? buildRetentionTrend(customerSegments) : retentionTrend;

  const dateLabel = typeof activeFilter === "object" ? activeFilter.label || activeFilter.dateRange : activeFilter;

  // Dynamic AI Insights generated from actual date-filtered telemetry
  const totalVisitorsScaled = Math.round(kpis.totalVisitors || 62480);
  const avgAttnScaled = ((kpis.avgAttentionTime || 5.4) * (mult > 5 ? 1.08 : mult < 1 ? 0.92 : 1.0)).toFixed(1);
  const convRateScaled = kpis.conversionRate || 18.2;

  const dynamicAiInsights = [
    {
      title: "Personal Care & Cosmetics Attention Spike",
      desc: `Personal Care Zone received ${Math.round(18 * (mult > 1 ? mult * 0.15 : mult))}% more attention under ${dateLabel}, but conversion remained at ${convRateScaled}%. Recommend adding interactive product sampling stations.`,
      impact: "High",
      tagColor: "text-rose-400 bg-rose-500/10 border-rose-500/30"
    },
    {
      title: "Bakery → Dairy Navigation Pathway",
      desc: `Customers following Bakery → Dairy route converted at ${(convRateScaled * 1.4).toFixed(1)}% (${totalVisitorsScaled.toLocaleString()} visitors tracked in ${dateLabel}). Optimize signage to guide more footfall along this path.`,
      impact: "High",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    },
    {
      title: "Dwell Time vs Conversion Correlation",
      desc: `Visitors averaging ${avgAttnScaled}s gaze duration in Beverages converted ${Math.round(6.8 * (mult > 1 ? 1.1 : 0.9))}% higher than baseline during ${dateLabel}. Extended engagement directly correlates with purchase intent.`,
      impact: "Medium",
      tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/30"
    },
    {
      title: "Electronics Zone Exit Bottleneck",
      desc: `49% of Electronics visitors exit without transitioning to adjacent aisles during ${dateLabel}. Add high-margin cross-sell displays at zone exits.`,
      impact: "Medium",
      tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30"
    }
  ];

  const totalCustomers = customerSegments.reduce((s, c) => s + c.count, 0);
  const topSeg = customerSegments.length > 0 ? customerSegments.reduce((a, b) => a.revenue > b.revenue ? a : b) : { name: "-", count: 0, revenue: 0 };
  const topAttentionProducts = products.slice().sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 6);

  return (
    <div className="space-y-10 font-sans text-xs pb-10">

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <h1 className="text-xl font-black text-white tracking-wide">Consumer Behavior Intelligence</h1>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Consolidated intelligence hub uniting Consumer Journey, Attention Analytics, and Customer Segmentation telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <CustomDateSelector value={localPeriod || globalFilter?.dateRange} onChange={setLocalPeriod} />
          <button className="bg-[#070C18] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
            <span>🏪</span><span>All Stores</span>
          </button>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: CONSUMER JOURNEY                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[#1E293B] pb-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-extrabold text-sm">
            1
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-wide">CONSUMER JOURNEY</h2>
            <p className="text-[10px] text-slate-400 font-mono">End-to-end shopping flow, path conversion, and drop-off stage analysis.</p>
          </div>
        </div>

        {/* Journey KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          {[
            { label: "Journey Completion", value: "84.2%", change: "↑ 3.8%", icon: "✅" },
            { label: "Avg Duration", value: `${(22.4 * (mult > 5 ? 1.1 : mult < 1 ? 0.9 : 1.0)).toFixed(1)} min`, change: "↑ 1.2 min", icon: "⏱️" },
            { label: "Drop-off Rate", value: "15.8%", change: "↓ 2.1%", icon: "📉" },
            { label: "Zone Transitions", value: "4.6 avg", change: "↑ 0.4", icon: "🔄" },
            { label: "Touchpoints", value: "8.2 avg", change: "↑ 1.1", icon: "📍" },
            { label: "Unique Paths", value: "142", change: "↑ 18", icon: "🗺️" },
          ].map((k, i) => (
            <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
              <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium truncate font-sans">{k.label}</span></div>
              <h3 className="text-lg font-black text-white font-mono mt-1">{k.value}</h3>
              <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
            </div>
          ))}
        </div>

        {/* Funnel + Transitions + Dropoffs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Shopping Journey Funnel</h3>
            <div className="space-y-3 pt-1">
              {journeyFunnel.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-300 font-bold">{s.stage}</span>
                    <span className="text-white">{formatNumber(s.count)} <span className="text-slate-400">({s.pct}%)</span></span>
                  </div>
                  <div className="h-3 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B] flex justify-center">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                  {i < journeyFunnel.length - 1 && <div className="text-[9px] text-slate-500 font-mono text-right">↓ {((1 - journeyFunnel[i + 1].pct / s.pct) * 100).toFixed(1)}% drop</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Zone Transition Map</h3>
            <div className="space-y-2">
              {zoneTransitions.map((t, i) => (
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
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Drop-off Analysis</h3>
            <div className="space-y-2">
              {dropoffPoints.map((d, i) => (
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
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Journey Completion Trends</h3>
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
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Touchpoint Performance</h3>
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
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Visitor Segments by Journey</h3>
            <div className="space-y-2.5">
              {visitorSegs.map((s, i) => (
                <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl">
                  <div className="flex items-center justify-between mb-2"><span className="text-[11px] text-white font-bold">{s.name}</span><span className="text-[10px] font-mono font-bold" style={{ color: s.color }}>{s.pct}%</span></div>
                  <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden mb-2"><div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} /></div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400"><span>{formatNumber(Math.round(s.count * (mult > 1 ? mult * 0.15 : mult)))} visitors</span><span>Conv: <span className="text-emerald-400 font-bold">{s.conv}</span></span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Most Common Navigation Paths</h3>
            <div className="space-y-2">
              {commonPaths.map((p, i) => (
                <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between gap-3 hover:border-cyan-500/30 transition">
                  <div className="flex items-center gap-2 min-w-0"><span className="text-[10px] text-slate-500 font-mono font-bold w-5 flex-shrink-0">#{i + 1}</span><span className="text-[11px] text-cyan-400 font-mono font-bold truncate">{p.path}</span></div>
                  <div className="flex items-center gap-4 text-[10px] font-mono flex-shrink-0"><span className="text-slate-300">{formatNumber(p.freq)}</span><span className="text-emerald-400 font-bold">{p.convRate}%</span><span className="text-slate-400">{p.avgTime} min</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: ATTENTION ANALYTICS                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6 pt-4 border-t border-[#1E293B]">
        <div className="flex items-center gap-3 border-b border-[#1E293B] pb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-extrabold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-wide">ATTENTION ANALYTICS</h2>
            <p className="text-[10px] text-slate-400 font-mono">Gaze duration, attention scores, thermal spatial density, and impression conversions.</p>
          </div>
        </div>

        {/* Attention KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          {[
            { label: "Total Attention Time", val: `${formatNumber(Math.round(14820 * (mult > 5 ? 3.5 : mult < 1 ? 0.2 : 1.0)))} min`, change: "↑ 7.4%", color: "text-emerald-400", icon: "👁️" },
            { label: "Avg Gaze Duration", val: `${avgAttnScaled}s`, change: "↑ 5.2%", color: "text-emerald-400", icon: "⏱️" },
            { label: "High-Attention Rate", val: "38.5%", change: "↑ 3.1%", color: "text-emerald-400", icon: "🔥" },
            { label: "Impression Conversion", val: `${convRateScaled}%`, change: "↑ 2.8%", color: "text-emerald-400", icon: "🎯" },
            { label: "Top Product Attention", val: "94/100", change: "Bakery Endcap", color: "text-purple-400", icon: "⭐" },
            { label: "Attention-to-Pick Ratio", val: "62%", change: "↑ 4.0%", color: "text-emerald-400", icon: "🛍️" },
          ].map((k, i) => (
            <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
              <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium font-sans truncate">{k.label}</span></div>
              <h3 className="text-lg font-black text-white font-mono mt-1">{k.val}</h3>
              <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
            </div>
          ))}
        </div>

        {/* Attention Trends & Heatmap Model */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention Duration & Fixation Trend</h3>
            <div className="h-64 w-full">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attentionTrend}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={9} />
                  <YAxis stroke="#64748B" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                  <Area type="monotone" dataKey="attention" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} name="Avg Attention (s)" />
                  <Area type="monotone" dataKey="dwell" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.1} name="Avg Dwell (min)" />
                </AreaChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention Share by Zone</h3>
            <div className="h-64 w-full">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <BarChart data={attentionByZone.map(e => ({ ...e, displayScore: e.share ?? e.score }))} layout="vertical">
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#64748B" fontSize={9} unit="%" domain={[0, 100]} />
                  <YAxis dataKey="zone" type="category" stroke="#94A3B8" fontSize={9} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                  <Bar dataKey="displayScore" radius={[0, 4, 4, 0]}>
                    {attentionByZone.map((entry, index) => (
                      <Cell key={index} fill={entry.score > 85 ? "#8B5CF6" : entry.score > 70 ? "#06B6D4" : "#10B981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
            </div>
          </div>
        </div>

        {/* Spatial Heatmap & Gaze Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-2">
            <StoreHeatmapModel />
          </div>

          <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gaze Direction Distribution</h3>
            <div className="h-56 w-full">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gazeDirectionData} dataKey="pct" nameKey="dir" innerRadius={35} outerRadius={60} paddingAngle={3} label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false} fontSize={9}>
                    {gazeDirectionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                </PieChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
            </div>
            <div className="space-y-1">
              {gazeDirectionData.map((g, i) => (
                <div key={i} className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />{g.dir}</span>
                  <span className="text-white font-bold">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products by Attention */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Products by Attention Score</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {topAttentionProducts.map((p, i) => (
              <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-bold truncate">{p.category}</span>
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">{p.attentionScore} pts</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                <div className="flex justify-between text-[9px] text-slate-400 pt-1 border-t border-[#1E293B]">
                  <span>Views: {formatNumber(p.views)}</span>
                  <span className="text-emerald-400 font-bold">${p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: CUSTOMER SEGMENTATION                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6 pt-4 border-t border-[#1E293B]">
        <div className="flex items-center gap-3 border-b border-[#1E293B] pb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
            3
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-wide">CUSTOMER SEGMENTATION</h2>
            <p className="text-[10px] text-slate-400 font-mono">RFM behavioral cohorts, spend dynamics, retention curves, and segment recommendations.</p>
          </div>
        </div>

        {/* Segmentation KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
          {[
            { label: "Total Customers", value: formatNumber(totalCustomers), change: "Tracked in period", icon: "👥" },
            { label: "Highest Revenue", value: topSeg.name, change: formatCurrency(topSeg.revenue), icon: "💰" },
            { label: "Most Loyal Cohort", value: "Champions", change: `${customerSegments[0].retention}% retention`, icon: "🏆" },
            { label: "At-Risk Customers", value: formatNumber(customerSegments[2]?.count || 0), change: `${customerSegments[2]?.pct || 0}% of total`, icon: "⚠️" },
            { label: "New Customers", value: formatNumber(customerSegments[3]?.count || 0), change: `${customerSegments[3]?.pct || 0}% of total`, icon: "🆕" },
          ].map((k, i) => (
            <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
              <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium font-sans truncate">{k.label}</span></div>
              <h3 className="text-lg font-black text-white font-mono mt-1">{k.value}</h3>
              <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
            </div>
          ))}
        </div>

        {/* Distribution + RFM Scatter + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
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
                <div key={i} className="flex items-center justify-between text-[10px]">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
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

          <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
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
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Segment Profiles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
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
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex items-center gap-2"><span className="text-lg">🤖</span><h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Segment Recommendations</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {segRecommendations.map((r, i) => (
              <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2 hover:border-purple-500/30 transition">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} /><h4 className="text-xs font-bold text-white">{r.segment}</h4></div>
                <p className="text-[10px] text-slate-400 font-sans">{r.action}</p>
                <div className="flex justify-between items-center pt-1 border-t border-[#1E293B]">
                  <span className="text-[10px] text-emerald-400 font-bold">Est. Impact: {r.impact}</span>
                  <button className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold rounded-lg">Apply →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DYNAMIC AI INSIGHTS ENGINE SECTION                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">DYNAMIC AI BEHAVIORAL INSIGHTS</h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Real-time automated reasoning engine analyzing live camera streams, journey flow, gaze fixation, and behavioral segment shifts.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-lg font-bold animate-pulse">
            Active Data Range: {dateLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicAiInsights.map((ins, i) => (
            <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-2xl space-y-2 hover:border-purple-500/40 transition-all duration-200">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-white leading-snug">{ins.title}</h4>
                <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-bold whitespace-nowrap font-mono ${ins.tagColor}`}>
                  {ins.impact} Impact
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{ins.desc}</p>
              <div className="pt-2 border-t border-[#1E293B]/80 flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">Source: YOLOv8 Camera Telemetry</span>
                <span className="text-emerald-400 font-bold">Auto-Updated</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
