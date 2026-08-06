import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ShelfManagement() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'shelves' | 'heatmap' | 'zones'
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const [isAddShelfOpen, setIsAddShelfOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState(null);

  // Shelves dataset
  const [shelvesList, setShelvesList] = useState([
    { id: "SH-101", name: "Premium Smartphone Display B", store: "Store 1 - Koramangala", zone: "Zone A - Electronics", category: "Smartphones", coords: "X: 12m, Y: 4m", dims: "2.4m x 1.8m x 0.6m", tiers: 4, status: "Active", attentionScore: 94, dwellMins: 4.8 },
    { id: "SH-102", name: "Smart Wearables & Watch Rack", store: "Store 1 - Koramangala", zone: "Zone A - Electronics", category: "Wearables", coords: "X: 16m, Y: 4m", dims: "1.8m x 1.5m x 0.5m", tiers: 3, status: "Active", attentionScore: 82, dwellMins: 3.5 },
    { id: "SH-201", name: "Designer Denim Wall Display", store: "Store 2 - Indiranagar", zone: "Zone B - Apparel", category: "Fashion", coords: "X: 8m, Y: 12m", dims: "3.2m x 2.2m x 0.8m", tiers: 5, status: "Active", attentionScore: 88, dwellMins: 4.1 },
    { id: "SH-301", name: "Organic Snacks & Beverages Bay", store: "Store 3 - Hyderabad", zone: "Zone C - Grocery", category: "Snacks & Drinks", coords: "X: 5m, Y: 18m", dims: "4.0m x 2.0m x 0.9m", tiers: 6, status: "Active", attentionScore: 71, dwellMins: 2.9 },
    { id: "SH-401", name: "Luxury Perfumes & Skincare", store: "Store 4 - Andheri", zone: "Zone D - Cosmetics", category: "Cosmetics", coords: "X: 20m, Y: 6m", dims: "2.0m x 1.8m x 0.6m", tiers: 4, status: "Active", attentionScore: 91, dwellMins: 5.2 },
    { id: "SH-501", name: "Clearance Electronics Stand", store: "Store 5 - Connaught Place", zone: "Zone A - Electronics", category: "Accessories", coords: "X: 22m, Y: 14m", dims: "1.5m x 1.2m x 0.5m", tiers: 3, status: "Inactive", attentionScore: 32, dwellMins: 1.1 },
  ]);

  // Zone attention overview dataset
  const zoneAttentionData = [
    { zone: "Zone A (Electronics)", avgScore: 89, dwell: 4.5, activeShelves: 14, footfall: "18.4K" },
    { zone: "Zone B (Apparel)", avgScore: 84, dwell: 3.9, activeShelves: 18, footfall: "16.2K" },
    { zone: "Zone C (Grocery)", avgScore: 72, dwell: 2.8, activeShelves: 22, footfall: "22.1K" },
    { zone: "Zone D (Cosmetics)", avgScore: 91, dwell: 5.1, activeShelves: 10, footfall: "12.8K" },
    { zone: "Zone E (Checkout)", avgScore: 78, dwell: 2.2, activeShelves: 8, footfall: "24.5K" },
  ];

  // Live heatmap visual matrix
  const shelfHeatmapMatrix = [
    { shelf: "SH-101 (Smartphones)", score: 94, intensity: "High Attention", color: "bg-rose-500", detail: "94/100 Gaze index" },
    { shelf: "SH-401 (Cosmetics)", score: 91, intensity: "High Attention", color: "bg-rose-500", detail: "91/100 Gaze index" },
    { shelf: "SH-201 (Fashion Wall)", score: 88, intensity: "High Attention", color: "bg-amber-500", detail: "88/100 Gaze index" },
    { shelf: "SH-102 (Wearables)", score: 82, intensity: "Medium Attention", color: "bg-amber-500", detail: "82/100 Gaze index" },
    { shelf: "SH-301 (Grocery Bay)", score: 71, intensity: "Medium Attention", color: "bg-emerald-500", detail: "71/100 Gaze index" },
    { shelf: "SH-501 (Clearance)", score: 32, intensity: "Low Attention", color: "bg-blue-500", detail: "32/100 Gaze index" },
  ];

  // Filtering
  const filteredShelves = shelvesList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStore = storeFilter === "All" || s.store === storeFilter;
    const matchZone = zoneFilter === "All" || s.zone === zoneFilter;
    const matchCat = categoryFilter === "All" || s.category === categoryFilter;
    return matchSearch && matchStore && matchZone && matchCat;
  });

  const activeShelvesCount = shelvesList.filter(s => s.status === "Active").length;
  const inactiveShelvesCount = shelvesList.filter(s => s.status === "Inactive").length;

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>📦</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h1 className="text-xl font-black text-white tracking-wide">Shelf Management & Layout Optimization</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-widest">
              Planogram & Attention Analytics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure retail shelf layouts, physical coordinates, zone assignments, and analyze shopper attention heatmaps for optimal product placement.
          </p>
        </div>

        <button
          onClick={() => setIsAddShelfOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
        >
          <span>+</span> Configure New Shelf
        </button>
      </div>

      {/* Real-time Shelf Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total Configured Shelves</span>
          <h2 className="text-lg font-black text-white font-mono">{shelvesList.length} Shelves</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">Mapped across 18 stores</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Active vs Inactive</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">{activeShelvesCount} Active / {inactiveShelvesCount} Inactive</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">94% Active Tracking</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Available Store Zones</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">5 Major Zones</h2>
          <span className="text-[10px] text-purple-300 font-bold block">Electronics, Apparel, Grocery, etc.</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Average Network Attention Score</span>
          <h2 className="text-lg font-black text-indigo-400 font-mono">86.2 / 100</h2>
          <span className="text-[10px] text-indigo-400 font-bold block">High engagement density</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "📊 Shelf Layout Directory", count: filteredShelves.length },
          { id: "heatmap", label: "🌡️ Integrated Attention Heatmap", count: "Live Stream" },
          { id: "zones", label: "📍 Zone Attention Overview", count: "5 Zones" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap
              ${activeTab === t.id
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-black/30 font-mono">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: SHELF LAYOUT DIRECTORY ───────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                placeholder="🔍 Search shelves by ID, name, or product category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1 min-w-[200px]"
              />

              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Stores</option>
                <option value="Store 1 - Koramangala">Store 1 - Koramangala</option>
                <option value="Store 2 - Indiranagar">Store 2 - Indiranagar</option>
                <option value="Store 3 - Hyderabad">Store 3 - Hyderabad</option>
                <option value="Store 4 - Andheri">Store 4 - Andheri</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Categories</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Wearables">Wearables</option>
                <option value="Fashion">Fashion</option>
                <option value="Snacks & Drinks">Snacks & Drinks</option>
                <option value="Cosmetics">Cosmetics</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredShelves.length}</strong> shelves
            </span>
          </div>

          {/* Shelves Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShelves.map((sh) => (
              <div key={sh.id} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 hover:border-slate-600 transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-white text-sm">{sh.name}</h3>
                      <span className="text-[11px] text-indigo-400 font-mono block">{sh.id} • {sh.category}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sh.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
                      ● {sh.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 bg-[#070C18] p-3 rounded-xl border border-[#1E293B] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Assigned Store</span>
                      <span className="font-bold text-slate-200 truncate block">{sh.store}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Store Zone</span>
                      <span className="font-bold text-indigo-300 truncate block">{sh.zone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Coordinates (X,Y)</span>
                      <span className="font-mono text-slate-300">{sh.coords}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Dimensions</span>
                      <span className="font-mono text-slate-300">{sh.dims}</span>
                    </div>
                  </div>

                  {/* Attention metric pill */}
                  <div className="mt-3 flex items-center justify-between bg-[#1E293B]/50 p-2.5 rounded-xl border border-[#1E293B]">
                    <span className="text-xs text-slate-300 font-bold">Shopper Attention Score:</span>
                    <span className="text-sm font-black text-rose-400 font-mono">{sh.attentionScore} / 100</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1E293B] flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[10px]">{sh.tiers} Display Tiers</span>
                  <button
                    onClick={() => setSelectedShelf(sh)}
                    className="px-3 py-1 bg-[#1E293B] hover:bg-[#273552] text-indigo-300 font-bold rounded-lg text-[11px] border border-indigo-500/20 transition"
                  >
                    View Layout Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: INTEGRATED ATTENTION HEATMAP ─────────────────────────── */}
      {activeTab === "heatmap" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🌡️</span> Shelf Engagement Visual Heatmap Grid
              </h3>
              <span className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full animate-pulse">
                ● Live Shopper Engagement Tracking
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Visual floorplan attention matrix highlighting high-attention hotspot shelves vs low-attention cold zones.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {shelfHeatmapMatrix.map((hm, i) => (
                <div key={i} className="bg-[#070C18] border border-[#1E293B] p-4 rounded-xl space-y-2 hover:border-slate-500 transition">
                  <div className="flex items-center justify-between">
                    <span className={`w-3 h-3 rounded-full ${hm.color} shadow-lg`}></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{hm.intensity}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{hm.shelf}</h4>
                  <div className="text-sm font-black font-mono text-rose-400">{hm.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>💡</span> AI Shelf Optimization Insights
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#070C18] border border-amber-500/30 rounded-xl space-y-1">
                <span className="font-bold text-amber-400 block">⚠️ Cold Spot Alert: Shelf SH-501</span>
                <p className="text-slate-300 text-[11px]">Clearance Stand has only 32/100 attention score. Relocate closer to Zone A Entrance for +35% visibility.</p>
              </div>
              <div className="p-3 bg-[#070C18] border border-emerald-500/30 rounded-xl space-y-1">
                <span className="font-bold text-emerald-400 block">✨ High Attention Hotspot: SH-101</span>
                <p className="text-slate-300 text-[11px]">Smartphone Display B garners 4.8 mins avg dwell time. Recommend placing high-margin accessories on tier 2 & 3.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ZONE ATTENTION OVERVIEW ─────────────────────────────── */}
      {activeTab === "zones" && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📍</span> Zone Attention & Dwell Time Comparison
            </h3>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneAttentionData}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis dataKey="zone" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                  <Bar dataKey="avgScore" fill="#6366F1" radius={[6, 6, 0, 0]} name="Attention Score (0-100)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 overflow-hidden">
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Zone Breakdown Table</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-4">Store Zone</th>
                    <th className="py-3 px-4">Attention Score</th>
                    <th className="py-3 px-4">Avg Dwell Time</th>
                    <th className="py-3 px-4">Active Shelves</th>
                    <th className="py-3 px-4">Zone Footfall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {zoneAttentionData.map((z, idx) => (
                    <tr key={idx} className="hover:bg-[#1E293B]/40 transition">
                      <td className="py-3 px-4 font-bold text-white">{z.zone}</td>
                      <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{z.avgScore} / 100</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{z.dwell} Mins</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{z.activeShelves} Shelves</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{z.footfall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SHELF DETAILS ─────────────────────────────────────────── */}
      {selectedShelf && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedShelf.name}</h3>
                <span className="text-xs text-indigo-400 font-mono">{selectedShelf.id}</span>
              </div>
              <button onClick={() => setSelectedShelf(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs bg-[#070C18] p-4 rounded-xl border border-[#1E293B]">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Store</span>
                <span className="font-bold text-slate-200">{selectedShelf.store}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Store Zone</span>
                <span className="font-bold text-indigo-300">{selectedShelf.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product Category</span>
                <span className="font-bold text-slate-200">{selectedShelf.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Floor Coordinates</span>
                <span className="font-mono text-slate-200">{selectedShelf.coords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Physical Dimensions</span>
                <span className="font-mono text-slate-200">{selectedShelf.dims}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Display Tiers</span>
                <span className="font-mono text-slate-200">{selectedShelf.tiers} Tiers</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                onClick={() => {
                  showToast(`Planogram parameters updated for ${selectedShelf.id}`);
                  setSelectedShelf(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
              >
                Edit Planogram
              </button>
              <button onClick={() => setSelectedShelf(null)} className="px-4 py-2 bg-[#1E293B] text-slate-300 font-bold rounded-xl text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIGURE NEW SHELF ────────────────────────────────────── */}
      {isAddShelfOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">📦 Configure New Shelf Unit</h3>
              <button onClick={() => setIsAddShelfOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast("New Shelf configured and added to Attention Matrix!");
              setIsAddShelfOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Shelf Display Name</label>
                <input type="text" required placeholder="e.g. Premium Audio Rack" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Assigned Store</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                  <option>Store 1 - Koramangala</option>
                  <option>Store 2 - Indiranagar</option>
                  <option>Store 3 - Hyderabad</option>
                  <option>Store 4 - Andheri</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Store Zone & Product Category</label>
                <input type="text" required placeholder="Zone A - Electronics / Wearables" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Coordinates (X,Y)</label>
                  <input type="text" required placeholder="X: 10m, Y: 5m" className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Dimensions (W x H x D)</label>
                  <input type="text" required placeholder="2.0m x 1.8m x 0.5m" className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsAddShelfOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Save Shelf Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
