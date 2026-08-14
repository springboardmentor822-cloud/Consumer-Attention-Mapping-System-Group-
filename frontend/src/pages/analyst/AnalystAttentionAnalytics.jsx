import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from "recharts";
import {
  attentionOverview, attentionTrend, attentionByZone, attentionHeatmap,
  gazeDirectionData, products, heatColor, formatNumber
} from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


const a = attentionOverview;
const kpis = [
  { label: "Avg Attention Time", value: `${a.avgAttentionTime}s`, change: `↑ ${a.avgAttentionTimeChange}%`, icon: "👁️" },
  { label: "Gaze Direction Score", value: `${a.gazeDirectionScore}/100`, change: "Optimal", icon: "🎯" },
  { label: "Fixation Count", value: formatNumber(a.fixationCount), change: `↑ ${a.fixationCountChange}%`, icon: "📊" },
  { label: "Attention Hotspots", value: a.attentionHotspots, change: "Active Zones", icon: "🔥" },
  { label: "Low-Attention Zones", value: a.lowAttentionZones, change: "Need Review", icon: "⚠️" },
  { label: "Attention Change", value: `+${a.attentionChangePercent}%`, change: "vs last period", icon: "📈" },
];

const gazeRadar = [
  { dir: "Eye Level", score: 96 }, { dir: "Above Eye", score: 72 },
  { dir: "Below Eye", score: 64 }, { dir: "Left Peripheral", score: 58 },
  { dir: "Right Peripheral", score: 62 },
];

const topAttentionProducts = products.slice().sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 6);

export default function AnalystAttentionAnalytics() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Attention Analytics</h1>
        </div>
        <div className="flex items-center space-x-3">
          <CustomDateSelector value={localPeriod || globalFilter?.dateRange} onChange={setLocalPeriod} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Heatmap + Attention Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention Heatmap</h3>
            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-bold rounded-lg">LIVE</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {attentionHeatmap.map((z, i) => (
              <div key={i} className={`${heatColor(z.attention)} rounded-xl p-2.5 text-center transition-all hover:scale-105 cursor-pointer`}>
                <span className="text-[8px] font-bold block leading-tight">{z.name}</span>
                <span className="text-xs font-black font-mono block mt-0.5">{z.attention}%</span>
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
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attention Trends Over Time</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attentionTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="attention" fill="#8B5CF6" fillOpacity={0.15} stroke="#8B5CF6" strokeWidth={2.5} />
                <Area type="monotone" dataKey="dwell" fill="#06B6D4" fillOpacity={0.1} stroke="#06B6D4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" /> Attention (s)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" /> Dwell (min)</span>
          </div>
        </div>
      </div>

      {/* Gaze Radar + Zone Scores + Product Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gaze Direction Analysis</h3>
          <div className="h-52 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <RadarChart data={gazeRadar}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="dir" stroke="#94A3B8" fontSize={8} />
                <PolarRadiusAxis stroke="#1E293B" fontSize={8} domain={[0, 100]} />
                <Radar dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="space-y-1.5">
            {gazeDirectionData.map((g, i) => (
              <div key={i} className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-300">{g.direction}</span>
                <span className="text-white font-bold">{g.pct}% ({g.score}/100)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Attention Scores</h3>
          <div className="h-52 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={attentionByZone} layout="vertical">
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={9} domain={[0, 100]} />
                <YAxis dataKey="zone" type="category" stroke="#64748B" fontSize={8} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="score" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Focus Metrics</h3>
          <div className="space-y-2">
            {topAttentionProducts.map((p, i) => (
              <div key={i} className="p-2.5 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-white font-bold block">{p.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{p.avgDwell}s avg gaze · {formatNumber(p.views)} views</span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${p.attentionScore >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"}`}>{p.attentionScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Comparison + AI Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Department Attention Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead><tr className="border-b border-[#1E293B] text-slate-400"><th className="pb-2">Zone</th><th className="pb-2">Score</th><th className="pb-2">Avg Gaze</th><th className="pb-2">Trend</th></tr></thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {attentionByZone.map((z, i) => (
                  <tr key={i}><td className="py-2 font-bold text-white">{z.zone}</td><td className="py-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${z.score >= 85 ? "text-emerald-400" : z.score >= 70 ? "text-cyan-400" : "text-amber-400"}`}>{z.score}/100</span></td><td className="py-2 text-slate-300">{z.avgGaze}s</td><td className={`py-2 font-bold ${z.trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{z.trend > 0 ? "+" : ""}{z.trend}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2"><span className="text-lg">🤖</span><h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Attention Alerts</h3></div>
          <div className="space-y-2">
            {[
              { title: "Household zone attention critically low", desc: "Attention score dropped to 58/100, 34% below store average. Consider repositioning high-demand products to eye level.", severity: "Critical", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
              { title: "Cosmetics wall seeing +8.4% attention lift", desc: "New display arrangement driving sustained attention improvement. Maintain current configuration and extend to similar zones.", severity: "Positive", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
              { title: "Frozen section attention declining week-over-week", desc: "Gaze duration down from 2.4s to 1.8s. Glass door glare and poor lighting identified as contributing factors.", severity: "Warning", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
              { title: "Eye-level placement driving 42% of all fixations", desc: "Products at 120-160cm height receive disproportionate attention. Optimize premium product placement at this height.", severity: "Insight", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
            ].map((alert, i) => (
              <div key={i} className={`p-3 rounded-xl border ${alert.color}`}>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-[11px] font-bold">{alert.title}</h4>
                  <span className="text-[9px] font-bold uppercase whitespace-nowrap">{alert.severity}</span>
                </div>
                <p className="text-[10px] opacity-80 mt-1">{alert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
