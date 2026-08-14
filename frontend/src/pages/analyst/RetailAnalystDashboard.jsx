import React, { useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function RetailAnalystDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const ragData = [
    { subject: "Visibility", score: 88 },
    { subject: "Attraction", score: 74 },
    { subject: "Engagement", score: 82 },
    { subject: "Conversion", score: 70 },
    { subject: "Interaction", score: 78 },
    { subject: "Dwell Score", score: 91 },
  ];

  return (
    <div className="min-h-screen bg-[#060A14] text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-[#060A14] border-b border-[#1E293B] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1 bg-[#111827] border border-[#273449] rounded-lg text-xs font-bold text-slate-300 hover:text-white">← Back</button>
            <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center font-bold text-white text-sm">C</div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">Consumer Attention Management System</h1>
            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-full">● ANALYST MODULES</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="font-mono text-xs text-slate-400">Mon, Aug 3 &nbsp;<span className="text-purple-400 font-bold">06:34:51 PM</span></span>
            <div className="relative p-1.5 bg-[#111827] border border-[#273449] rounded-lg text-slate-300">
              🔔<span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">5</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">R</div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">Retail Analyst</span>
                <span className="text-[9px] text-slate-400">{user.email}</span>
              </div>
            </div>
            <button onClick={onLogout} className="px-3 py-1 bg-[#1E293B] hover:bg-rose-900/40 text-rose-400 text-xs font-bold rounded-lg transition">Logout</button>
          </div>
        </div>

        <nav className="flex items-center space-x-2 overflow-x-auto pt-3 pb-1 border-t border-[#1E293B]/50 mt-3 scrollbar-none">
          {["Dashboard", "Consumer Behavior Intelligence", "Shopping Behavior Analysis", "Dwell Time Analysis", "Traffic Flow Analysis", "Zone Performance", "Product Analytics", "Category Performance", "AI Insights", "Reports", "Export Data", "Settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/20" : "bg-[#111827] text-slate-400 border border-[#273449] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-6 space-y-5 max-w-[1700px] w-full mx-auto">
        <div className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
          <span>Dashboard</span><span>/</span><span>Retail Analyst Portal</span><span>/</span>
          <span className="px-2 py-0.5 bg-[#172033] text-slate-200 rounded-md font-bold">{activeTab}</span>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📈</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">Consumer Behavior & Attention Analytics</h2>
          </div>
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-xl">AI Insights Engine Ready</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">CONSUMER JOURNEY & ATTENTION SPAN</h3>
            <div className="h-56 w-full flex items-center justify-center">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={ragData}>
                  <PolarGrid stroke="#273449" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={9} />
                  <PolarRadiusAxis stroke="#273449" fontSize={8} />
                  <Radar name="Attractiveness Score" dataKey="score" stroke="#A855F7" fill="#A855F7" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">ZONE DWELL TIME & TRAFFIC FLOW</h3>
            <div className="space-y-3">
              {[
                { zone: "Bakery A1", dwell: "4.8 Min Avg Dwell", score: "94% Score", col: "text-emerald-400" },
                { zone: "Dairy Section B", dwell: "3.2 Min Avg Dwell", score: "88% Score", col: "text-blue-400" },
                { zone: "Cosmetics Display D", dwell: "5.1 Min Avg Dwell", score: "91% Score", col: "text-purple-400" }
              ].map((z, idx) => (
                <div key={idx} className="bg-[#172033] border border-[#273449] rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{z.zone}</h4>
                    <p className="text-[10px] text-slate-400">{z.dwell}</p>
                  </div>
                  <span className={`text-xs font-bold font-mono ${z.col}`}>{z.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
