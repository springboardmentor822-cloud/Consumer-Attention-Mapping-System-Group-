import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import AiVisionCamera from "../../components/vision/AiVisionCamera";

const CAMERAS = [
  { id: "CAM-01", name: "Main Central Aisle", location: "Aisle B", status: "Online", path: "/videos/store1.mp4" },
  { id: "CAM-02", name: "Produce & Scale Station", location: "Fresh Produce", status: "Online", path: "/videos/aisle1.mp4" },
  { id: "CAM-03", name: "Checkout Counter #1", location: "Billing Counters 1–4", status: "Online", path: "/videos/checkout1.mp4" },
  { id: "CAM-04", name: "Checkout Counter #2", location: "Billing Counters 5–8", status: "Offline", path: "/videos/checkout2.mp4" },
];

export default function StoreOverview({ onNavigateTab }) {
  const { dateRange, setDateRange, selectedCamera, setSelectedCamera, telemetry } = useCams();
  const [activeCamObj, setActiveCamObj] = useState(CAMERAS[0]);

  useEffect(() => {
    const cam = CAMERAS.find(c => c.id === selectedCamera) || CAMERAS[0];
    setActiveCamObj(cam);
  }, [selectedCamera]);

  const handleSelectCam = (cam) => {
    setSelectedCamera(cam.id);
    setActiveCamObj(cam);
  };

  const visitorsByHour = [
    { time: "9 AM", val: Math.round(telemetry.peakHourTraffic * 0.25) },
    { time: "10 AM", val: Math.round(telemetry.peakHourTraffic * 0.45) },
    { time: "11 AM", val: Math.round(telemetry.peakHourTraffic * 0.6) },
    { time: "12 PM", val: Math.round(telemetry.peakHourTraffic * 0.8) },
    { time: "1 PM", val: Math.round(telemetry.peakHourTraffic * 0.95) },
    { time: "2 PM", val: Math.round(telemetry.peakHourTraffic * 0.85) },
    { time: "3 PM", val: Math.round(telemetry.peakHourTraffic * 0.9) },
    { time: "4 PM", val: Math.round(telemetry.peakHourTraffic * 0.75) },
    { time: "5 PM", val: telemetry.peakHourTraffic },
    { time: "6 PM", val: Math.round(telemetry.peakHourTraffic * 0.95) },
    { time: "7 PM", val: Math.round(telemetry.peakHourTraffic * 0.8) },
    { time: "8 PM", val: Math.round(telemetry.peakHourTraffic * 0.55) },
    { time: "9 PM", val: Math.round(telemetry.peakHourTraffic * 0.3) }
  ];

  const customersByZone = [
    { zone: "Entrance", val: Math.round(telemetry.totalVisitors * 0.08), fill: "#2563EB" },
    { zone: "Bakery", val: Math.round(telemetry.totalVisitors * 0.12), fill: "#10B981" },
    { zone: "Dairy", val: Math.round(telemetry.totalVisitors * 0.1), fill: "#F59E0B" },
    { zone: "Produce", val: Math.round(telemetry.totalVisitors * 0.07), fill: "#06B6D4" },
    { zone: "Cosmetics", val: Math.round(telemetry.totalVisitors * 0.09), fill: "#8B5CF6" },
    { zone: "Electronics", val: Math.round(telemetry.totalVisitors * 0.05), fill: "#F97316" }
  ];

  const shelfPerformance = [
    { shelf: "Bakery Endcap", score: 94, change: "↑ 8%", color: "text-emerald-400", bar: "bg-emerald-500" },
    { shelf: "Dairy Section", score: 88, change: "↑ 6%", color: "text-emerald-400", bar: "bg-emerald-500" },
    { shelf: "Cosmetics Display", score: 91, change: "↑ 4%", color: "text-emerald-400", bar: "bg-emerald-500" },
    { shelf: "Electronics Corner", score: 86, change: "↓ 2%", color: "text-amber-400", bar: "bg-amber-500" }
  ];

  const productInteraction = [
    { name: "Picked", value: Math.round(telemetry.totalVisitors * 0.15), color: "#10B981" },
    { name: "Viewed", value: Math.round(telemetry.totalVisitors * 0.35), color: "#2563EB" },
    { name: "Returned", value: Math.round(telemetry.totalVisitors * 0.05), color: "#F59E0B" },
    { name: "Compared", value: Math.round(telemetry.totalVisitors * 0.08), color: "#8B5CF6" }
  ];

  const topPickedProducts = [
    { rank: 1, name: "Artisan Sourdough Bread", category: "Bakery", picked: Math.round(telemetry.totalVisitors * 0.015), change: "↑ 12%", color: "text-emerald-400" },
    { rank: 2, name: "Organic Almond Milk", category: "Dairy", picked: Math.round(telemetry.totalVisitors * 0.012), change: "↑ 7%", color: "text-emerald-400" },
    { rank: 3, name: "Free-Range Eggs (12pk)", category: "Dairy", picked: Math.round(telemetry.totalVisitors * 0.011), change: "↑ 3%", color: "text-emerald-400" },
    { rank: 4, name: "Premium Greek Yogurt", category: "Dairy", picked: Math.round(telemetry.totalVisitors * 0.01), change: "↑ 8%", color: "text-emerald-400" },
    { rank: 5, name: "Avocado (Hass, 4-pack)", category: "Produce", picked: Math.round(telemetry.totalVisitors * 0.008), change: "↑ 5%", color: "text-emerald-400" }
  ];

  const recentActivities = [
    { time: "Just Now", msg: "High traffic density detected in Bakery zone", dot: "bg-rose-500" },
    { time: "10 min ago", msg: "Camera 4 (Checkout 2) connection stable", dot: "bg-emerald-500" },
    { time: "25 min ago", msg: "Weekly store performance report generated", dot: "bg-blue-500" },
    { time: "1 hour ago", msg: "CAM-02 recalibrated for produce section", dot: "bg-emerald-500" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs pb-8">
      {/* HEADER WITH TITLE ONLY AND DATE FILTER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
        <h1 className="text-xl font-black text-white tracking-wide">Store Manager Dashboard</h1>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs font-medium">Period:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#0A1020] border border-[#273449] text-emerald-400 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
            <option value="Custom Date Range">Custom Date Range</option>
          </select>
        </div>
      </div>

      {/* 1. OPERATIONAL KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Total Visitors</span>
          <h2 className="text-lg font-black text-white font-mono">{telemetry.totalVisitors ? telemetry.totalVisitors.toLocaleString() : "1,420"}</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">↑ {telemetry.totalVisitorsChange}%</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Current Customers</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">{telemetry.currentCustomers || 42}</h2>
          <span className="text-[9px] text-slate-400 font-mono">Live In-Store</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Avg. Dwell Time</span>
          <h2 className="text-lg font-black text-white font-mono">{telemetry.avgDwellTime} min</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">↑ {telemetry.avgDwellTimeChange}%</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Products Picked</span>
          <h2 className="text-lg font-black text-white font-mono">{telemetry.productsPicked ? telemetry.productsPicked.toLocaleString() : "2,140"}</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">↑ 11.2%</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Conversion Rate</span>
          <h2 className="text-lg font-black text-white font-mono">{telemetry.conversionRate}%</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">↑ {telemetry.conversionRateChange}%</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Camera Status</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">{telemetry.cameraStatus || "3/4 Online"}</h2>
          <span className="text-[9px] text-slate-400 font-mono">Surveillance</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] font-medium block">Sales Revenue</span>
          <h2 className="text-lg font-black text-white font-mono">${telemetry.salesRevenue ? telemetry.salesRevenue.toLocaleString() : "14,850"}</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">↑ {telemetry.salesRevenueChange}%</span>
        </div>
      </div>

      {/* 2. LIVE CAMERA MONITORING AREA IMMEDIATELY BELOW KPIS */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Live CCTV Camera Monitoring & Real-Time Computer Vision</h3>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
            Active Feed: {activeCamObj.name} ({activeCamObj.id})
          </span>
        </div>

        {/* 4 CAMERA PREVIEW WINDOWS NAVIGATOR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CAMERAS.map((cam) => {
            const isSelected = cam.id === activeCamObj.id;
            return (
              <div
                key={cam.id}
                onClick={() => handleSelectCam(cam)}
                className={`p-2 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#1E293B] border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "bg-[#0A1020] border-[#1E293B] hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-extrabold text-white truncate">{cam.id}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${cam.status === "Online" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    {cam.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{cam.name}</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5 font-mono">{cam.location}</p>
              </div>
            );
          })}
        </div>

        {/* FULL REAL-TIME COMPUTER VISION INFERENCE VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          <div className="lg:col-span-2">
            <AiVisionCamera cameraName={activeCamObj.name} videoSrc={activeCamObj.path} />
          </div>

          <div className="bg-[#0A1020] border border-[#1E293B] rounded-xl p-4 space-y-3 font-mono flex flex-col justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Vision Inference Telemetry</h4>
            
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-[#1E293B] pb-1.5">
                <span className="text-slate-400">Tracked ID:</span>
                <span className="text-emerald-400 font-bold">TRK-104 (Active)</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1.5">
                <span className="text-slate-400">Current Zone:</span>
                <span className="text-white font-bold">{activeCamObj.location}</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1.5">
                <span className="text-slate-400">Customer Dwell:</span>
                <span className="text-amber-400 font-bold">3m 42s</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1.5">
                <span className="text-slate-400">Shelf Interaction:</span>
                <span className="text-blue-400 font-bold">Picking Product</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1.5">
                <span className="text-slate-400">Attention Score:</span>
                <span className="text-purple-400 font-bold">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product Events:</span>
                <span className="text-emerald-400 font-bold">2 Picked / 0 Returned</span>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-[10px] text-emerald-300">
              ⚡ Live stream computer vision pipeline is dynamically updating zone metrics and store attention heatmaps.
            </div>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC ATTENTION HEATMAP */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3 font-mono">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Customer Attention & Traffic Heatmap</h3>
          <span className="text-[10px] text-slate-400">Dynamic coordinate updating from computer vision tracking</span>
        </div>
        <div className="h-44 w-full bg-[#070C18] border border-[#1E293B] rounded-xl relative overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-emerald-900/20 to-amber-900/30"></div>
          {/* Simulated heat spots */}
          <div className="absolute top-1/4 left-1/5 w-24 h-24 bg-rose-500/40 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-amber-500/40 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-emerald-500/30 rounded-full blur-lg"></div>

          <div className="relative z-10 grid grid-cols-4 gap-4 text-center w-full max-w-2xl">
            <div className="bg-[#0F172A]/80 border border-rose-500/40 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-400 block">Bakery Hotspot</span>
              <strong className="text-xs text-rose-400 block font-bold">94% Attention</strong>
            </div>
            <div className="bg-[#0F172A]/80 border border-amber-500/40 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-400 block">Dairy Section</span>
              <strong className="text-xs text-amber-400 block font-bold">88% Attention</strong>
            </div>
            <div className="bg-[#0F172A]/80 border border-emerald-500/40 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-400 block">Produce Bins</span>
              <strong className="text-xs text-emerald-400 block font-bold">82% Attention</strong>
            </div>
            <div className="bg-[#0F172A]/80 border border-blue-500/40 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-400 block">Checkout Queue</span>
              <strong className="text-xs text-blue-400 block font-bold">78% Attention</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ANALYTICAL MODULES - STRICTLY TWO WIDGETS PER ROW */}

      {/* ROW 1: Visitors by Hour | Customers by Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Hour</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorsByHour}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Line type="monotone" dataKey="val" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customers by Zone</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customersByZone}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                  {customersByZone.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: Top Shelf Performance | Product Interaction Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Shelf Performance</h3>
          <div className="space-y-4 pt-2">
            {shelfPerformance.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">{item.shelf}</span>
                  <div className="space-x-2">
                    <span className="text-white font-bold">{item.score}%</span>
                    <span className={item.color}>{item.change}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className={`h-full ${item.bar} rounded-full`} style={{ width: `${item.score}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Interaction Distribution</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productInteraction} innerRadius={40} outerRadius={60} dataKey="value">
                  {productInteraction.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E293B] text-center text-[10px]">
            {productInteraction.map((pi, idx) => (
              <div key={idx}>
                <span className="text-slate-400 block">{pi.name}</span>
                <strong className="text-white font-bold block">{pi.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: Top Picked Products | Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Picked Products</h3>
          <div className="divide-y divide-[#1E293B]">
            {topPickedProducts.map((prod) => (
              <div key={prod.rank} className="py-2.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#1E293B] text-slate-300 font-bold flex items-center justify-center text-[10px]">
                    #{prod.rank}
                  </span>
                  <div>
                    <h4 className="text-white font-bold">{prod.name}</h4>
                    <span className="text-[9px] text-slate-500">{prod.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold block">{prod.picked} picked</span>
                  <span className={`text-[9px] ${prod.color}`}>{prod.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Activities</h3>
          <div className="space-y-3 pt-1">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0A1020] border border-[#1E293B]">
                <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${act.dot}`}></span>
                <div className="flex-1 space-y-0.5">
                  <p className="text-white text-[11px] font-bold">{act.msg}</p>
                  <span className="text-[9px] text-slate-500 block">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4: Quick Navigation | Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onNavigateTab && onNavigateTab("Live Cameras")}
              className="p-3 bg-[#0A1020] border border-[#1E293B] hover:border-emerald-500 rounded-xl text-left transition space-y-1"
            >
              <span className="text-lg block">📹</span>
              <strong className="text-white text-xs block font-bold">Live Cameras</strong>
              <span className="text-[9px] text-slate-500 block">4 CCTV Stream Feeds</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab("Heat Map")}
              className="p-3 bg-[#0A1020] border border-[#1E293B] hover:border-emerald-500 rounded-xl text-left transition space-y-1"
            >
              <span className="text-lg block">🌡️</span>
              <strong className="text-white text-xs block font-bold">Heat Map</strong>
              <span className="text-[9px] text-slate-500 block">Real-time Gaze Matrix</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab("Shelf Performance")}
              className="p-3 bg-[#0A1020] border border-[#1E293B] hover:border-emerald-500 rounded-xl text-left transition space-y-1"
            >
              <span className="text-lg block">📦</span>
              <strong className="text-white text-xs block font-bold">Shelf Analytics</strong>
              <span className="text-[9px] text-slate-500 block">Stock & Dwell Times</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab("Reports")}
              className="p-3 bg-[#0A1020] border border-[#1E293B] hover:border-emerald-500 rounded-xl text-left transition space-y-1"
            >
              <span className="text-lg block">📄</span>
              <strong className="text-white text-xs block font-bold">Reports</strong>
              <span className="text-[9px] text-slate-500 block">Operational Audits</span>
            </button>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Supermarket Operational Status</h3>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-400">Store Node:</span>
              <span className="text-white font-bold">Downtown Supermarket Flagship</span>
            </div>
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-400">Operational Hours:</span>
              <span className="text-emerald-400 font-bold">8:00 AM – 10:00 PM</span>
            </div>
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-400">Total Cameras Deployed:</span>
              <span className="text-white font-bold">4 Active CCTV Feeds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Computer Vision Engine:</span>
              <span className="text-emerald-400 font-bold">YOLOv8 Edge Real-Time</span>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-xl text-[10px] text-blue-300">
            System is fully synchronized across Administrator, Marketing Manager, and Retail Analyst portals.
          </div>
        </div>
      </div>
    </div>
  );
}
