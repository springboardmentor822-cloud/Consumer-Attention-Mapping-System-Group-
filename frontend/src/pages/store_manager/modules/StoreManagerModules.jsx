import React, { useState } from "react";
import AiVisionCamera from "../../../components/vision/AiVisionCamera";
import ComponentErrorBoundary from "../../../components/ComponentErrorBoundary";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const ModuleHeader = ({ icon, title, subtitle, statusText }) => (
  <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 font-sans">
    <div>
      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
    </div>
    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">
      ● {statusText || "4 / 4 Cameras Online"}
    </span>
  </div>
);

// CONTINUOUS THERMAL ARCHITECTURAL FLOOR PLAN MODEL
function ThermalArchitecturalFloorPlan() {
  const departments = [
    { icon: "🥐", name: "Bakery", count: 156, heat: "92%", dwell: "22.4 min", x: "12.5%", y: "20%", heatColor: "radial-gradient(circle, rgba(239, 68, 68, 0.95) 0%, rgba(249, 115, 22, 0.8) 35%, rgba(234, 179, 8, 0.6) 65%, rgba(34, 197, 94, 0.25) 85%, transparent 100%)", size: "w-80 h-80" },
    { icon: "🥛", name: "Dairy", count: 98, heat: "72%", dwell: "16.2 min", x: "37.5%", y: "20%", heatColor: "radial-gradient(circle, rgba(234, 179, 8, 0.85) 0%, rgba(34, 197, 94, 0.65) 45%, rgba(59, 130, 246, 0.3) 75%, transparent 100%)", size: "w-64 h-64" },
    { icon: "🍿", name: "Snacks", count: 124, heat: "68%", dwell: "15.8 min", x: "62.5%", y: "20%", heatColor: "radial-gradient(circle, rgba(249, 115, 22, 0.85) 0%, rgba(234, 179, 8, 0.7) 40%, rgba(34, 197, 94, 0.35) 70%, transparent 100%)", size: "w-72 h-72" },
    { icon: "🧪", name: "Household", count: 76, heat: "45%", dwell: "12.1 min", x: "87.5%", y: "20%", heatColor: "radial-gradient(circle, rgba(59, 130, 246, 0.75) 0%, rgba(34, 197, 94, 0.45) 50%, transparent 100%)", size: "w-60 h-60" },

    { icon: "🍎", name: "Fruits & Veg", count: 188, heat: "85%", dwell: "20.3 min", x: "12.5%", y: "50%", heatColor: "radial-gradient(circle, rgba(239, 68, 68, 0.9) 0%, rgba(249, 115, 22, 0.75) 40%, rgba(234, 179, 8, 0.55) 70%, transparent 100%)", size: "w-80 h-80" },
    { icon: "🍾", name: "Beverages", count: 132, heat: "75%", dwell: "17.6 min", x: "37.5%", y: "50%", heatColor: "radial-gradient(circle, rgba(234, 179, 8, 0.85) 0%, rgba(34, 197, 94, 0.5) 50%, transparent 100%)", size: "w-72 h-72" },
    { icon: "🧊", name: "Frozen Foods", count: 84, heat: "50%", dwell: "13.4 min", x: "62.5%", y: "50%", heatColor: "radial-gradient(circle, rgba(34, 197, 94, 0.75) 0%, rgba(59, 130, 246, 0.4) 60%, transparent 100%)", size: "w-64 h-64" },
    { icon: "🧴", name: "Personal Care", count: 72, heat: "42%", dwell: "11.8 min", x: "87.5%", y: "50%", heatColor: "radial-gradient(circle, rgba(59, 130, 246, 0.7) 0%, rgba(34, 197, 94, 0.35) 60%, transparent 100%)", size: "w-56 h-56" },

    { icon: "🚪", name: "ENTRANCE", count: 320, heat: "88%", dwell: "10.2 min", x: "12.5%", y: "80%", heatColor: "radial-gradient(circle, rgba(249, 115, 22, 0.9) 0%, rgba(234, 179, 8, 0.7) 45%, transparent 100%)", size: "w-72 h-72" },
    { icon: "📢", name: "Promotional Zone", count: 210, heat: "95%", dwell: "25.6 min", x: "37.5%", y: "80%", heatColor: "radial-gradient(circle, rgba(239, 68, 68, 0.98) 0%, rgba(249, 115, 22, 0.85) 40%, rgba(234, 179, 8, 0.6) 70%, transparent 100%)", size: "w-80 h-80" },
    { icon: "🛒", name: "Checkout Area", count: 168, heat: "90%", dwell: "23.1 min", x: "62.5%", y: "80%", heatColor: "radial-gradient(circle, rgba(239, 68, 68, 0.95) 0%, rgba(249, 115, 22, 0.8) 40%, rgba(234, 179, 8, 0.55) 70%, transparent 100%)", size: "w-80 h-80" },
    { icon: "🚪", name: "EXIT", count: 305, heat: "80%", dwell: "9.8 min", x: "87.5%", y: "80%", heatColor: "radial-gradient(circle, rgba(249, 115, 22, 0.85) 0%, rgba(234, 179, 8, 0.65) 45%, transparent 100%)", size: "w-72 h-72" }
  ];

  return (
    <div className="relative w-full rounded-2xl bg-[#031124] border-2 border-[#1E293B] p-6 overflow-hidden shadow-2xl font-sans min-h-[520px]">
      <div className="absolute inset-0 pointer-events-none opacity-90" style={{ background: "radial-gradient(circle at 50% 50%, rgba(14, 116, 144, 0.45) 0%, rgba(15, 23, 42, 0.9) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none opacity-40 border border-cyan-500/40 rounded-2xl m-3">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="blueprint-grid-dense" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blueprint-grid-dense)" />
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {departments.map((dept, idx) => (
          <div key={idx} className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-90 transition-all ${dept.size}`} style={{ left: dept.x, top: dept.y, background: dept.heatColor }} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 py-2">
        {departments.map((dept, idx) => (
          <div key={idx} className="relative flex items-center justify-center min-h-[130px]">
            <div className="w-full bg-[#0F172A]/85 border border-slate-700/80 hover:border-amber-400 rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-all transform hover:scale-[1.03]">
              <div className="flex items-center space-x-2">
                <span className="text-base">{dept.icon}</span>
                <h5 className="text-xs font-black text-white tracking-wide">{dept.name}</h5>
              </div>
              <div className="mt-3 flex justify-between items-center text-xs font-mono">
                <div className="flex items-center space-x-1 text-slate-300">
                  <span>👤</span>
                  <span className="font-extrabold text-white">{dept.count}</span>
                </div>
                <div className="flex items-center space-x-1 text-amber-400">
                  <span>🔥</span>
                  <span className="font-extrabold">{dept.heat}</span>
                </div>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-mono text-left">
                Dwell: <span className="text-slate-200 font-bold">{dept.dwell}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 1. STORE DASHBOARD OVERVIEW PAGE
export function StoreDashboardOverviewPage({ onNavigateTab }) {
  const activeData = {
    kpis: {
      todaysVisitors: "1,450", currentVisitors: "148 Live", productsViewed: "34,120",
      productsPicked: "12,337", conversionRate: "14.8%", activeCameras: "4 / 4",
      activeAlerts: "0 Active", avgDwellTime: "18.5 Min"
    },
    customersOverTime: [
      { time: "9 AM", customers: 85 }, { time: "11 AM", customers: 210 },
      { time: "1 PM", customers: 340 }, { time: "3 PM", customers: 290 },
      { time: "5 PM", customers: 480 }, { time: "7 PM", customers: 310 }
    ],
    customersByZone: [
      { zone: "Entrance", customers: 1450 }, { zone: "Grocery", customers: 680 },
      { zone: "Produce", customers: 540 }, { zone: "Dairy", customers: 590 },
      { zone: "Bakery", customers: 640 }, { zone: "Promotions", customers: 480 },
      { zone: "Checkout", customers: 1050 }
    ],
    customersByHour: [
      { hour: "8 AM", count: 50 }, { hour: "10 AM", count: 140 },
      { hour: "12 PM", count: 320 }, { hour: "2 PM", count: 280 },
      { hour: "4 PM", count: 450 }, { hour: "6 PM", count: 380 }, { hour: "8 PM", count: 130 }
    ],
    zoneAnalysis: [
      { zone: "Bakery A1", score: 94, dwell: "4.8m" },
      { zone: "Dairy B2", score: 86, dwell: "3.8m" },
      { zone: "Produce C1", score: 81, dwell: "3.3m" },
      { zone: "Promotions D2", score: 77, dwell: "3.0m" }
    ],
    shelfPerformance: [
      { shelf: "Bakery Endcap A1", score: 94, pickups: 1240, dwell: "4.8 Min" },
      { shelf: "Dairy Cooler B2", score: 86, pickups: 980, dwell: "3.8 Min" },
      { shelf: "Snack Rack D2", score: 81, pickups: 810, dwell: "3.0 Min" },
      { shelf: "Produce Bay C1", score: 77, pickups: 690, dwell: "3.3 Min" }
    ],
    productInteractions: [
      { name: "Products Viewed", value: 34120, color: "#3B82F6", percent: "52.8%" },
      { name: "Products Picked", value: 12337, color: "#10B981", percent: "19.1%" },
      { name: "Products Compared", value: 5120, color: "#F59E0B", percent: "7.9%" },
      { name: "Products Returned", value: 2167, color: "#EF4444", percent: "3.3%" },
      { name: "Products Purchased", value: 5050, color: "#A855F7", percent: "16.9%" }
    ],
    topPickedProducts: [
      { name: "Artisan Whole Bread", category: "Bakery", pickups: "1,240", trend: "+12.1%", conv: "69.8%" },
      { name: "Organic Almond Milk", category: "Dairy", pickups: "980", trend: "+8.3%", conv: "62.4%" },
      { name: "Dark Chocolate Bar", category: "Snacks", pickups: "810", trend: "+4.0%", conv: "55.1%" }
    ],
    recentActivities: [
      { id: 1, event: "ByteTrack Re-Identification Sync", location: "Main Entrance", time: "16:34:12", sev: "Info" },
      { id: 2, event: "Shelf Restock Completed", location: "Dairy Section", time: "14:30:00", sev: "Info" },
      { id: 3, event: "Checkout Queue Resolved", location: "Checkout Matrix", time: "11:15:44", sev: "Warning" }
    ]
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>🏪</span> Store Manager Operational Dashboard
          </h2>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">
          ● Live Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Today's Visitors", val: activeData.kpis.todaysVisitors, sub: "+12.4%", col: "text-emerald-400" },
          { label: "Current Visitors", val: activeData.kpis.currentVisitors, sub: "Optimal Flow", col: "text-emerald-400" },
          { label: "Products Viewed", val: activeData.kpis.productsViewed, sub: "+15.2%", col: "text-blue-400" },
          { label: "Products Picked", val: activeData.kpis.productsPicked, sub: "+8.1%", col: "text-purple-400" },
          { label: "Conversion Rate", val: activeData.kpis.conversionRate, sub: "+3.1% Lift", col: "text-emerald-400" },
          { label: "Active Cameras", val: activeData.kpis.activeCameras, sub: "100% Online", col: "text-emerald-400" },
          { label: "Active Alerts", val: activeData.kpis.activeAlerts, sub: "All Clear", col: "text-emerald-400" },
          { label: "Avg Dwell Time", val: activeData.kpis.avgDwellTime, sub: "+2.3%", col: "text-purple-400" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#273449] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase block truncate tracking-wider">{kpi.label}</span>
            <h4 className="text-sm font-extrabold text-white mt-1.5 font-mono">{kpi.val}</h4>
            <span className={`text-[9px] font-bold ${kpi.col} block mt-1`}>{kpi.sub}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <span>📹</span> Live Camera Preview Grid
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
            4/4 Active Streams
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AiVisionCamera cameraName="CAM-01 (CHECKOUT #1)" videoSrc="/videos/checkout1.mp4" />
          <AiVisionCamera cameraName="CAM-02 (CHECKOUT #2)" videoSrc="/videos/checkout2.mp4" />
          <AiVisionCamera cameraName="CAM-03 (SCALE & AISLE)" videoSrc="/videos/aisle1.mp4" />
          <AiVisionCamera cameraName="CAM-04 (RETAIL STORE INTERIOR)" videoSrc="/videos/store1.mp4" />
        </div>
      </div>

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">STORE HEAT MAP OVERVIEW</h3>
            <p className="text-[10px] text-slate-400">AI-generated spatial customer attention density &amp; movement flow</p>
          </div>
          <div className="flex items-center space-x-1 text-[9px] font-mono">
            <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded font-bold">Red: High</span>
            <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded font-bold">Orange</span>
            <span className="px-1.5 py-0.5 bg-yellow-400 text-black rounded font-bold">Yellow</span>
            <span className="px-1.5 py-0.5 bg-emerald-500 text-black rounded font-bold">Green</span>
            <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded font-bold">Blue: Low</span>
          </div>
        </div>

        <ThermalArchitecturalFloorPlan />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customers Over Time</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeData.customersOverTime}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customers By Zone</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData.customersByZone}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
                <Bar dataKey="customers" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customers By Hour</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeData.customersByHour}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customers By Zone Analysis</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData.zoneAnalysis}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
                <Bar dataKey="score" fill="#A855F7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Shelf Performance Ranking</h3>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData.shelfPerformance} layout="vertical">
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <YAxis type="category" dataKey="shelf" stroke="#64748B" fontSize={10} width={110} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
                <Bar dataKey="score" fill="#F59E0B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Interaction Analysis</h3>
          <div className="h-44 w-full flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activeData.productInteractions} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  {activeData.productInteractions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {activeData.productInteractions.map((item, idx) => (
              <div key={idx} className="flex justify-between p-1 bg-[#172033] rounded-lg">
                <span className="text-slate-300 font-bold">{item.name}:</span>
                <span className="text-white font-mono font-bold">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Picked Products</h3>
          <div className="space-y-2 text-xs">
            {activeData.topPickedProducts.map((prod, i) => (
              <div key={i} className="p-3 bg-[#172033] rounded-xl border border-[#273449] flex justify-between items-center">
                <div>
                  <span className="text-white font-bold block">{i + 1}. {prod.name}</span>
                  <span className="text-[10px] text-slate-400">{prod.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-mono font-bold block">{prod.pickups} Picked</span>
                  <span className="text-[10px] text-purple-400 font-bold">{prod.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Store Activities Timeline</h3>
          <div className="space-y-2 text-xs">
            {activeData.recentActivities.map((act) => (
              <div key={act.id} className="p-3 bg-[#172033] rounded-xl border border-[#273449] flex justify-between items-center">
                <div>
                  <span className="text-white font-bold block">{act.event}</span>
                  <span className="text-[10px] text-slate-400">{act.location}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>⚡</span> Quick Access Navigation Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {[
            { label: "Live Cameras", tab: "Live Cameras", icon: "📹" },
            { label: "Visitors", tab: "Visitors", icon: "🚶" },
            { label: "Store Traffic", tab: "Store Traffic", icon: "🚥" },
            { label: "Shelf Perf.", tab: "Shelf Performance", icon: "🧺" },
            { label: "Product Int.", tab: "Product Interaction", icon: "📦" },
            { label: "Heat Map", tab: "Heat Map", icon: "🗺️" },
            { label: "Alerts", tab: "Alerts", icon: "🔔" },
            { label: "Reports", tab: "Reports", icon: "📄" },
            { label: "Settings", tab: "Settings", icon: "⚙️" },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigateTab && onNavigateTab(item.tab)}
              className="p-3 bg-[#172033] border border-[#273449] hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center space-y-1 transition text-slate-300 hover:text-white group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[10px] font-bold text-center truncate w-full">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. LIVE CAMERAS PAGE
export function StoreLiveCamerasPage() {
  const [selectedCam, setSelectedCam] = useState(null);

  const cameras = [
    { id: "CAM-01", name: "Checkout #1 High-Angle", location: "Checkout Matrix Zone 1", status: "Online", shoppers: 3, trackingId: "ID-101", video: "/videos/checkout1.mp4", fps: "30 FPS", latency: "12ms" },
    { id: "CAM-02", name: "Checkout #2 Direct Feed", location: "Checkout Matrix Zone 2", status: "Online", shoppers: 2, trackingId: "ID-102", video: "/videos/checkout2.mp4", fps: "30 FPS", latency: "14ms" },
    { id: "CAM-03", name: "Supermarket Scale & Produce Aisle", location: "Produce & Scale Area", status: "Online", shoppers: 4, trackingId: "ID-103", video: "/videos/aisle1.mp4", fps: "28 FPS", latency: "11ms" },
    { id: "CAM-04", name: "Main Store Floor High-Angle", location: "Central Merchandise Floor", status: "Online", shoppers: 6, trackingId: "ID-104", video: "/videos/store1.mp4", fps: "30 FPS", latency: "10ms" }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="📹" title="Live AI Camera Monitoring Center" subtitle="Real-time multi-camera CCTV array featuring YOLOv8 detection & ByteTrack ID assignment" />

      {/* DETAILED MODAL DRILLDOWN FOR SELECTED CAMERA */}
      {selectedCam && (
        <div className="bg-[#111827] border border-emerald-500/50 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#273449] pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>📹</span> {selectedCam.name} ({selectedCam.id}) - Expanded Analytics
              </h3>
              <p className="text-xs text-slate-400">Location: {selectedCam.location}</p>
            </div>
            <button onClick={() => setSelectedCam(null)} className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-500/20">
              ✕ Close Detail View
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <AiVisionCamera cameraName={`${selectedCam.name} (LIVE HIGH-RES STREAM)`} videoSrc={selectedCam.video} />
            </div>

            <div className="bg-[#172033] border border-[#273449] rounded-xl p-4 space-y-3 text-xs">
              <span className="font-extrabold text-emerald-400 block uppercase">Real-Time Telemetry Breakdown</span>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-[#060A14] rounded-lg">
                  <span className="text-slate-400">Operational Status:</span>
                  <span className="text-emerald-400 font-bold">{selectedCam.status}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#060A14] rounded-lg">
                  <span className="text-slate-400">Active Shoppers:</span>
                  <span className="text-white font-bold font-mono">{selectedCam.shoppers} Detected</span>
                </div>
                <div className="flex justify-between p-2 bg-[#060A14] rounded-lg">
                  <span className="text-slate-400">Stream Performance:</span>
                  <span className="text-blue-400 font-bold font-mono">{selectedCam.fps} | {selectedCam.latency}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#060A14] rounded-lg">
                  <span className="text-slate-400">ByteTrack ID Offset:</span>
                  <span className="text-purple-400 font-bold font-mono">{selectedCam.trackingId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cameras.map((cam) => (
          <div key={cam.id} className="space-y-2">
            <AiVisionCamera cameraName={`${cam.id} - ${cam.name}`} videoSrc={cam.video} />
            <div className="bg-[#111827] border border-[#273449] rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-white font-bold block">{cam.location}</span>
                <span className="text-[10px] text-slate-400 font-mono">Shoppers: {cam.shoppers} | ID: {cam.trackingId}</span>
              </div>
              <button
                onClick={() => setSelectedCam(cam)}
                className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] rounded-lg hover:bg-emerald-500/20 transition"
              >
                Inspect Stream 🔍
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. VISITORS ANALYTICS PAGE
export function StoreVisitorsPage() {
  const [selectedRange, setSelectedRange] = useState("Today");

  const visitorTrend = [
    { time: "8 AM", total: 120, repeat: 35, newCust: 85 },
    { time: "10 AM", total: 340, repeat: 90, newCust: 250 },
    { time: "12 PM", total: 680, repeat: 210, newCust: 470 },
    { time: "2 PM", total: 540, repeat: 180, newCust: 360 },
    { time: "4 PM", total: 890, repeat: 290, newCust: 600 },
    { time: "6 PM", total: 720, repeat: 240, newCust: 480 },
    { time: "8 PM", total: 280, repeat: 80, newCust: 200 }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="🚶" title="Visitor Footfall & Behavioral Analytics" subtitle="Analyze customer entry/exit rates, peak hours, and repeat shopper ratios" />

      <div className="flex justify-between items-center bg-[#111827] border border-[#273449] rounded-2xl p-4">
        <span className="text-xs font-bold text-white uppercase">Date Filter:</span>
        <div className="flex space-x-1 bg-[#060A14] border border-[#273449] p-1 rounded-xl">
          {["Today", "Yesterday", "Last 7 Days", "Last 30 Days"].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${selectedRange === r ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Footfall</span>
          <h4 className="text-lg font-extrabold text-white mt-1">3,570</h4>
          <span className="text-[10px] text-emerald-400 font-bold">+14.2% vs prev period</span>
        </div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Repeat Shoppers</span>
          <h4 className="text-lg font-extrabold text-emerald-400 mt-1">1,125 (31.5%)</h4>
          <span className="text-[10px] text-emerald-400 font-bold">High Loyalty</span>
        </div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Peak Hour</span>
          <h4 className="text-lg font-extrabold text-blue-400 mt-1">4 PM - 5 PM</h4>
          <span className="text-[10px] text-blue-400 font-bold">890 Shoppers</span>
        </div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Average Dwell Time</span>
          <h4 className="text-lg font-extrabold text-purple-400 mt-1">18.5 Minutes</h4>
          <span className="text-[10px] text-purple-400 font-bold">+2.3 Min Increase</span>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitor Volume Trends (New vs. Repeat)</h3>
        <div className="h-64 w-full">
          <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visitorTrend}>
              <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="newCust" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
              <Area type="monotone" dataKey="repeat" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
</ComponentErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// 4. STORE TRAFFIC PAGE
export function StoreTrafficPage() {
  const trafficZones = [
    { zone: "Entrance Corridor", density: "Heavy (320 / hr)", flowScore: "88%", congestion: "Optimal Flow" },
    { zone: "Bakery Aisle A", density: "High (280 / hr)", flowScore: "94%", congestion: "High Density" },
    { zone: "Produce & Scale Area", density: "Moderate (210 / hr)", flowScore: "81%", congestion: "Normal Flow" },
    { zone: "Dairy Cooler Section", density: "Moderate (190 / hr)", flowScore: "76%", congestion: "Normal Flow" },
    { zone: "Checkout Counter Matrix", density: "Congested (310 / hr)", flowScore: "91%", congestion: "Action Required" }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="🚥" title="Store Traffic & Movement Flow Analysis" subtitle="Analyze movement vectors, aisle bottlenecks, and zone occupancy rates" />

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Zone Congestion & Flow Telemetry</h3>
        <div className="space-y-3">
          {trafficZones.map((z, idx) => (
            <div key={idx} className="p-4 bg-[#172033] border border-[#273449] rounded-xl flex flex-wrap justify-between items-center gap-3">
              <div>
                <span className="font-extrabold text-white text-xs block">{z.zone}</span>
                <span className="text-[10px] text-slate-400">Flow Efficiency Score: {z.flowScore}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="text-slate-300 font-bold">{z.density}</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  z.congestion.includes("Action") ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {z.congestion}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5. SHELF PERFORMANCE PAGE
export function StoreShelfPerformancePage() {
  const shelves = [
    { name: "Bakery Endcap A1", score: 94, pickups: "1,240", dwell: "4.8 Min", conversion: "69.8%", status: "Optimal" },
    { name: "Dairy Cooler B2", score: 86, pickups: "980", dwell: "3.8 Min", conversion: "62.4%", status: "Optimal" },
    { name: "Snack Rack D2", score: 81, pickups: "810", dwell: "3.0 Min", conversion: "55.1%", status: "Normal" },
    { name: "Produce Bay C1", score: 77, pickups: "690", dwell: "3.3 Min", conversion: "51.2%", status: "Needs Refresh" }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="🧺" title="Shelf Performance & Attention Analytics" subtitle="Gaze fixations, shelf attention scores, and product interaction rates" />

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Shelves Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#273449] text-slate-400 font-bold">
                <th className="pb-3">Shelf Identification</th>
                <th className="pb-3">Attention Score</th>
                <th className="pb-3">Total Pickups</th>
                <th className="pb-3">Avg Dwell</th>
                <th className="pb-3">Conversion Rate</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#273449]">
              {shelves.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#172033]/50 transition">
                  <td className="py-3.5 font-extrabold text-white">{s.name}</td>
                  <td className="py-3.5 text-emerald-400 font-mono font-bold">{s.score} / 100</td>
                  <td className="py-3.5 text-slate-200 font-mono">{s.pickups}</td>
                  <td className="py-3.5 text-slate-300 font-mono">{s.dwell}</td>
                  <td className="py-3.5 text-blue-400 font-mono font-bold">{s.conversion}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 6. PRODUCT INTERACTION PAGE
export function StoreProductInteractionPage() {
  const interactions = [
    { name: "Products Viewed", value: 34120, color: "#3B82F6", percent: "52.8%" },
    { name: "Products Picked", value: 12337, color: "#10B981", percent: "19.1%" },
    { name: "Products Compared", value: 5120, color: "#F59E0B", percent: "7.9%" },
    { name: "Products Returned", value: 2167, color: "#EF4444", percent: "3.3%" },
    { name: "Products Purchased", value: 5050, color: "#A855F7", percent: "16.9%" }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="📦" title="Product Interaction Telemetry & Conversion" subtitle="Track product views, physical pickups, comparisons, and purchasing conversion rates" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interaction Category Proportion</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={interactions} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {interactions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Detailed Telemetry Summary</h3>
          <div className="space-y-2.5 pt-2">
            {interactions.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#172033] border border-[#273449] rounded-xl flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-white font-bold">{item.name}</span>
                </div>
                <div className="space-x-3 font-mono">
                  <span className="text-slate-400">{item.percent}</span>
                  <span className="text-emerald-400 font-extrabold">{item.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. HEAT MAP PAGE
export function StoreHeatMapPage() {
  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="🗺️" title="Store Heat Map Operational Portal" subtitle="Real-time visual representation of customer movement and visual attention on floor plans" />
      <ThermalArchitecturalFloorPlan />
    </div>
  );
}

// 8. ALERTS PAGE
export function StoreAlertsPage() {
  const alerts = [
    { id: 1, title: "Checkout Queue Threshold Exceeded", zone: "Checkout Matrix Zone 1", sev: "Critical", time: "10 mins ago", action: "Open Counter 4" },
    { id: 2, title: "Low Shelf Attention Index", zone: "Household Shelf D2", sev: "Warning", time: "25 mins ago", action: "Review Merchandising" },
    { id: 3, title: "CAM-03 Video Stream Sync Re-established", zone: "Produce & Scale Area", sev: "Info", time: "1 hour ago", action: "Resolved" }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="🔔" title="AI Operational Alerts & System Priority Log" subtitle="Real-time automated alerts requiring store manager intervention" />

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="p-4 bg-[#111827] border border-[#273449] rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-extrabold text-white">{a.title}</h4>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  a.sev === "Critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}>
                  {a.sev}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Location: {a.zone} • {a.time}</span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-300 font-bold font-mono">Action: {a.action}</span>
              <button className="px-3 py-1 bg-emerald-500 text-black font-extrabold rounded-lg hover:bg-emerald-400 transition text-[10px]">
                Acknowledge Alert
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 9. REPORTS PAGE
export function StoreReportsPage() {
  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="📄" title="Store Analytical Reports Generator" subtitle="Export analytical intelligence in PDF, Excel, and CSV formats" />

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Available Export Packages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Shift Footfall & Conversion Report", format: "PDF Package" },
            { title: "Shelf Interaction & Pickups Analysis", format: "Excel Spreadsheet" },
            { title: "Full Raw CCTV Telemetry Log", format: "CSV Export" }
          ].map((r, i) => (
            <div key={i} className="p-4 bg-[#172033] border border-[#273449] rounded-xl space-y-3">
              <span className="font-extrabold text-white text-xs block">{r.title}</span>
              <span className="text-[10px] text-emerald-400 font-mono block">{r.format}</span>
              <button className="w-full py-2 bg-emerald-500 text-black font-extrabold text-xs rounded-lg hover:bg-emerald-400 transition">
                Download Report
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 10. ACTIVITIES PAGE
export function StoreActivitiesPage() {
  const activities = [
    { time: "16:34:12", event: "ByteTrack Persistent ID Re-Identified", detail: "Shopper ID-102 re-identified near Main Entrance" },
    { time: "14:30:00", event: "Restocked Bakery A1 Shelf", detail: "Batch #849 replenishment verified by AI vision" },
    { time: "11:15:44", event: "Checkout Congestion Cleared", detail: "Dwell time dropped below 3.0 min threshold" }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="⏱️" title="Chronological Store Activities Timeline" subtitle="Continuous activity log covering tracking, camera status, and shelf updates" />

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
        {activities.map((act, i) => (
          <div key={i} className="p-3 bg-[#172033] border border-[#273449] rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-white font-extrabold">{act.event}</span>
              <span className="text-emerald-400 font-mono font-bold text-[10px]">{act.time}</span>
            </div>
            <p className="text-[10px] text-slate-400">{act.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 11. SETTINGS PAGE
export function StoreSettingsPage() {
  return (
    <div className="space-y-6 font-sans text-slate-100">
      <ModuleHeader icon="⚙️" title="Store Operational Settings" subtitle="Configure business hours, camera preferences, notification thresholds, and profile details" />

      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4 text-xs">
        <h3 className="font-extrabold text-white uppercase text-xs">Store Configuration</h3>
        <div className="space-y-3">
          <div className="p-3 bg-[#172033] rounded-xl border border-[#273449] flex justify-between items-center">
            <span className="text-slate-300 font-bold">Store Business Hours:</span>
            <span className="text-emerald-400 font-mono font-bold">08:00 AM - 10:00 PM</span>
          </div>
          <div className="p-3 bg-[#172033] rounded-xl border border-[#273449] flex justify-between items-center">
            <span className="text-slate-300 font-bold">Automated Queue Congestion Alerts:</span>
            <span className="text-emerald-400 font-mono font-bold">ENABLED (&gt; 5 Shoppers)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
