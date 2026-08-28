import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter, ZAxis
} from "recharts";
import { formatNumber, formatPct, getCentralScaledData } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function AnalystDwellTime() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);

  const activeFilter = localPeriod || globalFilter;
  const centralData = getCentralScaledData(activeFilter);
  const { dwellDistribution, dwellTrend, zones, products, kpis: centralKpis, mult } = centralData;

  const kpis = [
    { label: "Avg Dwell Time", value: `${centralKpis.avgDwellTime} min`, change: "↑ 8.2%", icon: "⏱️" },
    { label: "Longest Dwell Zone", value: "Electronics", change: "28.4 min avg", icon: "🏢" },
    { label: "Shortest Dwell Zone", value: "Household", change: "8.2 min avg", icon: "🚪" },
    { label: "Peak Dwell Window", value: "5PM - 7PM", change: "+14.3% lift", icon: "🕰️" },
    { label: "Overall Dwell Score", value: "89/100", change: "High Retention", icon: "✨" },
    { label: "Dwell-Conv. Correlation", value: "0.82", change: "Strong Relationship", icon: "📈" },
  ];

  const scatterData = zones.map(z => ({
    x: z.dwellTime,
    y: z.conversionRate,
    z: z.visitors,
    name: z.name
  }));

  const topDwellProducts = products.slice().sort((a, b) => b.avgDwell - a.avgDwell).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Dwell Time Analysis</h1>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Dwell Trends + Zone Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zone Dwell Time Trends</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={dwellTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="avgDwell" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="bakery" stroke="#10B981" strokeWidth={1.5} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="electronics" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" /> Avg Store Dwell</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" style={{ borderTop: "1px dashed" }} /> Bakery</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 inline-block rounded" style={{ borderTop: "1px dashed" }} /> Electronics</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dwell Distribution</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={dwellDistribution}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="visitors" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* Dwell vs Conversion Scatter + Product Dwell Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dwell Time vs Conversion Rate</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Dwell Time" stroke="#64748B" fontSize={9} unit=" min" />
                <YAxis type="number" dataKey="y" name="Conversion Rate" stroke="#64748B" fontSize={9} unit="%" />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Scatter name="Zones" data={scatterData} fill="#10B981" />
              </ScatterChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Product Dwell Performance</h3>
          <div className="space-y-2.5">
            {topDwellProducts.map((p, i) => (
              <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex justify-between items-center hover:border-cyan-500/30 transition">
                <div>
                  <span className="text-[11px] text-white font-bold block">{p.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{p.category} · {p.zone}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-bold">
                  <span className="text-cyan-400">{p.avgDwell} min avg</span>
                  <span className="text-emerald-400">{p.convRate}% conv</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
