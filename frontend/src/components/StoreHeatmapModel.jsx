import React, { useState, useEffect } from "react";

const BASE_CARDS = [
  { id: "bakery", name: "Bakery", icon: "🍞", x: 12, y: 18 },
  { id: "dairy", name: "Dairy", icon: "🥛", x: 30, y: 18 },
  { id: "beverages", name: "Beverages", icon: "🥤", x: 44, y: 38 },
  { id: "snacks", name: "Snacks", icon: "🍿", x: 62, y: 18 },
  { id: "household", name: "Household", icon: "🧹", x: 77, y: 18 },
  { id: "produce", name: "Produce", icon: "🍎", x: 12, y: 50 },
  { id: "frozen", name: "Frozen Foods", icon: "❄️", x: 44, y: 58 },
  { id: "personal", name: "Personal Care", icon: "🧴", x: 73, y: 50 },
  { id: "entrance", name: "Store Entrance", icon: "ℹ️", x: 15, y: 76 },
  { id: "checkout", name: "Checkout Area", icon: "🛒", x: 43, y: 78 },
  { id: "exit", name: "Exit", icon: "🚪", x: 72, y: 76 },
];

// Supermarket Blueprint Shelf Structure
const SHELF_STRUCTURES = [
  { x: 10, y: 14, w: 16, h: 22, label: "Bakery Racks" },
  { x: 28, y: 14, w: 14, h: 22, label: "Dairy Coolers" },
  { x: 60, y: 14, w: 14, h: 22, label: "Snack Displays" },
  { x: 76, y: 14, w: 15, h: 22, label: "Household Shelves" },
  { x: 42, y: 34, w: 16, h: 16, label: "Beverage Hub" },
  { x: 42, y: 54, w: 16, h: 16, label: "Freezer Island" },
  { x: 10, y: 46, w: 16, h: 22, label: "Produce Bins" },
  { x: 72, y: 46, w: 16, h: 22, label: "Personal Care" },
  { x: 12, y: 74, w: 18, h: 14, label: "Entrance Foyer" },
  { x: 38, y: 74, w: 24, h: 14, label: "Checkout Counters" },
  { x: 70, y: 74, w: 18, h: 14, label: "Exit Lobby" },
];

const HEATMAP_PRESETS = {
  "Today": {
    dateLabel: "Aug 06, 2026",
    people: { bakery: 7, dairy: 6, beverages: 18, snacks: 12, household: 7, produce: 9, frozen: 8, personal: 4, entrance: 14, checkout: 18, exit: 10 },
    heat: { bakery: 45, dairy: 40, beverages: 96, snacks: 85, household: 60, produce: 65, frozen: 55, personal: 50, entrance: 80, checkout: 98, exit: 49 }
  },
  "Yesterday": {
    dateLabel: "Aug 05, 2026",
    people: { bakery: 6, dairy: 5, beverages: 16, snacks: 11, household: 6, produce: 8, frozen: 7, personal: 3, entrance: 13, checkout: 16, exit: 9 },
    heat: { bakery: 41, dairy: 38, beverages: 88, snacks: 78, household: 55, produce: 60, frozen: 50, personal: 45, entrance: 74, checkout: 90, exit: 45 }
  },
  "Last 7 Days": {
    dateLabel: "Jul 30 - Aug 05, 2025",
    people: { bakery: 7, dairy: 6, beverages: 18, snacks: 12, household: 7, produce: 9, frozen: 8, personal: 4, entrance: 14, checkout: 18, exit: 10 },
    heat: { bakery: 45, dairy: 40, beverages: 96, snacks: 85, household: 60, produce: 65, frozen: 55, personal: 50, entrance: 80, checkout: 98, exit: 49 }
  },
  "Last 30 Days": {
    dateLabel: "Jul 08 - Aug 05, 2025",
    people: { bakery: 28, dairy: 24, beverages: 72, snacks: 48, household: 28, produce: 36, frozen: 32, personal: 16, entrance: 56, checkout: 72, exit: 40 },
    heat: { bakery: 55, dairy: 48, beverages: 99, snacks: 92, household: 68, produce: 74, frozen: 62, personal: 58, entrance: 88, checkout: 99, exit: 58 }
  }
};

