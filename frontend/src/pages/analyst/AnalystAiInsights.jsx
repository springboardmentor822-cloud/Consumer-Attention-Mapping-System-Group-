import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Funnel, FunnelChart, LabelList
} from "recharts";
import { formatNumber, formatCurrency, getCentralScaledData } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";

const mockAssistantPrompts = [
  "Which department has the highest dwell time?",
  "Recommend a promotion for Cosmetics.",
  "Identify current layout bottlenecks.",
];

export default function AnalystAiInsights() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);
  const activeFilter = localPeriod || globalFilter;
  const central = getCentralScaledData(activeFilter);
  const mult = central?.mult || 1.0;

  // Let's generate dynamic AI Insights, Predictions, and Anomalies
  const dynamicAiInsights = [];
  const dynamicAiPredictions = [];
  const dynamicAnomalies = [];
  let completedCount = 0;
  let totalRevenueImpact = 0;

  const dateLabel = typeof activeFilter === "object" ? activeFilter.label || activeFilter.dateRange : activeFilter;

  if (central && central.zones && central.zones.length > 0 && central.products && central.products.length > 0 && (central.kpis?.totalVisitors ?? 0) >= 5) {
    // Insights
    // 1. Low conversion product
    const sortedByViews = [...central.products].sort((a, b) => b.views - a.views);
    const lowConvProduct = sortedByViews.find(p => p.convRate < 35) || sortedByViews[0];
    if (lowConvProduct) {
      const confidence = Math.round(95 - (lowConvProduct.convRate / 2));
      const impact = Math.round(lowConvProduct.revenue * (1 - lowConvProduct.convRate / 100));
      dynamicAiInsights.push({
        title: `Review Display of ${lowConvProduct.name}`,
        desc: `This product has high traffic (${lowConvProduct.views.toLocaleString()} views) but low conversion rate (${lowConvProduct.convRate}%). Review pricing or placement in ${lowConvProduct.zone}.`,
        confidence,
        impact,
        category: "Merchandising",
        priority: "High",
        status: "New"
      });
    }

    // 2. High traffic low dwell zone
    const sortedZones = [...central.zones].sort((a, b) => b.visitors - a.visitors);
    const lowDwellZone = sortedZones.find(z => z.dwellTime < 15) || sortedZones[0];
    if (lowDwellZone) {
      const confidence = Math.max(70, Math.round(98 - lowDwellZone.dwellTime * 2));
      const impact = Math.round(lowDwellZone.revenue * 0.15);
      dynamicAiInsights.push({
        title: `Optimize Flow in ${lowDwellZone.name} Zone`,
        desc: `${lowDwellZone.name} has high visitors (${lowDwellZone.visitors.toLocaleString()}) but low average dwell time of ${lowDwellZone.dwellTime} min. Consider adding interactive displays or layout changes.`,
        confidence,
        impact,
        category: "Layout",
        priority: "Medium",
        status: "New"
      });
    }

    // 3. High attention low conversion zone
    const attentionZone = [...central.zones].find(z => z.attentionScore > 80 && z.conversionRate < 20) || sortedZones[1];
    if (attentionZone) {
      const confidence = Math.round(attentionZone.attentionScore);
      const impact = Math.round(attentionZone.revenue * (0.3 - attentionZone.conversionRate / 100));
      dynamicAiInsights.push({
        title: `Promotional Push in ${attentionZone.name} Zone`,
        desc: `${attentionZone.name} has high attention score (${attentionZone.attentionScore}/100) but conversion rate is only ${attentionZone.conversionRate}%. Introduce a bundle promotion to drive spatial conversion.`,
        confidence,
        impact,
        category: "Promotion",
        priority: "High",
        status: "New"
      });
    }

    // 4. Expand capacity for highest revenue zone
    const topRevZone = [...central.zones].reduce((max, z) => z.revenue > max.revenue ? z : max, central.zones[0]);
    if (topRevZone) {
      const confidence = Math.round(topRevZone.attentionScore);
      const impact = Math.round(topRevZone.revenue * 0.12);
      dynamicAiInsights.push({
        title: `Expand Capacity for ${topRevZone.name}`,
        desc: `The ${topRevZone.name} zone generated the highest revenue of ${formatCurrency(topRevZone.revenue)} this period with a conversion rate of ${topRevZone.conversionRate}%. Expand display capacity to prevent stockouts.`,
        confidence,
        impact,
        category: "Inventory",
        priority: "Medium",
        status: "New"
      });
    }

    // 5. Cross category transition
    const nonEntryTransitions = (central.zoneTransitions || []).filter(t => t.from !== "Entry");
    const topTransition = nonEntryTransitions.length > 0 ? nonEntryTransitions.sort((a, b) => b.pct - a.pct)[0] : { from: "Bakery", to: "Dairy", pct: 38.0 };
    if (topTransition) {
      const confidence = Math.min(98, Math.round(topTransition.pct * 2 + 10));
      const impact = Math.round(central.kpis.salesRevenue * (topTransition.pct / 100) * 0.1);
      dynamicAiInsights.push({
        title: `Co-locate ${topTransition.from} and ${topTransition.to}`,
        desc: `${topTransition.pct}% of customers in the ${topTransition.from} zone also visit the ${topTransition.to} zone. Placing cross-merchandising displays near the transition point can increase basket size.`,
        confidence,
        impact,
        category: "Layout",
        priority: "Medium",
        status: "Completed"
      });
    }

    completedCount = dynamicAiInsights.filter(i => i.status === "Completed").length;
    totalRevenueImpact = dynamicAiInsights.reduce((s, i) => s + i.impact, 0);

    // Predictions
    const weekendTraffic = central.dailyTrafficTrend.filter(t => t.day === "Sat" || t.day === "Sun").reduce((s, t) => s + t.visitors, 0);
    const weekdayTraffic = central.dailyTrafficTrend.filter(t => t.day !== "Sat" && t.day !== "Sun").reduce((s, t) => s + t.visitors, 0);
    const weekendIncreasePct = weekdayTraffic > 0 ? ((weekendTraffic / 2) / (weekdayTraffic / 5) - 1) * 100 : 0;

    dynamicAiPredictions.push({
      metric: "Weekend Traffic Projection",
      prediction: `+${Math.max(1, Math.round(weekendIncreasePct))}% expected`
    });
    dynamicAiPredictions.push({
      metric: "Period Revenue Projection",
      prediction: `${formatCurrency(central.kpis.salesRevenue + totalRevenueImpact)} projected`
    });
    dynamicAiPredictions.push({
      metric: "Peak Conversion Rate",
      prediction: `${(central.kpis.conversionRate * 1.08).toFixed(1)}% during peak hours`
    });

    // Anomalies
    const worstZone = (central?.zones && central.zones.length > 0) ? central.zones.reduce((a, b) => a.attentionScore < b.attentionScore ? a : b) : null;
    if (central.kpis.totalVisitors > 100) {
      dynamicAnomalies.push({
        type: "Traffic Peak Deviation",
        desc: `Unusual footfall change of ${central.kpis.totalVisitorsChange}% detected in entrance zone.`,
        severity: "Warning",
        time: "2 hours ago"
      });
    }
    if (worstZone) {
      dynamicAnomalies.push({
        type: "Attention Dropoff Detected",
        desc: `${worstZone.name} zone attention score dropped to ${worstZone.attentionScore}/100.`,
        severity: "Alert",
        time: "4 hours ago"
      });
    }
  }

  const avgConfidence = dynamicAiInsights.length > 0
    ? Math.round(dynamicAiInsights.reduce((sum, i) => sum + i.confidence, 0) / dynamicAiInsights.length)
    : 0;
  const maxConfidence = dynamicAiInsights.length > 0
    ? Math.max(...dynamicAiInsights.map(i => i.confidence))
    : 0;

  const kpis = [
    { label: "Confidence Score", value: `${maxConfidence}% max`, change: `${avgConfidence}% avg confidence`, icon: "🛡️" },
    { label: "AI Insights Generated", value: dynamicAiInsights.length, change: `+${dynamicAiInsights.filter(i => i.status === "New").length} new suggestions`, icon: "🤖" },
    { label: "Opportunities Identified", value: dynamicAiInsights.length, change: `${dynamicAiInsights.length} suggestions this period`, icon: "💡" },
    { label: "Est. Revenue Impact", value: formatCurrency(totalRevenueImpact), change: `${central?.kpis?.salesRevenue > 0 ? ((totalRevenueImpact / central.kpis.salesRevenue) * 100).toFixed(1) : 0}% of total revenue`, icon: "💰" },
    { label: "Completed / In Progress", value: `${completedCount} / ${dynamicAiInsights.length}`, change: `${dynamicAiInsights.length - completedCount} in progress`, icon: "✅" },
  ];

  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I am your AI Retail Analyst Assistant. Ask me questions like: 'Identify current layout bottlenecks' or 'Which department has the highest dwell time?'" }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = (textToSend = inputValue) => {
    const text = textToSend.trim();
    if (!text) return;
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInputValue("");

    setTimeout(() => {
      let reply = "I analyzed the telemetry and couldn't find a direct correlation. Can you clarify?";
      const topDwellZone = central && central.zones && central.zones.length > 0
        ? [...central.zones].sort((a, b) => b.dwellTime - a.dwellTime)[0]
        : null;
      const secondDwellZone = central && central.zones && central.zones.length > 1
        ? [...central.zones].sort((a, b) => b.dwellTime - a.dwellTime)[1]
        : null;
      const cosmeticsZoneObj = central && central.zones
        ? central.zones.find(z => z.name.toLowerCase().includes("cosmetics"))
        : null;
      const topBottleneck = central && central.bottlenecks && central.bottlenecks.length > 0
        ? [...central.bottlenecks].sort((a, b) => b.density - a.density)[0]
        : null;

      if (text.toLowerCase().includes("dwell")) {
        if (topDwellZone) {
          reply = `According to dwell analysis for the active period, ${topDwellZone.name} has the highest average dwell time of ${topDwellZone.dwellTime} minutes${secondDwellZone ? `, followed by ${secondDwellZone.name} at ${secondDwellZone.dwellTime} minutes` : ""}.`;
        } else {
          reply = "According to dwell analysis, no zones tracked have sufficient dwell telemetry.";
        }
      } else if (text.toLowerCase().includes("promotion") || text.toLowerCase().includes("cosmetics")) {
        if (cosmeticsZoneObj) {
          reply = `For Cosmetics, AI recommends a targeted promotion or layout optimization. Cosmetics current conversion is ${cosmeticsZoneObj.conversionRate}% with ${formatNumber(cosmeticsZoneObj.visitors)} visitors tracked. Suggested revenue lift: +${formatCurrency(Math.round(cosmeticsZoneObj.revenue * 0.15))}.`;
        } else {
          reply = `For Cosmetics, AI recommends extending display lighting to 9 PM since traffic is high but attention dropoff occurs. Estimated revenue lift: +${formatCurrency(Math.round((central?.kpis?.salesRevenue || 108400) * 0.08))}/mo.`;
        }
      } else if (text.toLowerCase().includes("bottleneck") || text.toLowerCase().includes("layout")) {
        if (topBottleneck) {
          reply = `The highest traffic density is at the ${topBottleneck.zone} (${topBottleneck.density}% density, avg wait: ${topBottleneck.avgWait}). AI recommends optimizing layout or adding staff during peak hours.`;
        } else {
          reply = "The highest traffic densities are at checkout lines and main entrance aisles. AI recommends adding checkout staff during peak traffic periods and optimizing endcap placements.";
        }
      }
      setMessages([...newMessages, { role: "assistant", text: reply }]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">AI Insights</h1>
        </div>
        <CustomDateSelector value={localPeriod || globalFilter?.dateRange} onChange={setLocalPeriod} />
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

      {/* Recommendations + Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicAiInsights.length === 0 ? (
                <div className="col-span-2 text-center text-slate-500 py-6">Insufficient data for AI insight</div>
              ) : (
                dynamicAiInsights.map((rec, i) => (
                  <div key={i} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2 hover:border-cyan-500/30 transition">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${rec.priority === "High" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>{rec.priority}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{rec.confidence}% confidence</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">{rec.title}</h4>
                    <p className="text-[10px] text-slate-400">{rec.desc}</p>
                    <div className="pt-2 border-t border-[#1E293B] flex justify-between text-[10px] font-mono">
                      <span className="text-cyan-400">Impact: {formatCurrency(rec.impact)}</span>
                      <span className="text-slate-400">{rec.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Anomalies */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Anomaly Detection</h3>
            <div className="space-y-2.5">
              {dynamicAnomalies.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center">Insufficient data for AI insight</div>
              ) : (
                dynamicAnomalies.map((anom, i) => (
                  <div key={i} className={`p-3 border rounded-xl flex items-start gap-2.5 ${anom.severity === "Warning" ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                    <span className="text-sm mt-0.5">{anom.severity === "Warning" ? "⚠️" : "🚨"}</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-white leading-tight">{anom.type}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{anom.desc}</p>
                      <span className="text-[9px] text-slate-500 font-mono block mt-1">{anom.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B]">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Predictive Trends</h4>
            <div className="space-y-1.5 text-[10px] font-mono">
              {dynamicAiPredictions.length === 0 ? (
                <div className="text-slate-500 text-[10px] text-center py-2">Insufficient data for AI insight</div>
              ) : (
                dynamicAiPredictions.map((pred, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#070C18] p-2 rounded-lg border border-[#1E293B]">
                    <span className="text-slate-400">{pred.metric}</span>
                    <span className="text-emerald-400 font-bold">{pred.prediction}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Built-in Assistant Panel */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Assistant (Natural Language Query)</h3>
        <div className="h-64 bg-[#070C18] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex-1 overflow-y-auto space-y-2.5 text-xs scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] p-2.5 rounded-xl border ${m.role === "user" ? "bg-cyan-600/10 border-cyan-500/30 text-white" : "bg-[#1E293B]/40 border-[#273449] text-slate-200"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {mockAssistantPrompts.map((p, i) => (
                <button key={i} onClick={() => handleSendMessage(p)} className="px-2.5 py-1 bg-[#1E293B] hover:bg-slate-700 text-slate-300 rounded-lg text-[9px] font-mono">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Type a natural language query..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()} className="flex-1 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" />
              <button onClick={() => handleSendMessage()} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs rounded-lg transition">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
