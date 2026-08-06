import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from "recharts";

export default function RetailAnalystOverviewPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeTab = section || "overview";

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "consumer-journey", label: "🗺️ Consumer Journey" },
    { id: "attention-analytics", label: "👁️ Attention Analytics" },
    { id: "customer-segmentation", label: "👥 Customer Segmentation" },
    { id: "shopping-behavior", label: "🛒 Shopping Behavior" },
    { id: "dwell-time-analysis", label: "⏱️ Dwell Time Analysis" },
    { id: "traffic-analysis", label: "🚶 Traffic Analysis" },
    { id: "product-performance", label: "📦 Product Performance" },
    { id: "category-performance", label: "🏷️ Category Performance" },
    { id: "ai-insights", label: "🤖 AI Insights" },
    { id: "reports", label: "📄 Reports" },
    { id: "data-export", label: "💾 Data Export" },
    { id: "alerts", label: "🔔 Alerts" },
    { id: "settings", label: "⚙️ Settings" }
  ];

  // SAMPLE DATASETS
  const behaviorTrend = [
    { day: "Mon", traffic: 38200, engagement: 62 },
    { day: "Tue", traffic: 41500, engagement: 68 },
    { day: "Wed", traffic: 43000, engagement: 71 },
    { day: "Thu", traffic: 46200, engagement: 74 },
    { day: "Fri", traffic: 52100, engagement: 81 },
    { day: "Sat", traffic: 63400, engagement: 88 }
  ];

  const segmentationData = [
    { name: "Loyal Shoppers", value: 42, color: "#10B981" },
    { name: "Occasional Buyers", value: 28, color: "#3B82F6" },
    { name: "Impulse Shoppers", value: 18, color: "#F59E0B" },
    { name: "New Visitors", value: 12, color: "#8B5CF6" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Visitors", val: "284,590", sub: "+18.4% vs last period", color: "text-blue-400" },
                { label: "Avg Dwell Time", val: "18.4 min", sub: "Gaze Fixation: 5.2s", color: "text-emerald-400" },
                { label: "Product Interaction Rate", val: "64.2%", sub: "+3.8% pickup lift", color: "text-purple-400" },
                { label: "Conversion Rate", val: "18.2%", sub: "Basket Size: $42.50", color: "text-cyan-400" },
                { label: "Attention Score", val: "88/100", sub: "High Fixation", color: "text-amber-400" },
                { label: "AI Business Insights", val: "14 Active", sub: "98% Confidence", color: "text-rose-400" }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{kpi.label}</span>
                  <h2 className={`text-lg font-black font-mono ${kpi.color}`}>{kpi.val}</h2>
                  <span className="text-[10px] text-slate-400 font-bold block">{kpi.sub}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">PERFORMANCE TREND GRAPHS</h3>
                  <span className="text-[10px] bg-[#1E293B] text-slate-300 px-2.5 py-1 rounded-lg font-mono">Last 7 Days</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={behaviorTrend}>
                      <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                      <Line type="monotone" dataKey="traffic" stroke="#06B6D4" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">CUSTOMER BEHAVIOR OVERVIEW</h3>
                </div>
                <div className="h-40 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={segmentationData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                        {segmentationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case "consumer-journey":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">🗺️ Consumer Journey Map & Route Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 block">Entry Points</span>
                <span className="text-cyan-400 font-bold text-base">Main Entrance (78%)</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 block">Common Route</span>
                <span className="text-emerald-400 font-bold text-base">Entrance → Bakery → Dairy → Checkout</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 block">Journey Completion Rate</span>
                <span className="text-amber-400 font-bold text-base">84.2%</span>
              </div>
            </div>
          </div>
        );

      case "attention-analytics":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">👁️ Attention Analytics & Fixation Heatmaps</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Avg Attention Time</span>
                <span className="text-lg font-bold text-white">5.8 seconds</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">High-Attention Shelf</span>
                <span className="text-lg font-bold text-emerald-400">Eye-Level Endcap A</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Low-Attention Shelf</span>
                <span className="text-lg font-bold text-rose-400">Bottom Shelf C</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Gaze Direction Score</span>
                <span className="text-lg font-bold text-cyan-400">92/100</span>
              </div>
            </div>
          </div>
        );

      case "customer-segmentation":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">👥 Behavioral Customer Segmentation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {segmentationData.map((seg, idx) => (
                <div key={idx} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{seg.name}</span>
                    <span className="text-slate-400 text-[10px]">Avg Purchase Value: $58.20</span>
                  </div>
                  <span className="text-base font-bold" style={{ color: seg.color }}>{seg.value}% Share</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "shopping-behavior":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">🛒 Shopping Behavior & Product Interaction</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Product Pick-Up Rate</span>
                <span className="text-xl font-bold text-emerald-400">68.4%</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Product Return Rate</span>
                <span className="text-xl font-bold text-rose-400">12.1%</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Avg Browsing Duration</span>
                <span className="text-xl font-bold text-cyan-400">14.2 min</span>
              </div>
            </div>
          </div>
        );

      case "dwell-time-analysis":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">⏱️ Dwell Time & Zone Retention Heatmap</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Longest Dwell Zone</span>
                <span className="text-emerald-400 font-bold text-base">Bakery (24.2 min)</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Shortest Dwell Zone</span>
                <span className="text-rose-400 font-bold text-base">Aisle 3 (2.1 min)</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Peak Dwell Period</span>
                <span className="text-amber-400 font-bold text-base">05:00 PM - 07:00 PM</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Overall Dwell Score</span>
                <span className="text-cyan-400 font-bold text-base">89/100</span>
              </div>
            </div>
          </div>
        );

      case "traffic-analysis":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">🚶 Store Traffic & Footfall Patterns</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Hourly Footfall Peak</span>
                <span className="text-cyan-400 font-bold text-base">1,240 visitors / hr</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Busiest Day</span>
                <span className="text-emerald-400 font-bold text-base">Saturday (63.4K)</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl">
                <span className="text-slate-400 block">Zone-wise Bottleneck</span>
                <span className="text-amber-400 font-bold text-base">Central Aisle 4</span>
              </div>
            </div>
          </div>
        );

      case "product-performance":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">📦 Product Performance Analytics</h2>
            <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-[#1E293B] pb-2 font-bold text-slate-300">
                <span>Product Name</span>
                <span>Visibility Score</span>
                <span>Attention Score</span>
                <span>Pick-up Rate</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Artisan Fresh Bread</span>
                <span className="text-emerald-400">96/100</span>
                <span className="text-cyan-400">92/100</span>
                <span className="text-amber-400">84%</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Organic Whole Milk</span>
                <span className="text-emerald-400">91/100</span>
                <span className="text-cyan-400">88/100</span>
                <span className="text-amber-400">79%</span>
              </div>
            </div>
          </div>
        );

      case "category-performance":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">🏷️ Category Performance Benchmarks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 block">Best-Performing Category</span>
                <span className="text-emerald-400 font-bold text-base">Fresh Bakery (+38% Sales Contribution)</span>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 block">Least-Performing Category</span>
                <span className="text-rose-400 font-bold text-base">Household Cleaners (Low Conversion)</span>
              </div>
            </div>
          </div>
        );

      case "ai-insights":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">🤖 AI Business Insights & Demand Forecasts</h2>
            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-cyan-400 font-bold block">Predictive Opportunity: Shelf Optimization</span>
                <p className="text-slate-400 text-[11px]">Moving Organic Dairy endcap 2 meters closer to Bakery increases dual-pickup conversion by +18.4%.</p>
                <span className="text-emerald-400 font-bold block text-[10px]">AI Confidence Score: 98%</span>
              </div>
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">📄 Analytical Reports Generator</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              {["Daily Analytics Report", "Weekly Performance Summary", "Consumer Behavior Report", "Attention Analysis Report", "Product Performance Report", "Category Benchmarks"].map((rep, idx) => (
                <div key={idx} className="p-3 bg-[#070C18] border border-[#1E293B] hover:border-cyan-500 transition rounded-xl cursor-pointer">
                  <span className="text-white font-bold block">{rep}</span>
                  <span className="text-[10px] text-slate-400">Ready to Export (PDF/Excel)</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "data-export":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">💾 Raw Data & Analytics Export</h2>
            <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-3 text-xs font-mono">
              <span className="text-slate-300 block">Select File Format:</span>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold rounded-lg">CSV Format</button>
                <button className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-lg">Excel (.xlsx)</button>
                <button className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-lg">JSON Structure</button>
              </div>
            </div>
          </div>
        );

      case "alerts":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">🔔 Business Performance & System Alerts</h2>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex justify-between">
                <span>Declining Conversion Rate in Household Aisle</span>
                <span className="font-bold">HIGH PRIORITY</span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex justify-between">
                <span>Low Customer Engagement on Shelf D</span>
                <span className="font-bold">MEDIUM PRIORITY</span>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl space-y-4 text-xs font-mono">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">⚙️ Retail Analyst Portal Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2">
                <span className="text-white font-bold block">User Profile & Security</span>
                <span className="text-slate-400 block">Email: analyst@cams-retail.com</span>
                <button className="px-3 py-1 bg-[#1E293B] text-cyan-400 rounded-lg">Change Password</button>
              </div>
              <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2">
                <span className="text-white font-bold block">Dashboard Customization</span>
                <span className="text-slate-400 block">Default Range: Last 7 Days</span>
                <button className="px-3 py-1 bg-[#1E293B] text-cyan-400 rounded-lg">Configure Metrics</button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 font-sans p-6 space-y-6">
      {/* 1. FIXED HEADER */}
      <div className="flex flex-wrap justify-between items-center bg-[#0F172A] border border-[#1E293B] p-3 rounded-2xl gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate("/retail-analyst/overview")}
            className="px-3 py-1 bg-[#1E293B] hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-300"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm text-white">Consumer Attention Mapping System</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-bold uppercase">
              RETAIL ANALYST PORTAL
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-black flex items-center justify-center text-xs">
              RA
            </div>
            <div>
              <span className="font-bold text-white block leading-none">Retail Analyst</span>
              <span className="text-[9px] text-slate-400 block leading-none mt-0.5">Enterprise BI</span>
            </div>
          </div>

          <button 
            onClick={() => navigate("/login")}
            className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition rounded-lg text-xs font-bold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION MODULE TABS */}
      <div className="flex space-x-2 border-b border-[#1E293B] pb-3 overflow-x-auto text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(`/retail-analyst/${tab.id}`)}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/20 font-extrabold"
                : "bg-[#0F172A] border border-[#1E293B] hover:border-slate-600 text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. DYNAMIC PAGE CONTENT */}
      {renderContent()}
    </div>
  );
}
