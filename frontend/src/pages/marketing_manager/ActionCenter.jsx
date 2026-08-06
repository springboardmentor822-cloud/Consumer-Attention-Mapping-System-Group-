import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ActionCenter() {
  const [filter, setFilter] = useState("High Priority");

  const highPriorityActions = [
    { id: 1, type: "Alert", priority: "High", icon: "🚨", title: "Bakery endcap conversion rate dropped below threshold", desc: "Conversion has fallen to 6.2%, down from 14.8% last week. Immediate stock layout review recommended.", time: "2 min ago", actionText: "Apply Shelf Optimization" },
    { id: 2, type: "Action Required", priority: "High", icon: "🔥", title: "Summer Sale campaign budget 85% utilized", desc: "Promotional budget nearing threshold. Approve extension to sustain high weekend conversion.", time: "15 min ago", actionText: "Approve Budget Extension" },
    { id: 3, type: "Recommendation", priority: "High", icon: "⚡", title: "Peak traffic surge approaching in 30 minutes", desc: "5 PM footfall surge expected. Activate pre-configured Electronics flash promotion now.", time: "30 min ago", actionText: "Activate Flash Promo" },
  ];

  const activityTrend = [
    { time: "8AM", actions: 2 }, { time: "10AM", actions: 5 }, { time: "12PM", actions: 8 },
    { time: "2PM", actions: 4 }, { time: "4PM", actions: 9 }, { time: "6PM", actions: 6 },
  ];

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-8">
      {/* TITLE ONLY HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
        <h1 className="text-xl font-black text-white tracking-wide">Action Center</h1>
        
        <div className="flex items-center space-x-2">
          {["High Priority", "All Actions"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                filter === f ? "bg-amber-600 text-slate-950 border-amber-500" : "bg-[#0A1020] text-slate-400 border-[#1E293B] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* KPI SUMMARY CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">High Priority Actions</span>
          <h2 className="text-xl font-black text-rose-400 font-mono">3</h2>
          <span className="text-[10px] text-rose-400 font-bold">Requires Immediate Attention</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Promotional Alerts</span>
          <h2 className="text-xl font-black text-amber-400 font-mono">2</h2>
          <span className="text-[10px] text-amber-400 font-bold">Campaign Optimization</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">AI Recommendations</span>
          <h2 className="text-xl font-black text-emerald-400 font-mono">3</h2>
          <span className="text-[10px] text-emerald-400 font-bold">High Expected Lift</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">System Resolution Rate</span>
          <h2 className="text-xl font-black text-white font-mono">94%</h2>
          <span className="text-[10px] text-emerald-400 font-bold">Optimal Execution</span>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT FOR ACTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HIGH PRIORITY OPERATIONAL RECOMMENDATIONS */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top High-Priority Operational Recommendations</h3>
          <div className="space-y-3">
            {highPriorityActions.map((action) => (
              <div key={action.id} className="p-4 bg-[#0A1020] border border-rose-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>{action.icon}</span> {action.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    {action.priority}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">{action.desc}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
                  <span className="text-slate-500 text-[10px]">{action.time}</span>
                  <button
                    onClick={() => alert(`Triggered: ${action.actionText}`)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] transition"
                  >
                    {action.actionText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTION ACTIVITY TREND */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Operational Action Activity Today</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Area type="monotone" dataKey="actions" stroke="#D97706" strokeWidth={2} fill="url(#actGrad)" name="Actions Triggered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-300">
            Action Center automatically filters low-priority noise, focusing exclusively on top operational impact items.
          </div>
        </div>
      </div>
    </div>
  );
}
