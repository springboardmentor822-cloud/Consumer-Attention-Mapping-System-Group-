import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { getCentralScaledData } from "../../services/centralData";
import StoreHeatmapModel from "../../components/StoreHeatmapModel";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


const CAMERAS = [
  { id: "CAM-01", name: "Main Central Aisle", location: "Aisle B", status: "Online", path: "/videos/store1.mp4", fps: "30 FPS", res: "1080p" },
  { id: "CAM-02", name: "Produce & Scale Station", location: "Fresh Produce", status: "Online", path: "/videos/aisle1.mp4", fps: "30 FPS", res: "1080p" },
  { id: "CAM-03", name: "Checkout Counter #1", location: "Billing Counters 1–4", status: "Online", path: "/videos/checkout1.mp4", fps: "30 FPS", res: "1080p" },
  { id: "CAM-04", name: "Checkout Counter #2", location: "Billing Counters 5–8", status: "Offline", path: "/videos/checkout2.mp4", fps: "0 FPS", res: "Offline" },
];

export default function StoreOverview({ onNavigateTab }) {
  const { selectedCamera, setSelectedCamera, telemetry, globalFilter } = useCams();
  const [activeCamObj, setActiveCamObj] = useState(CAMERAS[0]);

  // Read Global Dashboard Date Filter from context
  const filter = globalFilter;
  const selectedPeriod = filter.dateRange;
  const customRange = filter;

  useEffect(() => {
    const cam = CAMERAS.find(c => c.id === selectedCamera) || CAMERAS[0];
    setActiveCamObj(cam);
  }, [selectedCamera]);

  const handleSelectCam = (cam) => {
    setSelectedCamera(cam.id);
    setActiveCamObj(cam);
  };

  // Centralized period data computed for the active filters
  const centralData = getCentralScaledData(globalFilter);
  const { kpis, visitorsByHour, customersByZone, productInteraction, topPickedProducts, customerList, transactionList } = centralData;

  const salesLabel = selectedPeriod === "Today" ? "Today's Sales" : "Period Sales";
  const profitLabel = selectedPeriod === "Today" ? "Today's Profit" : "Period Profit";

  // Top Shelf Performance score shift calculation
  const shelfShift = selectedPeriod === "Yesterday" ? -3 : selectedPeriod === "Last 7 Days" ? 4 : selectedPeriod === "Last 30 Days" ? 6 : selectedPeriod === "Custom Date Range" ? 2 : 0;
  const shelfPerformance = [
    { shelf: "Bakery Endcap", score: Math.min(99, 94 + shelfShift), change: "↑ 8%", color: "text-emerald-400", bar: "bg-emerald-500" },
    { shelf: "Dairy Section", score: Math.min(99, 88 + shelfShift), change: "↑ 6%", color: "text-emerald-400", bar: "bg-emerald-500" },
    { shelf: "Cosmetics Display", score: Math.min(99, 91 + shelfShift), change: "↑ 4%", color: "text-emerald-400", bar: "bg-emerald-500" },
    { shelf: "Electronics Corner", score: Math.min(99, 86 + shelfShift), change: "↓ 2%", color: "text-amber-400", bar: "bg-amber-500" }
  ];

  const totalInteractionCount = productInteraction.reduce((acc, curr) => acc + curr.value, 0);

  // Custom Tooltip for Product Interaction Donut Chart
  const CustomInteractionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const count = data.value || 0;
      const percent = totalInteractionCount > 0 ? Math.round((count / totalInteractionCount) * 100) : 0;
      const segColor = data.payload?.color || "#10B981";

      return (
        <div className="bg-[#070C18]/95 border border-[#273449] p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 min-w-[170px]">
          <div className="flex items-center gap-2 border-b border-[#1E293B] pb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: segColor }}></span>
            <span className="font-extrabold text-white text-xs tracking-wide">{data.name}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-0.5">
            <span className="text-slate-400">Total Count:</span>
            <strong className="text-emerald-400 font-extrabold font-mono">{count.toLocaleString()}</strong>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Share:</span>
            <strong className="text-white font-extrabold font-mono">{percent}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const recentActivities = [
    { time: "Just Now", msg: "High traffic density detected in Bakery zone", dot: "bg-rose-500" },
    { time: "10 min ago", msg: "Camera 4 (Checkout 2) connection stable", dot: "bg-emerald-500" },
    { time: "25 min ago", msg: "Weekly store performance report generated", dot: "bg-blue-500" },
    { time: "1 hour ago", msg: "CAM-02 recalibrated for produce section", dot: "bg-emerald-500" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs pb-8">
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-xl font-black text-white tracking-wide">Store Manager Dashboard</h1>
      </div>

      {/* 1. OPERATIONAL KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Customers */}
        <button
          onClick={() => {
            localStorage.setItem("cams_kpi_filter", "");
            localStorage.setItem("cams_history_tab", "customers");
            if (onNavigateTab) onNavigateTab("Visitors");
          }}
          className="bg-[#0F172A] border border-[#1E293B] hover:border-emerald-500/40 text-left p-3.5 rounded-2xl space-y-1 transition duration-200"
        >
          <span className="text-slate-400 text-[10px] font-medium block">Total Customers</span>
          <h2 className="text-lg font-black text-white font-mono">{kpis.totalCustomers.toLocaleString()}</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">↑ {kpis.totalVisitorsChange}%</span>
        </button>

        {/* Purchased Customers */}
        <button
          onClick={() => {
            localStorage.setItem("cams_kpi_filter", "purchased");
            localStorage.setItem("cams_history_tab", "customers");
            if (onNavigateTab) onNavigateTab("Visitors");
          }}
          className="bg-[#0F172A] border border-[#1E293B] hover:border-emerald-500/40 text-left p-3.5 rounded-2xl space-y-1 transition duration-200"
        >
          <span className="text-slate-400 text-[10px] font-medium block">Purchased Customers</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">{kpis.purchasedCustomers.toLocaleString()}</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">{kpis.conversionRate}% Conv. Rate</span>
        </button>

        {/* Non-Purchasing Customers */}
        <button
          onClick={() => {
            localStorage.setItem("cams_kpi_filter", "non-purchasing");
            localStorage.setItem("cams_history_tab", "customers");
            if (onNavigateTab) onNavigateTab("Visitors");
          }}
          className="bg-[#0F172A] border border-[#1E293B] hover:border-rose-500/40 text-left p-3.5 rounded-2xl space-y-1 transition duration-200"
        >
          <span className="text-slate-400 text-[10px] font-medium block">Non-Purchasing Customers</span>
          <h2 className="text-lg font-black text-rose-400 font-mono">{kpis.nonPurchasingCustomers.toLocaleString()}</h2>
          <span className="text-[9px] text-rose-400 font-bold font-mono">{(100 - kpis.conversionRate).toFixed(1)}% No Purchase</span>
        </button>

        {/* Units Sold */}
        <button
          onClick={() => {
            localStorage.setItem("cams_kpi_filter", "");
            localStorage.setItem("cams_history_tab", "transactions");
            if (onNavigateTab) onNavigateTab("Visitors");
          }}
          className="bg-[#0F172A] border border-[#1E293B] hover:border-teal-500/40 text-left p-3.5 rounded-2xl space-y-1 transition duration-200"
        >
          <span className="text-slate-400 text-[10px] font-medium block">Units Sold</span>
          <h2 className="text-lg font-black text-white font-mono">{kpis.unitsSold.toLocaleString()}</h2>
          <span className="text-[9px] text-teal-400 font-bold font-mono">
            {(kpis.unitsSold > 0 && kpis.purchasedCustomers > 0 ? (kpis.unitsSold / kpis.purchasedCustomers).toFixed(1) : 0)} Units/Txn
          </span>
        </button>

        {/* Sales */}
        <button
          onClick={() => {
            localStorage.setItem("cams_kpi_filter", "");
            localStorage.setItem("cams_history_tab", "transactions");
            if (onNavigateTab) onNavigateTab("Visitors");
          }}
          className="bg-[#0F172A] border border-[#1E293B] hover:border-teal-500/40 text-left p-3.5 rounded-2xl space-y-1 transition duration-200"
        >
          <span className="text-slate-400 text-[10px] font-medium block">{salesLabel}</span>
          <h2 className="text-lg font-black text-white font-mono">${kpis.todaySales.toLocaleString()}</h2>
          <span className="text-[9px] text-teal-400 font-bold font-mono">
            {kpis.purchasedCustomers > 0 ? "$" + Math.round(kpis.todaySales / kpis.purchasedCustomers) : "$0"} AOV
          </span>
        </button>

        {/* Profit */}
        <button
          onClick={() => {
            localStorage.setItem("cams_kpi_filter", "");
            localStorage.setItem("cams_history_tab", "transactions");
            if (onNavigateTab) onNavigateTab("Visitors");
          }}
          className="bg-[#0F172A] border border-[#1E293B] hover:border-emerald-500/40 text-left p-3.5 rounded-2xl space-y-1 transition duration-200"
        >
          <span className="text-slate-400 text-[10px] font-medium block">{profitLabel}</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">${kpis.todayProfit.toLocaleString()}</h2>
          <span className="text-[9px] text-emerald-400 font-bold font-mono">{kpis.todaySales > 0 ? Math.round((kpis.todayProfit / kpis.todaySales) * 100) : 35}% Margin</span>
        </button>
      </div>

      {/* 2. REDESIGNED LIVE CAMERA SECTION (PROFESSIONAL CCTV MONITORING CARDS) */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Live Camera</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">4 Active Feeds • CCTV Matrix</span>
        </div>

        {/* 4 SMALL CCTV PREVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAMERAS.map((cam) => {
            const isSelected = cam.id === activeCamObj.id;
            return (
              <div
                key={cam.id}
                onClick={() => handleSelectCam(cam)}
                className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 bg-[#070C18] flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                    : "border-[#1E293B] hover:border-slate-600"
                }`}
              >
                {/* CCTV Stream Container */}
                <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                  <video
                    src={cam.path}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-300"
                  />

                  {/* Top CCTV Overlay */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                    <span className="font-mono text-[9px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded border border-white/10">
                      {cam.id}
                    </span>
                    {cam.status === "Online" ? (
                      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        REC ●
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        OFFLINE
                      </span>
                    )}
                  </div>

                  {/* Bottom CCTV Stream Meta */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none z-10 text-[9px] font-mono">
                    <span className="text-white font-bold drop-shadow-md bg-black/60 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                      {cam.location}
                    </span>
                    <span className="text-slate-300 bg-black/60 px-1 py-0.5 rounded text-[8px]">
                      {cam.fps}
                    </span>
                  </div>
                </div>

                {/* CCTV Card Footer */}
                <div className="p-2.5 bg-[#0D1527] border-t border-[#1E293B] flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] truncate">{cam.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{cam.res}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ENTERPRISE SUPERMARKET HEATMAP */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Heatmap</h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            ● LIVE TRACKING
          </span>
        </div>

        <StoreHeatmapModel
          dateFilter={selectedPeriod}
          customRangeLabel={filter?.label}
          onDateChange={(p) => setFilter({ ...filter, dateRange: p })}
        />
      </div>

      {/* 4. ANALYTICAL MODULES - STRICTLY TWO WIDGETS PER ROW */}

      {/* ROW 1: Visitors by Hour | Customers by Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Hour</h3>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorsByHour}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Line type="monotone" dataKey="val" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customers by Zone</h3>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
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
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* ROW 2: Top Shelf Performance | Product Interaction Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Shelf Performance</h3>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Interaction Distribution</h3>
          </div>

          {/* DONUT CHART WITH ENHANCED INTERACTIVE TOOLTIP */}
          <div className="h-44 w-full relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productInteraction} innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3}>
                  {productInteraction.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomInteractionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            
            {/* Center Summary Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-slate-400 uppercase font-bold">Total</span>
              <span className="text-xs font-black text-white font-mono">{totalInteractionCount.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E293B] text-center text-[10px]">
            {productInteraction.map((pi, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pi.color }}></span>
                  <span className="text-slate-400 truncate">{pi.name}</span>
                </div>
                <strong className="text-white font-bold block">{pi.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: Top Picked Products | Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Picked Products</h3>
          </div>
          <div className="divide-y divide-[#1E293B]">
            {topPickedProducts.map((prod) => (
              <div key={prod.rank} className="py-2.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-[#1E293B] text-slate-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    #{prod.rank}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold truncate">{prod.name}</h4>
                    <span className="text-[9px] text-slate-500 block truncate">{prod.category}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-white font-bold block">{prod.picked} picked</span>
                  <span className={`text-[9px] ${prod.color}`}>{prod.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Activities</h3>
          </div>
          <div className="space-y-3 pt-1">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0A1020] border border-[#1E293B]">
                <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${act.dot}`}></span>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <p className="text-white text-[11px] font-bold truncate">{act.msg}</p>
                  <span className="text-[9px] text-slate-500 block">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. RECENT VISITOR ACTIVITY SUMMARY (5 Key Items - Full Width Container) */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 min-w-0">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Recent Activity Summary</h3>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab("Visitors")}
            className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-mono font-bold"
          >
            View Complete Details →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {(customerList || []).slice(0, 5).map((cust) => (
            <div
              key={cust.customerId}
              className="bg-[#070C18] border border-[#1E293B] p-4 rounded-xl space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition duration-200 min-w-0"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex justify-between items-center gap-1">
                  <span className="font-bold text-white font-mono text-[11px] truncate">{cust.customerId}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold font-mono flex-shrink-0 ${
                    cust.purchaseStatus === "Purchased"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}>
                    {cust.purchaseStatus === "Purchased" ? "Sale" : "Visit"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono space-y-1">
                  <div className="truncate">🕒 {cust.entryTime} - {cust.exitTime}</div>
                  <div className="truncate">📍 {cust.zone}</div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-[#1E293B]/40 pt-2 text-[10px]">
                <span className="text-slate-500 font-sans truncate max-w-[80px]">{cust.store.split(" - ")[0]}</span>
                <span className="font-extrabold text-white font-mono flex-shrink-0">${cust.purchaseAmount.toFixed(2)}</span>
              </div>
            </div>
          ))}
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
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab("Heat Map")}
              className="p-3 bg-[#0A1020] border border-[#1E293B] hover:border-emerald-500 rounded-xl text-left transition space-y-1"
            >
              <span className="text-lg block">🌡️</span>
              <strong className="text-white text-xs block font-bold">Heat Map</strong>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab("Shelf Performance")}
              className="p-3 bg-[#0A1020] border border-[#1E293B] hover:border-emerald-500 rounded-xl text-left transition space-y-1"
            >
              <span className="text-lg block">📦</span>
              <strong className="text-white text-xs block font-bold">Shelf Analytics</strong>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab("Reports")}
              className="p-3 bg-[#0A1020] border border-[#1E293B] hover:border-emerald-500 rounded-xl text-left transition space-y-1"
            >
              <span className="text-lg block">📄</span>
              <strong className="text-white text-xs block font-bold">Reports</strong>
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
        </div>
      </div>
    </div>
  );
}
