import React, { useState } from "react";

export default function StoreAlerts() {
  const [filter, setFilter] = useState("all");

  const alertsList = [
    {
      id: 1,
      title: "Camera CAM-04 Offline",
      desc: "Checkout billing camera stream interrupted.",
      type: "Critical",
      typeBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      location: "Checkout C2",
      time: "Just Now",
      status: "New",
      statusBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      icon: "📹",
      iconBg: "bg-rose-600/20 text-rose-400 border-rose-500/30"
    },
    {
      id: 2,
      title: "Crowd Surge Detected",
      desc: "Density index exceeded 90% in Aisle 4 corridor.",
      type: "Critical",
      typeBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      location: "Aisle 4",
      time: "10 min ago",
      status: "In Progress",
      statusBg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      icon: "👥",
      iconBg: "bg-rose-600/20 text-rose-400 border-rose-500/30"
    },
    {
      id: 3,
      title: "Low Stock Alert (Bakery A1)",
      desc: "Artisan Bread SKU level dropped to 6 units.",
      type: "High",
      typeBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      location: "Bakery A1",
      time: "25 min ago",
      status: "New",
      statusBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      icon: "📦",
      iconBg: "bg-amber-600/20 text-amber-400 border-amber-500/30"
    },
    {
      id: 4,
      title: "Dwell Threshold Anomaly",
      desc: "Shoppers avg dwell in Household zone dropped below baseline.",
      type: "High",
      typeBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      location: "Household F1",
      time: "2 hours ago",
      status: "Resolved",
      statusBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      icon: "⏱️",
      iconBg: "bg-amber-600/20 text-amber-400 border-amber-500/30"
    }
  ];

  const filteredAlerts = filter === "all"
    ? alertsList
    : alertsList.filter(a => a.type.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-5 font-sans text-xs">
      {/* 1. TOP METRICS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Total Critical Alerts</span>
            <h2 className="text-2xl font-black text-white font-mono">4</h2>
            <span className="text-[11px] text-rose-400 font-bold font-mono">Active Monitoring</span>
          </div>
          <div className="w-12 h-12 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center text-xl">🔔</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Critical Level</span>
            <h2 className="text-2xl font-black text-white font-mono">2</h2>
            <span className="text-[11px] text-rose-400 font-bold font-mono">Requires Attention</span>
          </div>
          <div className="w-12 h-12 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center text-xl">⚠️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">High Level</span>
            <h2 className="text-2xl font-black text-white font-mono">2</h2>
            <span className="text-[11px] text-amber-400 font-bold font-mono">Under Review</span>
          </div>
          <div className="w-12 h-12 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl">⚡</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Status Check</span>
            <h2 className="text-2xl font-black text-white font-mono">Normal</h2>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">Platform online</span>
          </div>
          <div className="w-12 h-12 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center text-xl">ℹ️</div>
        </div>
      </div>

      {/* 2. MAIN ALERTS CONTAINER */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-4">
          <div className="flex items-center space-x-2 text-xs">
            {["all", "critical", "high"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition uppercase ${
                  filter === lvl
                    ? "bg-blue-600 text-white"
                    : "bg-[#070C18] border border-[#1E293B] text-slate-400 hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* ALERTS LIST */}
        <div className="space-y-3">
          {filteredAlerts.map((a) => (
            <div key={a.id} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg ${a.iconBg}`}>{a.icon}</div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{a.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.desc} · Location: {a.location}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold ${a.typeBg}`}>{a.type}</span>
                <span className="text-[10px] text-slate-500">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
