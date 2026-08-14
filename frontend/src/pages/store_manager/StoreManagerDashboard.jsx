import React, { useState } from "react";
import AiVisionCamera from "../../components/vision/AiVisionCamera";

export default function StoreManagerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-[#060A14] text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-[#060A14] border-b border-[#1E293B] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1 bg-[#111827] border border-[#273449] rounded-lg text-xs font-bold text-slate-300 hover:text-white">← Back</button>
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-sm">C</div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">Consumer Attention Management System</h1>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">● STORE MODULES</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="font-mono text-xs text-slate-400">Mon, Aug 3 &nbsp;<span className="text-emerald-400 font-bold">06:34:51 PM</span></span>
            <div className="relative p-1.5 bg-[#111827] border border-[#273449] rounded-lg text-slate-300">
              🔔<span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">2</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">S</div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">Store Manager</span>
                <span className="text-[9px] text-slate-400">{user.email}</span>
              </div>
            </div>
            <button onClick={onLogout} className="px-3 py-1 bg-[#1E293B] hover:bg-rose-900/40 text-rose-400 text-xs font-bold rounded-lg transition">Logout</button>
          </div>
        </div>

        <nav className="flex items-center space-x-2 overflow-x-auto pt-3 pb-1 border-t border-[#1E293B]/50 mt-3 scrollbar-none">
          {["Dashboard", "Live Cameras", "Visitors", "Store Traffic", "Shelf Performance", "Product Interaction", "Heat Map", "Alerts", "Reports", "Settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20" : "bg-[#111827] text-slate-400 border border-[#273449] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-6 space-y-5 max-w-[1700px] w-full mx-auto">
        <div className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
          <span>Dashboard</span><span>/</span><span>Store Manager Portal</span><span>/</span>
          <span className="px-2 py-0.5 bg-[#172033] text-slate-200 rounded-md font-bold">{activeTab}</span>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🏪</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">Store Operational Intelligence</h2>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">32 / 32 Cameras Online</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "TODAY'S VISITORS", val: "1,450", sub: "+12.4%", color: "text-blue-400" },
            { label: "CURRENT VISITORS", val: "148 Live", sub: "Optimal Flow", color: "text-emerald-400" },
            { label: "PRODUCTS VIEWED", val: "34,120", sub: "+15.2%", color: "text-purple-400" },
            { label: "PRODUCTS PICKED", val: "12,337", sub: "+8.1%", color: "text-emerald-400" },
            { label: "CONVERSION RATE", val: "14.8%", sub: "+3.1% Lift", color: "text-amber-400" },
            { label: "ACTIVE CAMERAS", val: "32 / 32", sub: "100% Stream", color: "text-cyan-400" },
            { label: "ACTIVE ALERTS", val: "0 Alerts", sub: "All Clear", color: "text-emerald-400" },
            { label: "AVG DWELL TIME", val: "18.5 Min", sub: "+2.3%", color: "text-purple-400" }
          ].map((card, i) => (
            <div key={i} className="bg-[#111827] border border-[#273449] rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className="mt-2">
                <span className="text-sm font-extrabold text-white block">{card.val}</span>
                <span className={`text-[10px] font-bold block mt-0.5 ${card.color}`}>{card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AiVisionCamera cameraName="CAM-01 (Main Entrance)" showHeatmap={false} />
          <AiVisionCamera cameraName="CAM-04 (Bakery Endcap)" showHeatmap={true} />
        </div>
      </main>
    </div>
  );
}
