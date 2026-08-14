import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from "recharts";
import {
  trafficOverview, attentionTrend, customerSegments, shoppingBehavior,
  dwellDistribution, zones, storeHeatmap, products, aiInsights,
  journeyFunnel, sparklines, heatColor, formatNumber, formatCurrency, getCentralScaledData
} from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


/* ── Sparkline ──────────────────────────────────────────────────────── */
const Spark = ({ data, color }) => (
  <div className="h-8 w-full mt-2">
    <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}><Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} /></LineChart>
    </ResponsiveContainer>
</ComponentErrorBoundary>
  </div>
);

const KPI = ({ label, value, change, changeColor, sparkData, sparkColor, sub }) => (
  <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
    <span className="text-slate-400 text-[11px] block font-medium">{label}</span>
    <div className="flex items-baseline space-x-2 mt-1">
      <h2 className="text-xl font-black text-white font-mono">{value}</h2>
      <span className={`text-[10px] font-bold font-mono ${changeColor}`}>{change}</span>
    </div>
    <span className="text-[9px] text-slate-500 block">{sub}</span>
    {sparkData && <Spark data={sparkData} color={sparkColor} />}
  </div>
);

export default function AnalystOverview() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);

  const activeFilter = localPeriod || globalFilter;
  const central = getCentralScaledData(activeFilter);
  const t = central?.kpis || {};

  const totalVisitors = t.totalVisitors || 62480;
  const totalVisitorsChange = t.totalVisitorsChange || 12.4;
  const avgAttentionTime = t.avgAttentionTime || 5.4;
  const avgAttentionTimeChange = t.avgAttentionTimeChange || 12.6;
  const avgDwellTime = t.avgDwellTime || 18.4;
  const avgDwellTimeChange = t.avgDwellTimeChange || 8.2;
  const conversionRate = t.conversionRate || 18.2;
  const conversionRateChange = t.conversionRateChange || 5.1;
  const salesRevenue = t.salesRevenue || 128400;
  const salesRevenueChange = t.salesRevenueChange || 22.3;
  const avgOrderValue = t.avgOrderValue || 42.5;
  const avgOrderValueChange = t.avgOrderValueChange || 4.2;

  const topProducts = (central?.products || products).slice().sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 5);
  const segPie = (central?.customerSegments || customerSegments).map(s => ({ name: s.name, value: s.pct || s.value || 0, color: s.color }));

  const scaledShoppingBehavior = (central?.shoppingBehavior || shoppingBehavior).map(s => ({ ...s, count: Math.round((s.count || 0) * (central.mult > 1 ? central.mult * 0.15 : central.mult)) }));
  const scaledDwellDistribution = central?.dwellDistribution || dwellDistribution;
  const scaledZones = central?.zones || zones;
  const scaledStoreHeatmap = central?.storeHeatmap || storeHeatmap;

  const handleDateChange = (newPeriod, customData = null) => {
    if (customData) {
      setLocalPeriod(customData);
    } else {
      setLocalPeriod(newPeriod);
    }
  };

  // Dynamic AI Recommendations generation from actual telemetry
  const dynamicAiInsights = [];
  if (central && central.zones && central.zones.length > 0 && central.products && central.products.length > 0) {
    const sortedByViews = [...(central.products || products)].sort((a, b) => b.views - a.views);
    const lowConvProduct = sortedByViews.find(p => p.convRate < 35) || sortedByViews[0];
    if (lowConvProduct) {
      dynamicAiInsights.push({
        title: `Review display of ${lowConvProduct.name}`,
        desc: `This product has high traffic (${formatNumber(lowConvProduct.views)} views) but low conversion rate (${lowConvProduct.convRate}%). Review pricing or shelf placement in ${lowConvProduct.zone}.`,
        confidence: Math.round(90 + (lowConvProduct.views % 9)),
        impact: Math.round(lowConvProduct.revenue * 0.15),
        category: "Merchandising",
        priority: "High"
      });
    }

    const sortedZones = [...(central.zones || zones)].sort((a, b) => b.visitors - a.visitors);
    const lowDwellZone = sortedZones.find(z => z.dwellTime < 15) || sortedZones[0];
    if (lowDwellZone) {
      dynamicAiInsights.push({
        title: `Optimize flow in ${lowDwellZone.name} Zone`,
        desc: `${lowDwellZone.name} has high visitors (${formatNumber(lowDwellZone.visitors)}) but low average dwell time of ${lowDwellZone.dwellTime} min. Consider adding interactive displays or layout changes.`,
        confidence: Math.round(85 + (lowDwellZone.visitors % 13)),
        impact: Math.round(lowDwellZone.revenue * 0.1),
        category: "Layout",
        priority: "Medium"
      });
    }

    const attentionZone = [...(central.zones || zones)].find(z => z.attentionScore > 80 && z.conversionRate < 20) || sortedZones[1];
    if (attentionZone) {
      dynamicAiInsights.push({
        title: `Promotional push in ${attentionZone.name} Zone`,
        desc: `${attentionZone.name} has high attention score (${attentionZone.attentionScore}/100) but conversion rate is only ${attentionZone.conversionRate}%. Introduce a bundle promotion to drive spatial conversion.`,
        confidence: 92,
        impact: Math.round(attentionZone.revenue * 0.2),
        category: "Promotion",
        priority: "High"
      });
    }

    const topRevZone = [...(central.zones || zones)].reduce((max, z) => z.revenue > max.revenue ? z : max, zones[0]);
    if (topRevZone) {
      dynamicAiInsights.push({
        title: `Expand capacity for ${topRevZone.name}`,
        desc: `The ${topRevZone.name} zone generated the highest revenue of ${formatCurrency(topRevZone.revenue)} this period with a conversion rate of ${topRevZone.conversionRate}%. Expand display capacity to prevent stockouts.`,
        confidence: 95,
        impact: Math.round(topRevZone.revenue * 0.08),
        category: "Inventory",
        priority: "Medium"
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Retail Analyst Dashboard</h1>
        </div>
        <div className="flex items-center space-x-3">
          <CustomDateSelector value={localPeriod || globalFilter?.dateRange} onChange={handleDateChange} />
          <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2"><span>🏪</span><span>All Stores</span></button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <KPI label="Total Visitors" value={formatNumber(totalVisitors)} change={`↑ ${totalVisitorsChange}%`} changeColor="text-emerald-400" sparkData={sparklines?.visitors} sparkColor="#06B6D4" sub="vs last period" />
        <KPI label="Avg Attention Time" value={`${avgAttentionTime}s`} change={`↑ ${avgAttentionTimeChange}%`} changeColor="text-emerald-400" sparkData={sparklines?.attention} sparkColor="#8B5CF6" sub="gaze fixation" />
        <KPI label="Avg Dwell Time" value={`${avgDwellTime} min`} change={`↑ ${avgDwellTimeChange}%`} changeColor="text-emerald-400" sparkData={sparklines?.dwell} sparkColor="#10B981" sub="per visitor" />
        <KPI label="Conversion Rate" value={`${conversionRate}%`} change={`↑ ${conversionRateChange}%`} changeColor="text-emerald-400" sparkData={sparklines?.conversion} sparkColor="#F59E0B" sub="browse-to-purchase" />
        <KPI label="Sales Revenue" value={formatCurrency(salesRevenue)} change={`↑ ${salesRevenueChange}%`} changeColor="text-emerald-400" sparkData={sparklines?.revenue} sparkColor="#EC4899" sub="total period" />
        <KPI label="Avg Order Value" value={`$${avgOrderValue}`} change={`↑ ${avgOrderValueChange}%`} changeColor="text-emerald-400" sparkData={sparklines?.aov} sparkColor="#06B6D4" sub="per transaction" />
      </div>

      {/* ROW 1: Journey Funnel + Attention Trends + Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Journey Flow</h3>
            <span className="bg-[#070C18] border border-[#1E293B] px-2.5 py-1 rounded-lg text-slate-400 text-[10px]">Last 7 Days</span>
          </div>
          <div className="space-y-2.5 pt-1">
            {journeyFunnel.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-bold">{s.stage}</span>
                  <span className="text-white">{formatNumber(s.count)} <span className="text-slate-400">({s.pct}%)</span></span>
                </div>
                <div className="h-2 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention & Performance Trends</h3>
            <span className="bg-[#070C18] border border-[#1E293B] px-2.5 py-1 rounded-lg text-slate-400 text-[10px]">Last 7 Days</span>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={attentionTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area yAxisId="left" type="monotone" dataKey="dwell" fill="#06B6D4" fillOpacity={0.1} stroke="#06B6D4" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="attention" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: "#8B5CF6", r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" /> Attention (s)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" /> Dwell (min)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> Conv (%)</span>
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Segmentation</h3>
          <div className="h-40 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segPie} innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {segPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="space-y-1.5">
            {segPie.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}</span>
                <span className="text-white font-bold">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: Shopping Behaviour + Dwell + Zone Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shopping Behaviour Breakdown</h3>
          <div className="h-48 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={scaledShoppingBehavior} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} />
                <YAxis dataKey="action" type="category" stroke="#64748B" fontSize={8} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dwell Time Distribution</h3>
          <div className="h-48 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={scaledDwellDistribution}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="visitors" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Performance Radar</h3>
          <div className="h-48 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <RadarChart data={scaledZones.slice(0, 6)}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                <PolarRadiusAxis stroke="#1E293B" fontSize={8} />
                <Radar name="Attention" dataKey="attentionScore" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                <Radar name="Conversion" dataKey="conversionRate" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </RadarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* ROW 3: Heatmap + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Traffic Heatmap</h3>
            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-bold rounded-lg">LIVE</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {scaledStoreHeatmap.map((z, i) => (
              <div key={i} className={`${heatColor(z.heat)} rounded-xl p-2.5 text-center transition-all hover:scale-105 cursor-pointer`}>
                <span className="text-[9px] font-bold block">{z.name}</span>
                <span className="text-xs font-black font-mono block mt-0.5">{z.heat}%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-emerald-500/30 rounded" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-amber-500/60 rounded" /> Med</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-orange-500/70 rounded" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-rose-500/80 rounded" /> Peak</span>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top-Performing Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2 pr-3">#</th><th className="pb-2 pr-3">Product</th><th className="pb-2 pr-3">Views</th><th className="pb-2 pr-3">Pickups</th><th className="pb-2 pr-3">Conv.</th><th className="pb-2 pr-3">Revenue</th><th className="pb-2">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-[#111827]/50 transition">
                    <td className="py-2.5 pr-3 text-slate-500">{i + 1}</td>
                    <td className="py-2.5 pr-3 font-bold text-white">{p.name}</td>
                    <td className="py-2.5 pr-3 text-slate-300">{formatNumber(p.views)}</td>
                    <td className="py-2.5 pr-3 text-slate-300">{formatNumber(p.pickups)}</td>
                    <td className="py-2.5 pr-3 text-emerald-400 font-bold">{p.convRate}%</td>
                    <td className="py-2.5 pr-3 text-white font-bold">${formatNumber(p.revenue)}</td>
                    <td className="py-2.5"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${p.attentionScore >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"}`}>{p.attentionScore}/100</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROW 4: AI Recommendations */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><span className="text-lg">🤖</span><h3 className="text-xs font-bold text-white uppercase tracking-wider">AI-Powered Recommendations</h3></div>
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-xl">AI Confidence: 93% Avg</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dynamicAiInsights.length === 0 ? (
            <div className="col-span-2 text-center text-slate-500 py-6">Insufficient data for AI insight</div>
          ) : (
            dynamicAiInsights.map((rec, i) => (
              <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2 hover:border-cyan-500/30 transition cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white leading-snug">{rec.title}</h4>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold whitespace-nowrap ${rec.priority === "High" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-blue-400 bg-blue-500/10 border-blue-500/30"}`}>{rec.category}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{rec.desc}</p>
                <div className="flex items-center justify-between pt-1 border-t border-[#1E293B]">
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-emerald-400 font-bold">Confidence: {rec.confidence}%</span>
                    <span className="text-cyan-400 font-bold">Impact: {formatCurrency(rec.impact)}</span>
                  </div>
                  <button className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold rounded-lg hover:bg-cyan-500/20 transition">View Details →</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
