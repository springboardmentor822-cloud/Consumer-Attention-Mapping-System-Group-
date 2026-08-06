import React, { useState } from "react";

export default function App() {
  const [role, setRole] = useState("StoreManager");
  const [token, setToken] = useState("demo-token");

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <h1 className="text-2xl font-bold mb-2 text-indigo-400">Attention Mapping Portal</h1>
          <p className="text-sm text-slate-400 mb-6">Enter your credentials to access telemetry dashboard.</p>
          <button 
            onClick={() => setToken("demo-token")}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition"
          >
            Sign In (Demo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-lg font-semibold tracking-wide">Consumer Attention Mapping System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-xs text-slate-400">Role View:</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-md text-sm px-3 py-1.5 focus:outline-none text-indigo-300"
          >
            <option value="SuperAdmin">SuperAdmin</option>
            <option value="StoreManager">StoreManager</option>
            <option value="RetailAnalyst">RetailAnalyst</option>
            <option value="MarketingManager">MarketingManager</option>
          </select>
          <button 
            onClick={() => setToken("")}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Active Streams</span>
            <p className="text-2xl font-bold text-white mt-1">4 / 4 Live</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Avg Dwell Time</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">4.2 min</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Congestion Index</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">14% Low</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Ad Gaze Conversions</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">68.4%</p>
          </div>
        </div>

        {/* Video Feed Placeholder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[380px] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-semibold text-slate-200">
              Live Telemetry Feed & Gaze Heatmap — <span className="text-indigo-400">{role} Access</span>
            </span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-mono">
              Backend Stream Active (Port 8000)
            </span>
          </div>

          <div className="flex-1 my-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden group">
            <img 
              src="http://localhost:8000/video_feed" 
              alt="Live Video Stream" 
              className="w-full h-80 object-cover rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23090d16'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3E[ OpenCV Stream Offline - Start FastAPI Backend on Port 8000 ]%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