function getHeatColorStyle(heat) {
  if (heat > 80) return { text: "text-rose-400 font-black", border: "border-rose-500/80 shadow-rose-500/50", badge: "bg-rose-500/20 text-rose-400" };
  if (heat > 60) return { text: "text-amber-400 font-extrabold", border: "border-amber-500/70 shadow-amber-500/40", badge: "bg-amber-500/20 text-amber-400" };
  if (heat > 40) return { text: "text-emerald-400 font-bold", border: "border-emerald-500/60 shadow-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-400" };
  return { text: "text-blue-400 font-bold", border: "border-blue-500/50 shadow-blue-500/20", badge: "bg-blue-500/20 text-blue-400" };
}

// Localized Thermal Hotspot Radial Gradient helper matching Reference Image
function getRadialGradientStyle(heat) {
  if (heat > 80) {
    // RED / VERY HIGH ATTENTION HOTSPOT
    return "radial-gradient(circle, rgba(225,29,72,0.92) 0%, rgba(245,158,11,0.70) 40%, rgba(16,185,129,0.35) 70%, transparent 100%)";
  } else if (heat > 60) {
    // YELLOW / HIGH ATTENTION HOTSPOT
    return "radial-gradient(circle, rgba(245,158,11,0.85) 0%, rgba(16,185,129,0.55) 50%, rgba(59,130,246,0.25) 78%, transparent 100%)";
  } else if (heat > 40) {
    // GREEN / MEDIUM ATTENTION HOTSPOT
    return "radial-gradient(circle, rgba(16,185,129,0.75) 0%, rgba(59,130,246,0.45) 55%, transparent 100%)";
  } else {
    // BLUE / LOW ATTENTION HOTSPOT
    return "radial-gradient(circle, rgba(59,130,246,0.65) 0%, rgba(6,182,212,0.35) 55%, transparent 100%)";
  }
}

