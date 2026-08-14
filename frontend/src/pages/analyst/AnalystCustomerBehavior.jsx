import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import {
  shoppingBehavior, behaviorTrend, hourlyActivityHeatmap,
  formatNumber, formatPct, getCentralScaledData
} from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function AnalystCustomerBehavior() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);

  const activeFilter = localPeriod || globalFilter;
  const centralData = getCentralScaledData(activeFilter);
  const { mult, kpis: centralKpis } = centralData;

  const totalInteractions = Math.round(34120 * mult);
  const kpis = [
    { label: "Total Interactions", value: formatNumber(totalInteractions), change: "↑ 15.2%", icon: "🛒" },
    { label: "Pickup Rate", value: "68.4%", change: "↑ 3.8%", icon: "🛍️" },
    { label: "Avg Browse Duration", value: `${(14.2 * (mult > 5 ? 1.05 : mult < 1 ? 0.95 : 1.0)).toFixed(1)} min`, change: "↑ 0.5 min", icon: "⏱️" },
    { label: "Purchase Rate", value: `${centralKpis.conversionRate}%`, change: "↑ 2.4%", icon: "💰" },
    { label: "Return Rate", value: "12.1%", change: "↓ 1.5%", icon: "🔄" },
    { label: "Engagement Score", value: "78.4%", change: "High Lift", icon: "✨" },
  ];

  const actionDistribution = [
    { name: "Browse Only", value: 33.8, color: "#3B82F6" },
    { name: "Pickup & Put Back", value: 15.0, color: "#F59E0B" },
    { name: "Pickup & Cart", value: 41.6, color: "#10B981" },
    { name: "Checkout Complete", value: 9.6, color: "#8B5CF6" },
  ];

  const paths = [
    { route: "Entrance → Produce → Dairy → Checkout", visitors: Math.round(4280 * mult), pct: "30.0%" },
    { route: "Entrance → Bakery → Dairy → Checkout", visitors: Math.round(3560 * mult), pct: "24.9%" },
    { route: "Entrance → Promo → Checkout", visitors: Math.round(2140 * mult), pct: "15.0%" },
    { route: "Entrance → Cosmetics → Aisle 2 → Checkout", visitors: Math.round(1840 * mult), pct: "12.9%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Customer Behavior Analysis</h1>
        </div>
        <CustomDateSelector value={localPeriod || globalFilter?.dateRange} onChange={setLocalPeriod} />
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

      {/* Interaction Trends + Action Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shopper Interaction Trends</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={behaviorTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="interactions" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pickups" stroke="#06B6D4" strokeWidth={2} />
                <Line type="monotone" dataKey="purchases" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="returns" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" /> Total Interactions</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" /> Product Pickups</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> Purchases</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" style={{ borderTop: "1px dashed" }} /> Returns</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Action Distribution</h3>
          <div className="h-44 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={actionDistribution} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={3} label={({ value }) => `${value}%`} labelLine={false} fontSize={9}>
                  {actionDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="space-y-1">
            {actionDistribution.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                <span className="text-white font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly activity patterns + Common Shopping Paths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Activity Density by Time of Day</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyActivityHeatmap}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="Mon" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="Sat" stackId="2" stroke="#A855F7" fill="#A855F7" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Weekday Peak (Mon)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" /> Weekend Peak (Sat)</span>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Common Navigation Routes</h3>
          <div className="space-y-3 pt-1">
            {paths.map((p, i) => (
              <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex justify-between items-center hover:border-cyan-500/30 transition">
                <div>
                  <span className="text-[11px] text-cyan-400 font-mono font-bold block">{p.route}</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">{formatNumber(p.visitors)} monthly visitors</span>
                </div>
                <span className="text-xs font-bold text-white font-mono">{p.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
