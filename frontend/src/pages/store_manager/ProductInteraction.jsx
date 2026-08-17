import React, { useState, useEffect } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useCams } from "../../services/CamsContext";
import { formatNumber, getCentralScaledData, syncModuleArrays } from "../../services/centralData";
import CustomDateSelector from "../../components/CustomDateSelector";
import { INITIAL_PRODUCTS, INITIAL_SHELVES } from "../admin/ShelfManagement";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function ProductInteraction() {
  const { telemetry, liveTrackedPersons } = useCams();


  // Load products list and shelves list from localStorage
  const [productsList, setProductsList] = useState(() => {
    try {
      const raw = localStorage.getItem("cams_products_v2");
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_PRODUCTS;
  });

  const [shelvesList, setShelvesList] = useState(() => {
    try {
      const raw = localStorage.getItem("cams_shelves_v2");
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_SHELVES;
  });

  // Load/save promotions from/to localStorage
  const [promotionsList, setPromotionsList] = useState(() => {
    try {
      const raw = localStorage.getItem("cams_promotions_v2");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: "PRM-101", name: "Sourdough BOGO", productId: "P-001", discount: "Buy 1 Get 1", offerType: "BOGO", startDate: "2026-08-01", endDate: "2026-08-15", status: "Active" },
      { id: "PRM-102", name: "Almond Milk discount", productId: "P-002", discount: "10% Off", offerType: "Percentage", startDate: "2026-08-05", endDate: "2026-08-20", status: "Active" },
      { id: "PRM-103", name: "Avocado Deal", productId: "P-005", discount: "$1.00 Off", offerType: "Fixed Amount", startDate: "2026-08-10", endDate: "2026-08-25", status: "Active" }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("cams_promotions_v2", JSON.stringify(promotionsList));
      syncModuleArrays();
    } catch {}
  }, [promotionsList]);

  useEffect(() => {
    try {
      localStorage.setItem("cams_products_v2", JSON.stringify(productsList));
      syncModuleArrays();
    } catch {}
  }, [productsList]);

  // Modals & form state for promotions
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoFormState, setPromoFormState] = useState({
    name: "",
    productId: "",
    discount: "",
    offerType: "Percentage",
    startDate: "",
    endDate: "",
    status: "Active"
  });
  const [promoErrors, setPromoErrors] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleOpenAddPromo = () => {
    setPromoErrors({});
    setEditingPromo(null);
    setPromoFormState({
      name: "",
      productId: productsList[0]?.id || "",
      discount: "10% Off",
      offerType: "Percentage",
      startDate: "2026-08-12",
      endDate: "2026-08-19",
      status: "Active"
    });
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromo = (promo) => {
    setPromoErrors({});
    setEditingPromo(promo);
    setPromoFormState({
      name: promo.name,
      productId: promo.productId,
      discount: promo.discount,
      offerType: promo.offerType,
      startDate: promo.startDate,
      endDate: promo.endDate,
      status: promo.status
    });
    setIsPromoModalOpen(true);
  };

  const handlePromoFormSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!promoFormState.name.trim()) errors.name = "Promotion Name is required.";
    if (!promoFormState.productId) errors.productId = "Product Node is required.";
    if (!promoFormState.discount.trim()) errors.discount = "Discount value is required.";
    if (!promoFormState.startDate) errors.startDate = "Start Date is required.";
    if (!promoFormState.endDate) errors.endDate = "End Date is required.";

    if (Object.keys(errors).length > 0) {
      setPromoErrors(errors);
      return;
    }

    let updatedPromos = [];
    if (editingPromo) {
      updatedPromos = promotionsList.map((p) =>
        p.id === editingPromo.id ? { ...p, ...promoFormState } : p
      );
      showToast(`✏️ Updated promotion ${editingPromo.id}`);
    } else {
      const newId = `PRM-${Math.floor(100 + Math.random() * 899)}`;
      const newPromo = { id: newId, ...promoFormState };
      updatedPromos = [newPromo, ...promotionsList];
      showToast(`🏷️ Created promotion ${newId}`);
    }

    setPromotionsList(updatedPromos);

    // Sync back to productsList: update the product's promo field with the discount string
    const updatedProducts = productsList.map((p) => {
      if (p.id === promoFormState.productId) {
        return { ...p, promo: promoFormState.discount };
      }
      return p;
    });
    setProductsList(updatedProducts);
    try {
      localStorage.setItem("cams_products_v2", JSON.stringify(updatedProducts));
    } catch {}

    setIsPromoModalOpen(false);
  };

  const handleDeletePromo = (id) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      const promoToDelete = promotionsList.find((p) => p.id === id);
      const updatedPromos = promotionsList.filter((p) => p.id !== id);
      setPromotionsList(updatedPromos);

      if (promoToDelete) {
        // If no other active promotions for this product, clear the promo field
        const remainingForProduct = updatedPromos.filter(
          (p) => p.productId === promoToDelete.productId
        );
        if (remainingForProduct.length === 0) {
          const updatedProducts = productsList.map((p) => {
            if (p.id === promoToDelete.productId) {
              return { ...p, promo: "None" };
            }
            return p;
          });
          setProductsList(updatedProducts);
          try {
            localStorage.setItem("cams_products_v2", JSON.stringify(updatedProducts));
          } catch {}
        }
      }
      showToast(`Deleted promotion ${id}`);
    }
  };

  // Global Period State (null means inherit globalFilter)
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);
  const [localCustomRange, setLocalCustomRange] = useState(null);

  const selectedPeriod = localPeriod || globalFilter?.dateRange || "Last 7 Days";
  const customRange = localCustomRange || (globalFilter?.dateRange === "Custom Date Range" ? globalFilter : null);

  const handleDateChange = (newPeriod, customData = null) => {
    setLocalPeriod(newPeriod);
    if (newPeriod === "Custom Date Range" && customData) {
      setLocalCustomRange(customData);
    } else if (newPeriod !== "Custom Date Range") {
      setLocalCustomRange(null);
    }
  };

  // Synchronized Central Dataset
  const centralData = getCentralScaledData(selectedPeriod, customRange);
  const totalVisitors = centralData.kpis.totalVisitors;
  const mult = centralData.mult;

  const getProductStats = (product) => {
    let hash = 0;
    const pid = product?.id || "P-000";
    for (let i = 0; i < pid.length; i++) {
      hash = pid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    const views = Math.round((50 + (seed % 150)) * mult);
    const purchases = Math.round(views * (0.1 + (seed % 30) / 100));
    const pickups = Math.round(views * 0.64);
    const compared = Math.round(pickups * 0.60);
    return { views, pickups, compared, purchases };
  };

  // 1. Top KPI Metrics
  const viewedCount = Math.round(totalVisitors * 0.70);
  const pickedCount = Math.round(totalVisitors * 0.35);
  const comparedCount = Math.round(totalVisitors * 0.21);
  const purchasedCount = Math.round(totalVisitors * 0.14);

  // 2. Interactions Over Time
  const interactionsOverTime = [
    { time: "9 AM", count: Math.round(totalVisitors * 0.05) },
    { time: "12 PM", count: Math.round(totalVisitors * 0.12) },
    { time: "3 PM", count: Math.round(totalVisitors * 0.18) },
    { time: "5 PM", count: Math.round(totalVisitors * 0.22) },
    { time: "7 PM", count: Math.round(totalVisitors * 0.15) },
    { time: "9 PM", count: Math.round(totalVisitors * 0.06) }
  ];

  // 3. Interactions by Category
  const totalCatVal = Math.round(totalVisitors * 0.35);
  const categoryData = [
    { name: "Bakery", val: Math.round(totalVisitors * 0.12), percent: "30%", color: "#2563EB" },
    { name: "Dairy", val: Math.round(totalVisitors * 0.10), percent: "25%", color: "#10B981" },
    { name: "Produce", val: Math.round(totalVisitors * 0.08), percent: "20%", color: "#8B5CF6" },
    { name: "Cosmetics", val: Math.round(totalVisitors * 0.06), percent: "15%", color: "#EF4444" },
    { name: "Electronics", val: Math.round(totalVisitors * 0.04), percent: "10%", color: "#F59E0B" }
  ];

  // 4. Professional Interaction Funnel (Viewed -> Picked -> Compared -> Purchased)
  // Stage 1: Viewed (Initial)
  // Stage 2: Picked (% from Viewed)
  // Stage 3: Compared (% from Picked)
  // Stage 4: Purchased (% from Compared)
  const funnelStages = [
    {
      stage: "Viewed",
      count: viewedCount,
      convFromPrev: "100%",
      subLabel: "Total Product Views",
      color: "from-blue-600 to-cyan-500",
      icon: "👁️",
      widthPct: 100
    },
    {
      stage: "Picked",
      count: pickedCount,
      convFromPrev: `${((pickedCount / viewedCount) * 100).toFixed(1)}% from Viewed`,
      subLabel: "Pick-up Rate",
      color: "from-cyan-500 to-emerald-500",
      icon: "🛍️",
      widthPct: 82
    },
    {
      stage: "Compared",
      count: comparedCount,
      convFromPrev: `${((comparedCount / pickedCount) * 100).toFixed(1)}% from Picked`,
      subLabel: "Comparison Rate",
      color: "from-emerald-500 to-amber-500",
      icon: "⚖️",
      widthPct: 64
    },
    {
      stage: "Purchased",
      count: purchasedCount,
      convFromPrev: `${((purchasedCount / comparedCount) * 100).toFixed(1)}% from Compared`,
      subLabel: "Checkout Conversion",
      color: "from-amber-500 to-rose-500",
      icon: "🛒",
      widthPct: 46
    }
  ];

  // 5. Recent Interactions Table
  const recentInteractions = [
    { time: "Just Now", product: "Artisan Sourdough Bread", category: "Bakery", action: "Picked Up", location: "Aisle 1", duration: "12s", badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { time: "3 min ago", product: "Organic Almond Milk", category: "Dairy", action: "Viewed", location: "Aisle 2", duration: "8s", badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { time: "7 min ago", product: "Premium Greek Yogurt", category: "Dairy", action: "Compared", location: "Aisle 2", duration: "15s", badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    { time: "15 min ago", product: "Free-Range Eggs (12pk)", category: "Dairy", action: "Purchased", location: "Checkout C1", duration: "-", badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs pb-6">
      {/* PAGE HEADER & DATE FILTER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white tracking-wide">Product Interaction Analytics</h1>
          {selectedPeriod === "Custom Date Range" && customRange?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {customRange.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-400 font-mono">Date Range:</span>
          <CustomDateSelector value={selectedPeriod} onChange={handleDateChange} />
        </div>
      </div>

      {/* 1. TOP METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Products Viewed</span>
            <h2 className="text-xl font-black text-white">{viewedCount.toLocaleString()}</h2>
            <span className="text-[10px] text-cyan-400 font-bold">70% View Velocity</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">👁️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Products Picked</span>
            <h2 className="text-xl font-black text-white">{pickedCount.toLocaleString()}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">50% Funnel Pick</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">🛍️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Products Compared</span>
            <h2 className="text-xl font-black text-white">{comparedCount.toLocaleString()}</h2>
            <span className="text-[10px] text-amber-400 font-bold">30% Comparison</span>
          </div>
          <div className="w-10 h-10 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center text-lg">⚖️</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Purchased Count</span>
            <h2 className="text-xl font-black text-white">{purchasedCount.toLocaleString()}</h2>
            <span className="text-[10px] text-purple-400 font-bold">20% Conversion</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">🛒</div>
        </div>
      </div>

      {/* 2. INTERACTIONS OVER TIME & CATEGORY DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* INTERACTIONS OVER TIME */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Interactions Over Time</h3>
            
          </div>
          <div className="h-56 w-full">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={interactionsOverTime}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Interactions" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* CATEGORY DONUT CHART */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interactions by Category</h3>
            
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={45} outerRadius={65} dataKey="val">
                  {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">{totalCatVal.toLocaleString()}</strong>
              <span className="text-[9px] text-slate-400 block">Interactions</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </span>
                <strong className="text-white ml-1">{item.percent}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PROFESSIONAL FUNNEL CHART & RECENT INTERACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PROFESSIONAL INTERACTION FUNNEL CHART */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interaction Funnel Progression</h3>
            
          </div>

          {/* PROFESSIONAL FUNNEL STAGES */}
          <div className="space-y-2.5 pt-1">
            {funnelStages.map((f, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-full py-2.5 px-4 bg-gradient-to-r ${f.color} rounded-xl shadow-lg border border-white/10 flex items-center justify-between transition-all duration-300`}
                  style={{ width: `${f.widthPct}%` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{f.icon}</span>
                    <div>
                      <span className="font-extrabold text-white text-xs tracking-wider uppercase block">{f.stage}</span>
                      <span className="text-[9px] text-white/80 font-medium block">{f.subLabel}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-white text-xs block">{formatNumber(f.count)} Customers</span>
                    <span className="text-[9px] text-white font-bold bg-black/30 px-2 py-0.5 rounded border border-white/20 inline-block mt-0.5">
                      {f.convFromPrev}
                    </span>
                  </div>
                </div>
                {idx < funnelStages.length - 1 && (
                  <div className="text-slate-500 text-[10px] py-0.5">▼</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RECENT PRODUCT INTERACTIONS */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Interactions Detected</h3>
            
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {recentInteractions.map((act, i) => (
                  <tr key={i} className="hover:bg-[#070C18]/50 transition">
                    <td className="py-2.5 text-slate-400">{act.time}</td>
                    <td className="py-2.5 font-bold text-white">{act.product}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${act.badgeBg}`}>
                        {act.action}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{act.location}</td>
                    <td className="py-2.5 text-slate-400">{act.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. PROMOTIONS & OFFERS MANAGEMENT SECTION */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono shadow-xl">
        <div className="flex flex-wrap justify-between items-center border-b border-[#1E293B] pb-3 gap-3 font-sans">
          <div className="flex items-center gap-2">
            <span className="text-base">🏷️</span>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Promotions &amp; Offers Management</h3>
          </div>
          <button
            onClick={handleOpenAddPromo}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition shadow-md flex items-center gap-1.5 font-sans"
          >
            <span>➕</span> Add Promotion
          </button>
        </div>

        {/* PROMOTIONS DIRECTORY TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px] font-sans">
                <th className="pb-2.5">ID</th>
                <th className="pb-2.5">Promotion Info</th>
                <th className="pb-2.5">Linked Product</th>
                <th className="pb-2.5">Shelf/Zone</th>
                <th className="pb-2.5">Offer Type &amp; Discount</th>
                <th className="pb-2.5">Dates</th>
                <th className="pb-2.5">Price (Orig/Offer)</th>
                <th className="pb-2.5">Expected Profit</th>
                <th className="pb-2.5 text-center">Purchases</th>
                <th className="pb-2.5">Actual Profit / Revenue</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {promotionsList.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-6 text-center text-slate-500 italic">No promotions configured in system.</td>
                </tr>
              ) : (
                promotionsList.map((promo) => {
                  const prod = productsList.find(p => p.id === promo.productId) || { name: "Unknown", category: "N/A", sellingPrice: 0, costPrice: 0, shelf: "" };
                  const shelf = shelvesList.find(s => s.id === prod.shelf) || { name: "Unassigned", zone: "N/A" };
                  const stats = getProductStats(prod);
                  
                  // Discount Price Parsing
                  let offerPrice = prod.sellingPrice;
                  if (promo.offerType === "BOGO" || promo.discount.toLowerCase().includes("bogo") || promo.discount.toLowerCase().includes("get 1")) {
                    offerPrice = prod.sellingPrice * 0.5;
                  } else if (promo.offerType === "Percentage" || promo.discount.includes("%")) {
                    const pct = parseFloat(promo.discount.replace(/[^0-9.]/g, "")) || 0;
                    offerPrice = prod.sellingPrice * (1 - pct / 100);
                  } else if (promo.offerType === "Fixed Amount" || promo.discount.toLowerCase().includes("off") || promo.discount.includes("$")) {
                    const amt = parseFloat(promo.discount.replace(/[^0-9.]/g, "")) || 0;
                    offerPrice = Math.max(0, prod.sellingPrice - amt);
                  }
                  
                  const expectedProfit = offerPrice - prod.costPrice;
                  const revenue = stats.purchases * offerPrice;
                  const actualProfit = stats.purchases * expectedProfit;

                  return (
                    <tr key={promo.id} className="hover:bg-[#070C18]/40 transition">
                      <td className="py-3 text-indigo-400 font-bold">{promo.id}</td>
                      <td className="py-3">
                        <span className="font-extrabold text-white block font-sans">{promo.name}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{prod.category}</span>
                      </td>
                      <td className="py-3 text-slate-200">
                        <span className="block">{prod.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {promo.productId}</span>
                      </td>
                      <td className="py-3 text-slate-300">
                        <span className="block">{shelf.name}</span>
                        <span className="text-[10px] text-indigo-400 font-sans">{shelf.zone}</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] block w-fit mb-1">{promo.offerType}</span>
                        <span className="text-white font-bold">{promo.discount}</span>
                      </td>
                      <td className="py-3 text-slate-400 text-[10px]">
                        <div>Start: {promo.startDate}</div>
                        <div>End: {promo.endDate}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-slate-400 line-through">${prod.sellingPrice.toFixed(2)}</div>
                        <div className="text-emerald-400 font-extrabold font-mono">${offerPrice.toFixed(2)}</div>
                      </td>
                      <td className="py-3 text-indigo-300 font-bold">${expectedProfit.toFixed(2)}</td>
                      <td className="py-3 text-center text-white font-extrabold">{stats.purchases}</td>
                      <td className="py-3 font-mono">
                        <div className="text-indigo-400 font-extrabold">Profit: ${actualProfit.toFixed(2)}</div>
                        <div className="text-slate-400 text-[9px]">Rev: ${revenue.toFixed(2)}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${
                          promo.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                          promo.status === "Paused" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/30"
                        }`}>
                          {promo.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditPromo(promo)}
                            className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded border border-indigo-500/30 transition text-[9px] font-bold"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo.id)}
                            className="px-1.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded border border-rose-500/30 transition text-[9px]"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT PROMOTION MODAL */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>🏷️</span> {editingPromo ? "Edit Promotion Offer" : "Create New Promotion"}
              </h3>
              <button 
                onClick={() => setIsPromoModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold text-sm bg-[#1E293B] hover:bg-rose-600/30 w-7 h-7 rounded-lg flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePromoFormSubmit} className="space-y-4 font-mono">
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Promotion Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midweek Milk Splash"
                  value={promoFormState.name}
                  onChange={(e) => {
                    setPromoFormState({ ...promoFormState, name: e.target.value });
                    setPromoErrors({ ...promoErrors, name: "" });
                  }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                    promoErrors.name ? "border-rose-500" : "border-[#1E293B]"
                  }`}
                />
                {promoErrors.name && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {promoErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Product Node <span className="text-rose-400">*</span></label>
                  <select
                    value={promoFormState.productId}
                    onChange={(e) => {
                      setPromoFormState({ ...promoFormState, productId: e.target.value });
                      setPromoErrors({ ...promoErrors, productId: "" });
                    }}
                    className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                      promoErrors.productId ? "border-rose-500" : "border-[#1E293B]"
                    }`}
                  >
                    <option value="">— Select Product —</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.sellingPrice.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {promoErrors.productId && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {promoErrors.productId}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Offer Type</label>
                  <select
                    value={promoFormState.offerType}
                    onChange={(e) => setPromoFormState({ ...promoFormState, offerType: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Percentage">Percentage Discount</option>
                    <option value="Fixed Amount">Fixed Amount Discount</option>
                    <option value="BOGO">BOGO (Buy 1 Get 1)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Discount Value <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 15% Off or Buy 1 Get 1"
                    value={promoFormState.discount}
                    onChange={(e) => {
                      setPromoFormState({ ...promoFormState, discount: e.target.value });
                      setPromoErrors({ ...promoErrors, discount: "" });
                    }}
                    className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                      promoErrors.discount ? "border-rose-500" : "border-[#1E293B]"
                    }`}
                  />
                  {promoErrors.discount && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {promoErrors.discount}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Status</label>
                  <select
                    value={promoFormState.status}
                    onChange={(e) => setPromoFormState({ ...promoFormState, status: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Start Date <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    value={promoFormState.startDate}
                    onChange={(e) => {
                      setPromoFormState({ ...promoFormState, startDate: e.target.value });
                      setPromoErrors({ ...promoErrors, startDate: "" });
                    }}
                    className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition ${
                      promoErrors.startDate ? "border-rose-500" : "border-[#1E293B]"
                    }`}
                  />
                  {promoErrors.startDate && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {promoErrors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">End Date <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    value={promoFormState.endDate}
                    onChange={(e) => {
                      setPromoFormState({ ...promoFormState, endDate: e.target.value });
                      setPromoErrors({ ...promoErrors, endDate: "" });
                    }}
                    className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition ${
                      promoErrors.endDate ? "border-rose-500" : "border-[#1E293B]"
                    }`}
                  />
                  {promoErrors.endDate && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {promoErrors.endDate}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B] font-sans">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold hover:bg-[#273449] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold transition shadow-md"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert message display */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0F172A] border-2 border-emerald-500 text-emerald-400 font-bold font-mono px-4 py-3 rounded-xl shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