export default function StoreHeatmapModel() {
  const [activeView, setActiveView] = useState("Heatmap View");
  const [dateFilter, setDateFilter] = useState("Last 7 Days");

  const [agents, setAgents] = useState([
    { id: 1, x: 44, y: 15, targetX: 44, targetY: 38, zone: "beverages" },
    { id: 2, x: 15, y: 76, targetX: 12, targetY: 50, zone: "produce" },
    { id: 3, x: 62, y: 18, targetX: 62, targetY: 18, zone: "snacks" },
    { id: 4, x: 43, y: 78, targetX: 43, targetY: 78, zone: "checkout" },
    { id: 5, x: 30, y: 18, targetX: 44, targetY: 38, zone: "dairy" },
    { id: 6, x: 73, y: 50, targetX: 72, targetY: 76, zone: "personal" },
    { id: 7, x: 12, y: 18, targetX: 12, targetY: 18, zone: "bakery" },
    { id: 8, x: 77, y: 18, targetX: 77, targetY: 18, zone: "household" },
  ]);

  const activePreset = HEATMAP_PRESETS[dateFilter] || HEATMAP_PRESETS["Last 7 Days"];
  const [zoneHeat, setZoneHeat] = useState(activePreset.heat);
  const [zonePeople, setZonePeople] = useState(activePreset.people);

  useEffect(() => {
    const preset = HEATMAP_PRESETS[dateFilter] || HEATMAP_PRESETS["Last 7 Days"];
    setZoneHeat(preset.heat);
    setZonePeople(preset.people);
  }, [dateFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prevAgents => {
        return prevAgents.map(ag => {
          const dx = ag.targetX - ag.x;
          const dy = ag.targetY - ag.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let newX = ag.x;
          let newY = ag.y;
          let newTargetX = ag.targetX;
          let newTargetY = ag.targetY;
          let newZone = ag.zone;

          if (dist < 1.0) {
            const nextCard = BASE_CARDS[Math.floor(Math.random() * BASE_CARDS.length)];
            newTargetX = nextCard.x;
            newTargetY = nextCard.y;
            newZone = nextCard.id;
          } else {
            const step = 0.5;
            newX += (dx / dist) * step;
            newY += (dy / dist) * step;
          }

          return {
            ...ag,
            x: parseFloat(newX.toFixed(1)),
            y: parseFloat(newY.toFixed(1)),
            targetX: newTargetX,
            targetY: newTargetY,
            zone: newZone
          };
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [agents]);

  return (
    <div className="w-full bg-[#040814] text-slate-100 font-sans rounded-2xl border border-[#1E293B] p-5 shadow-2xl space-y-4">
      {/* ── TOP CONTROLS & DATE SELECTORS ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B]/80 pb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-[9px] shadow-sm shadow-rose-500/50 animate-pulse">🔥</div>
            <h2 className="text-base font-extrabold text-white tracking-wide">Store Heatmap</h2>
          </div>

          <div className="flex items-center bg-[#0B132B] p-1 rounded-xl border border-[#1E293B]">
            <button
              onClick={() => setActiveView("Heatmap View")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === "Heatmap View"
                  ? "bg-[#1E293B] text-blue-400 border border-blue-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="mr-1.5">○</span>Heatmap View
            </button>
            <button
              onClick={() => setActiveView("Traffic Flow")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === "Traffic Flow"
                  ? "bg-[#1E293B] text-blue-400 border border-blue-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="mr-1.5">☖</span>Traffic Flow
            </button>
          </div>
        </div>

        {/* Date Filters Buttons & Date Range Label */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <div className="flex items-center bg-[#0B132B] p-1 rounded-xl border border-[#1E293B] text-xs">
            {["Today", "Yesterday", "Last 7 Days", "Last 30 Days"].map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  dateFilter === df
                    ? "bg-[#1E293B] text-blue-400 border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {df}
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 bg-[#0B132B] border border-[#1E293B] rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <span>{activePreset.dateLabel}</span>
            <span>📅</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CANVAS & LEGEND ROW ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        
        {/* SUPERMARKET BLUEPRINT CANVAS */}
        <div className="relative flex-1 min-h-[540px] bg-[#070D1D] rounded-2xl border border-[#1E293B] overflow-hidden p-4">
          
          {/* Blueprint Grid Pattern Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#131C31_1px,transparent_1px),linear-gradient(to_bottom,#131C31_1px,transparent_1px)] bg-[size:28px_28px] opacity-35 pointer-events-none"></div>

          {/* SUPERMARKET SHELF STRUCTURES & AISLES (ARCHITECTURAL FLOORPLAN) */}
          <div className="absolute inset-0 pointer-events-none">
            {SHELF_STRUCTURES.map((s, i) => (
              <div
                key={i}
                className="absolute bg-[#0D182E]/80 border border-[#1E293B] rounded-lg flex items-center justify-center shadow-inner"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${s.w}%`,
                  height: `${s.h}%`
                }}
              >
                <span className="text-[9px] font-mono text-slate-600 font-bold uppercase tracking-wider text-center px-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* DASHED TRAFFIC PATHWAYS LAYER (MATCHING REFERENCE IMAGE) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
            {/* Entrance -> Center Pathway */}
            <path d="M 50% 5% L 50% 36%" stroke="#38BDF8" strokeWidth="2" strokeDasharray="5,5" fill="none" />
            <polygon points="49,36 51,36 50,39" fill="#38BDF8" />

            {/* Entrance -> Bakery / Produce Loop */}
            <path d="M 50% 12% L 20% 12% A 8 8 0 0 0 12% 20% L 12% 48%" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />

            {/* Entrance -> Snacks / Personal Care Loop */}
            <path d="M 50% 12% L 70% 12% A 8 8 0 0 1 78% 20% L 78% 48%" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />

            {/* Central -> Checkout Area */}
            <path d="M 50% 46% L 50% 76%" stroke="#38BDF8" strokeWidth="2" strokeDasharray="5,5" fill="none" />
          </svg>

          {/* MAIN ENTRANCE TOP MARKER */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none font-mono">
            <span className="text-[11px] font-extrabold text-blue-400 tracking-wider uppercase bg-[#070D1D]/90 px-2 py-0.5 rounded border border-blue-500/30">Main Entrance</span>
            <span className="text-blue-400 text-xs animate-bounce mt-0.5">▼</span>
          </div>

          {/* LOCALIZED RADIAL THERMAL HOTSPOTS (IMAGE REFERENCE ACCURATE HEATMAP) */}
          <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
            {BASE_CARDS.map(c => {
              const h = zoneHeat[c.id] || 40;
              const gradStyle = getRadialGradientStyle(h);
              const spotSize = h > 80 ? 210 : h > 60 ? 170 : h > 40 ? 130 : 100;

              return (
                <div
                  key={c.id}
                  className="absolute rounded-full transition-all duration-700 opacity-95 mix-blend-screen"
                  style={{
                    left: `calc(${c.x + 6}% - ${spotSize / 2}px)`,
                    top: `calc(${c.y + 6}% - ${spotSize / 2}px)`,
                    width: `${spotSize}px`,
                    height: `${spotSize}px`,
                    background: gradStyle,
                    filter: "blur(10px)"
                  }}
                />
              );
            })}
          </div>

          {/* TRAFFIC FLOW MODE: ANIMATED CUSTOMER MOTION TRAILS & VECTORS */}
          {activeView === "Traffic Flow" && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-25 opacity-80">
              {agents.map(ag => (
                <g key={ag.id}>
                  <line
                    x1={`${ag.x + 5}%`}
                    y1={`${ag.y + 5}%`}
                    x2={`${ag.targetX + 5}%`}
                    y2={`${ag.targetY + 5}%`}
                    stroke="#60A5FA"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                  <circle
                    cx={`${ag.x + 5}%`}
                    cy={`${ag.y + 5}%`}
                    r="4"
                    fill="#38BDF8"
                    className="animate-ping"
                  />
                </g>
              ))}
            </svg>
          )}

          {/* DYNAMIC ZONE CARDS OVERLAY */}
          <div className="relative z-30 w-full h-full font-mono">
            {BASE_CARDS.map(card => {
              const heat = zoneHeat[card.id] || 40;
              const people = zonePeople[card.id] || 5;
              const styling = getHeatColorStyle(heat);

              return (
                <div
                  key={card.id}
                  className={`absolute bg-[#0A1224]/95 border ${styling.border} p-2.5 rounded-xl shadow-2xl backdrop-blur-md min-w-[135px] transition-all duration-300 hover:scale-105 cursor-pointer`}
                  style={{ left: `${card.x}%`, top: `${card.y}%` }}
                >
                  {/* Card Header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">{card.icon}</span>
                    <span className="font-bold text-white text-[11px] truncate tracking-wide">{card.name}</span>
                  </div>

                  {/* Card Footer Metrics */}
                  <div className="flex items-center justify-between text-[10px] border-t border-[#1E293B]/80 pt-1">
                    <div className="flex items-center gap-1 text-slate-300 font-bold">
                      <span className="text-[9px] text-purple-400">👥</span>
                      <span>{people} People</span>
                    </div>
                    <span className={`font-mono ${styling.text}`}>{Math.round(heat)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE LEGEND BAR (ATTENTION LEVEL) */}
        <div className="w-full lg:w-44 bg-[#070D1D] rounded-2xl border border-[#1E293B] p-4 flex flex-col justify-between font-mono">
          <h3 className="text-xs font-extrabold text-white tracking-wider uppercase text-center mb-3">
            Attention Level
          </h3>

          <div className="flex-1 flex items-center justify-center gap-4 py-2">
            {/* Thermal Color Bar (Red -> Yellow -> Green -> Blue) */}
            <div className="w-4 h-full min-h-[300px] rounded-full bg-gradient-to-b from-rose-600 via-amber-400 via-emerald-400 to-blue-600 shadow-inner"></div>

            {/* Scale Labels */}
            <div className="flex flex-col justify-between h-full min-h-[300px] text-[10px] font-bold">
              <div className="space-y-0.5">
                <span className="text-rose-400 block font-black">High</span>
                <span className="text-[9px] text-slate-400 font-normal block">&gt; 75%</span>
              </div>
              <div className="space-y-0.5 my-auto">
                <span className="text-amber-400 block font-bold">Medium</span>
                <span className="text-[9px] text-slate-400 font-normal block">55% - 75%</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-emerald-400 block font-bold">Normal</span>
                <span className="text-[9px] text-slate-400 font-normal block">35% - 55%</span>
              </div>
              <div className="space-y-0.5 pt-2">
                <span className="text-blue-400 block font-bold">Low</span>
                <span className="text-[9px] text-slate-400 font-normal block">&lt; 35%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
