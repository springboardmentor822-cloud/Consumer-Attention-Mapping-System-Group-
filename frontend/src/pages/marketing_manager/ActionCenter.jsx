import React, { useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber } from "../../services/centralData";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function ActionCenter() {
  const [filter, setFilter] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("Last 7 Days");

  const handleDateChange = (p) => setSelectedPeriod(p);

  // ALL ACTIONS WITH DISTINCT DATA BY PRIORITY
  const allActionsList = [
    { id: 1, type: "Alert", priority: "High", icon: "🚨", title: "Bakery endcap conversion rate dropped below threshold", desc: "Conversion has fallen to 6.2%, down from 14.8% last week. Immediate stock layout review recommended.", time: "2 min ago", actionText: "Apply Shelf Optimization", status: "Pending" },
    { id: 2, type: "Action Required", priority: "High", icon: "🔥", title: "Summer Sale campaign budget 85% utilized", desc: "Promotional budget nearing threshold. Approve extension to sustain high weekend conversion.", time: "15 min ago", actionText: "Approve Budget Extension", status: "Pending" },
    { id: 3, type: "Recommendation", priority: "High", icon: "⚡", title: "Peak traffic surge approaching in 30 minutes", desc: "5 PM footfall surge expected. Activate pre-configured Electronics flash promotion now.", time: "30 min ago", actionText: "Activate Flash Promo", status: "Pending" },
    { id: 4, type: "Optimization", priority: "Medium", icon: "📊", title: "Adjust signage placement in Grocery Aisle 3", desc: "Heatmap shows high dwell time but low promotional tag engagement. Re-orient digital display.", time: "1 hr ago", actionText: "Re-orient Signage", status: "Completed" },
    { id: 5, type: "Inventory", priority: "Medium", icon: "📦", title: "Product A restocking recommended for Shelf A", desc: "Product A inventory down to 5 units during high footfall window.", time: "2 hrs ago", actionText: "Notify Floor Staff", status: "Completed" },
    { id: 6, type: "Campaign", priority: "Medium", icon: "🎯", title: "Review Weekend Bonanza CTR target alignment", desc: "CTR is tracking at 12.7%, slightly below the 15% target.", time: "4 hrs ago", actionText: "Review Campaign", status: "Completed" },
    { id: 7, type: "Maintenance", priority: "Low", icon: "📌", title: "Update digital price tags in Beauty Section", desc: "Automated price sync completed for 12 items.", time: "6 hrs ago", actionText: "Verify Tags", status: "Completed" },
    { id: 8, type: "Audit", priority: "Low", icon: "🔍", title: "Routine camera coverage diagnostic check", desc: "All 16 video analytics sensors reporting optimal resolution and tracking clarity.", time: "8 hrs ago", actionText: "View Log", status: "Completed" }
  ];

  const filteredActions = filter === "All"
    ? allActionsList
    : allActionsList.filter(a => a.priority === filter);

  // 1. ACTION OVERVIEW (DONUT CHART DATA)
  const actionOverviewData = [
    { name: "Completed Actions", count: 5, color: "#10B981" },
    { name: "Pending Actions", count: 3, color: "#F59E0B" },
    { name: "High Priority", count: 3, color: "#EF4444" }
  ];

  // 2. ACTION PRIORITY CHART DATA
  const actionPriorityData = [
    { priority: "High Priority", count: 3, color: "#EF4444" },
    { priority: "Medium Priority", count: 3, color: "#F59E0B" },
    { priority: "Low Priority", count: 2, color: "#3B82F6" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-8">
      {/* PAGE HEADER WITH DATE FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white">Action Center</h1>
        <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
          <span className="text-xs font-bold text-slate-400">Date Range:</span>
          <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
        </div>
      </div>

      {/* 1. ACTION OVERVIEW & 2. ACTION PRIORITY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* 1. ACTION OVERVIEW DONUT CHART */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Action Overview (Status Donut)</h3>
          <div className="h-44 relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={actionOverviewData} innerRadius={42} outerRadius={62} dataKey="count">
                  {actionOverviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <strong className="text-base text-white block">8</strong>
              <span className="text-[9px] text-slate-400 block">Total Actions</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-[#1E293B]">
            {actionOverviewData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 justify-center">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-sans truncate">{item.name}:</span>
                <strong className="text-white">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* 2. ACTION PRIORITY CHART (BAR CHART) */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Action Priority Breakdown</h3>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionPriorityData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="priority" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} domain={[0, 5]} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Actions Count">
                  {actionPriorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE SCOPE (FILTER BAR) */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0F172A] border border-[#1E293B] p-3 rounded-xl font-mono">
        <span className="text-xs text-slate-400 font-bold">
          Active Scope: <span className="text-amber-400">{filter}</span> ({filteredActions.length} Actions)
        </span>
        <div className="flex items-center space-x-2">
          {["All", "High", "Medium", "Low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                filter === p ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-[#070C18] text-slate-400 border-[#1E293B] hover:text-white"
              }`}
            >
              {p === "All" ? "All Actions" : `${p} Priority`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. OPERATIONAL ACTION LIST */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Operational Actions List ({filter})</h3>
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <div key={action.id} className="p-4 bg-[#070C18] border border-[#1E293B] hover:border-amber-500/50 rounded-xl space-y-2 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-white flex items-center gap-2 font-sans">
                  <span>{action.icon}</span> {action.title}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    action.priority === "High" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : action.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  }`}>
                    {action.priority} Priority
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    action.status === "Pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {action.status}
                  </span>
                </div>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">{action.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
                <span className="text-slate-500 text-[10px]">{action.time}</span>
                <button
                  onClick={() => alert(`Executed Action: ${action.actionText}`)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[10px] transition"
                >
                  {action.actionText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
