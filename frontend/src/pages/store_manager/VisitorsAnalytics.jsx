import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { formatNumber, getCentralScaledData } from "../../services/centralData";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";

export default function VisitorsAnalytics() {
  const { globalFilter } = useCams(); // Subscribe to global filter
  const filter = globalFilter;
  const selectedPeriod = filter.dateRange;
  const customRange = filter;

  // Load consolidated telemetry and tables
  const centralData = getCentralScaledData(selectedPeriod, customRange);
  const { kpis, visitorsByHour, customersByZone: visitorsByZone, segmentationData, customerList, transactionList } = centralData;


  const totalSegmentVisitors = kpis.totalVisitors;

  // Redirection states from Dashboard KPI Cards
  const [historyTab, setHistoryTab] = useState(() => {
    const saved = localStorage.getItem("cams_history_tab");
    localStorage.removeItem("cams_history_tab"); // consume
    return saved || "customers";
  });
  const [kpiFilter, setKpiFilter] = useState(() => {
    const saved = localStorage.getItem("cams_kpi_filter");
    localStorage.removeItem("cams_kpi_filter"); // consume
    return saved || null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [custPage, setCustPage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCustPage(1);
    setTxnPage(1);
  }, [historyTab, kpiFilter]);

  useEffect(() => {
    setKpiFilter(null);
    setSearchQuery("");
    setCustPage(1);
    setTxnPage(1);
  }, [selectedPeriod]);

  // Top Zones List (Centralized Sync)
  const topVisitors = kpis.totalVisitors;
  const topZonesList = [
    { rank: 1, name: "Main Entrance & Foyer", visitors: Math.round(topVisitors * 0.28), share: 28, color: "bg-blue-500" },
    { rank: 2, name: "Bakery Endcap Hotspot", visitors: Math.round(topVisitors * 0.22), share: 22, color: "bg-emerald-500" },
    { rank: 3, name: "Dairy & Beverage Aisle", visitors: Math.round(topVisitors * 0.19), share: 19, color: "bg-purple-500" },
    { rank: 4, name: "Fresh Produce Bins", visitors: Math.round(topVisitors * 0.16), share: 16, color: "bg-amber-500" },
    { rank: 5, name: "Cosmetics Display", visitors: Math.round(topVisitors * 0.15), share: 15, color: "bg-cyan-500" }
  ];

  // Recent Visitor Activities Log
  const actMult = Math.round(centralData.mult || 1.0);
  const recentVisitorActivities = [
    { time: "Just Now", zone: "Entrance", type: "New Visitor", count: 3 * actMult, details: "Group entered via Main Entrance", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "5 min ago", zone: "Bakery", type: "Returning Visitor", count: 1 * actMult, details: "Frequent shopper at Bakery shelf", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "12 min ago", zone: "Cosmetics", type: "New Visitor", count: 2 * actMult, details: "Browsing beauty promotions", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "20 min ago", zone: "Checkout", type: "Returning Visitor", count: 4 * actMult, details: "Completed billing at Counter 2", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "32 min ago", zone: "Produce", type: "New Visitor", count: 2 * actMult, details: "Selecting fresh organic items", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
  ];

  // Filtering Customer and Transaction lists
  const filteredCustomers = customerList ? customerList.filter(cust => {
    if (kpiFilter === "purchased" && cust.purchaseStatus !== "Purchased") return false;
    if (kpiFilter === "non-purchasing" && cust.purchaseStatus !== "No Purchase") return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        cust.customerId.toLowerCase().includes(q) ||
        cust.store.toLowerCase().includes(q) ||
        cust.zone.toLowerCase().includes(q) ||
        cust.purchaseStatus.toLowerCase().includes(q) ||
        cust.transactionId.toLowerCase().includes(q)
      );
    }
    return true;
  }) : [];

  const filteredTransactions = transactionList ? transactionList.filter(txn => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        txn.transactionId.toLowerCase().includes(q) ||
        txn.customerId.toLowerCase().includes(q) ||
        txn.products.toLowerCase().includes(q) ||
        txn.paymentStatus.toLowerCase().includes(q)
      );
    }
    return true;
  }) : [];

  return (
    <div className="space-y-6 font-sans text-xs pb-6">
      {/* HEADER */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white tracking-wide">Visitors Analytics</h1>
      </div>

      {/* 1. TOP METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Total Visitors</span>
            <h2 className="text-xl font-black text-white font-mono">{totalSegmentVisitors.toLocaleString()}</h2>
          </div>
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-xl">👥</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Avg Attention Time</span>
            <h2 className="text-xl font-black text-white font-mono">{centralData.kpis.avgDwellTime}min</h2>
          </div>
          <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-xl">👤</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">New Visitors</span>
            <h2 className="text-xl font-black text-white font-mono">{Math.round(totalSegmentVisitors * 0.63).toLocaleString()}</h2>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">63% of total</span>
          </div>
          <div className="w-12 h-12 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-xl">👤+</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Returning Visitors</span>
            <h2 className="text-xl font-black text-white font-mono">{Math.round(totalSegmentVisitors * 0.37).toLocaleString()}</h2>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">37% of total</span>
          </div>
          <div className="w-12 h-12 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl">🕒</div>
        </div>
      </div>

      {/* ROW 1: VISITORS BY HOUR & VISITORS BY ZONE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* VISITORS BY HOUR */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Hour</h3>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorsByHour}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} itemStyle={{ color: "#F8FAFC" }} labelStyle={{ color: "#94A3B8" }} />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* VISITORS BY ZONE */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visitors by Zone</h3>
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorsByZone}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} itemStyle={{ color: "#F8FAFC" }} labelStyle={{ color: "#94A3B8" }} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]} name="Visitors">
                  {visitorsByZone.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* ROW 2: NEW VS RETURNING & TOP ZONES LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NEW VS RETURNING DONUT CHART */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">New vs Returning Visitors</h3>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentationData} innerRadius={45} outerRadius={65} dataKey="value">
                  {segmentationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} itemStyle={{ color: "#F8FAFC" }} labelStyle={{ color: "#94A3B8" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <span className="text-[9px] text-slate-400 block">Total</span>
              <strong className="text-xs text-white block">{totalSegmentVisitors.toLocaleString()}</strong>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {segmentationData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </span>
                <strong className="text-white ml-1">{formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* TOP ZONES LIST */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Zones List</h3>
          </div>
          <div className="space-y-3">
            {topZonesList.map((z) => (
              <div key={z.rank} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#070C18] border border-[#1E293B] flex items-center justify-center text-[9px] font-black text-cyan-400">
                      #{z.rank}
                    </span>
                    <span className="font-bold text-white truncate max-w-[180px]">{z.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-bold">{z.visitors.toLocaleString()} visitors</span>
                    <span className="text-emerald-400 font-extrabold text-[10px]">{z.share}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className={`h-full ${z.color} rounded-full transition-all duration-500`} style={{ width: `${z.share * 3}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: RECENT VISITOR ACTIVITIES LOG */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Visitor Activity Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="pb-2">Time</th>
                <th className="pb-2">Zone</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-cyan-400 font-bold">Visitors Count</th>
                <th className="pb-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {recentVisitorActivities.map((act, i) => (
                <tr key={i} className="hover:bg-[#070C18]/50 transition">
                  <td className="py-2.5 text-slate-400">{act.time}</td>
                  <td className="py-2.5 font-bold text-white">{act.zone}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${act.badgeColor}`}>
                      {act.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-cyan-400 font-extrabold font-mono">{act.count}</td>
                  <td className="py-2.5 text-slate-400">{act.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CUSTOMER & TRANSACTION HISTORY SECTION */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 mt-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Customer & Transaction History</h3>
          </div>
          
          {/* Tab buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setHistoryTab("customers")}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all duration-150 ${
                historyTab === "customers"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-[#070C18] border border-[#1E293B] text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              Customer Visits ({filteredCustomers.length})
            </button>
            <button
              onClick={() => setHistoryTab("transactions")}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all duration-150 ${
                historyTab === "transactions"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-[#070C18] border border-[#1E293B] text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              Transactions ({filteredTransactions.length})
            </button>
          </div>
        </div>

        {/* Filters and search row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070C18] p-3 rounded-xl border border-[#1E293B]/60">
          <div className="flex items-center gap-2 flex-wrap">
            {kpiFilter && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                <span>Filter: {kpiFilter === "purchased" ? "Purchased Customers" : "Non-Purchasing Customers"}</span>
                <button
                  onClick={() => setKpiFilter(null)}
                  className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center text-[8px] text-white"
                >
                  ✕
                </button>
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">
              Showing {historyTab === "customers" ? filteredCustomers.length : filteredTransactions.length} records for {selectedPeriod}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={`Search ${historyTab === "customers" ? "customers, stores, zones..." : "transactions, products..."}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* History table */}
        <div className="overflow-x-auto">
          {historyTab === "customers" ? (
            filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                No customer visits found matching the active filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400 uppercase text-[9px] tracking-wider font-mono">
                    <th className="pb-2">Customer ID</th>
                    <th className="pb-2">Visit Date</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">Exit</th>
                    <th className="pb-2">Products Viewed</th>
                    <th className="pb-2">Products Purchased</th>
                    <th className="pb-2">Purchase Status</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Store</th>
                    <th className="pb-2">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/40">
                  {filteredCustomers
                    .slice((custPage - 1) * itemsPerPage, custPage * itemsPerPage)
                    .map((cust) => (
                      <tr key={cust.customerId} className="hover:bg-[#070C18]/45 transition">
                        <td className="py-3 font-bold text-white font-mono">{cust.customerId}</td>
                        <td className="py-3 text-slate-300 font-mono">{cust.visitDate}</td>
                        <td className="py-3 text-slate-400 font-mono">{cust.entryTime}</td>
                        <td className="py-3 text-slate-400 font-mono">{cust.exitTime}</td>
                        <td className="py-3 max-w-[200px] flex flex-wrap gap-0.5">
                          {cust.productsViewed.map(p => (
                            <span key={p.id} className="bg-[#070C18] text-slate-400 px-1 py-0.5 rounded border border-[#1E293B] text-[8px] font-mono leading-none">
                              {p.name}
                            </span>
                          ))}
                        </td>
                        <td className="py-3 max-w-[200px]">
                          {cust.productsPurchased.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5">
                              {cust.productsPurchased.map(p => (
                                <span key={p.id} className="bg-emerald-950/40 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20 text-[8px] font-mono leading-none">
                                  {p.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold font-mono ${
                            cust.purchaseStatus === "Purchased"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}>
                            {cust.purchaseStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-white font-mono">${cust.purchaseAmount.toFixed(2)}</td>
                        <td className="py-3 font-mono text-slate-400">{cust.transactionId}</td>
                        <td className="py-3 text-slate-300">{cust.store}</td>
                        <td className="py-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">
                            {cust.zone}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )
          ) : (
            filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                No transaction records found matching the active filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400 uppercase text-[9px] tracking-wider font-mono">
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Customer ID</th>
                    <th className="pb-2">Date & Time</th>
                    <th className="pb-2">Products</th>
                    <th className="pb-2 text-right">Quantity</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Profit</th>
                    <th className="pb-2">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/40">
                  {filteredTransactions
                    .slice((txnPage - 1) * itemsPerPage, txnPage * itemsPerPage)
                    .map((txn) => (
                      <tr key={txn.transactionId} className="hover:bg-[#070C18]/45 transition">
                        <td className="py-3 font-bold text-white font-mono">{txn.transactionId}</td>
                        <td className="py-3 font-mono text-slate-300">{txn.customerId}</td>
                        <td className="py-3 text-slate-400 font-mono">{txn.date} {txn.time}</td>
                        <td className="py-3 text-slate-300 font-mono max-w-[280px] truncate" title={txn.products}>
                          {txn.products}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-300">{txn.quantity}</td>
                        <td className="py-3 text-right font-bold text-white font-mono">${txn.amount.toFixed(2)}</td>
                        <td className="py-3 text-right font-bold text-emerald-400 font-mono">${txn.profit.toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold font-mono ${
                            txn.paymentStatus === "Completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : txn.paymentStatus === "Pending"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}>
                            {txn.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Pagination controls */}
        {historyTab === "customers" && filteredCustomers.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-[#1E293B] pt-4">
            <span className="text-[10px] text-slate-500 font-mono">
              Page {custPage} of {Math.ceil(filteredCustomers.length / itemsPerPage)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={custPage === 1}
                onClick={() => setCustPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-[#070C18] border border-[#1E293B] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition text-[11px] font-mono"
              >
                Previous
              </button>
              <button
                disabled={custPage >= Math.ceil(filteredCustomers.length / itemsPerPage)}
                onClick={() => setCustPage(p => p + 1)}
                className="px-3 py-1 bg-[#070C18] border border-[#1E293B] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition text-[11px] font-mono"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {historyTab === "transactions" && filteredTransactions.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-[#1E293B] pt-4">
            <span className="text-[10px] text-slate-500 font-mono">
              Page {txnPage} of {Math.ceil(filteredTransactions.length / itemsPerPage)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={txnPage === 1}
                onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-[#070C18] border border-[#1E293B] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition text-[11px] font-mono"
              >
                Previous
              </button>
              <button
                disabled={txnPage >= Math.ceil(filteredTransactions.length / itemsPerPage)}
                onClick={() => setTxnPage(p => p + 1)}
                className="px-3 py-1 bg-[#070C18] border border-[#1E293B] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition text-[11px] font-mono"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
