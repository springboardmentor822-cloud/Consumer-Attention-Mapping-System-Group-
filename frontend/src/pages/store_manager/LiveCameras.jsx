import React, { useState, useEffect } from "react";
import { useCams } from "../../services/CamsContext";

const CAMERAS = [
  { id: "CAM-01", name: "Camera 1 - Bakery Endcap", location: "Bakery A1", res: "1080p FHD", fps: 30, ip: "192.168.1.101", path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", baseCount: 6, zones: ["Bakery Endcap A1", "Dairy Section B2", "Central Aisle"] },
  { id: "CAM-02", name: "Camera 2 - Produce Section", location: "Produce C1", res: "4K UHD", fps: 30, ip: "192.168.1.102", path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", baseCount: 8, zones: ["Produce Bins C1", "Organic Wall", "Central Aisle"] },
  { id: "CAM-03", name: "Camera 3 - Cosmetics Wall", location: "Cosmetics D4", res: "1080p FHD", fps: 28, ip: "192.168.1.103", path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", baseCount: 5, zones: ["Cosmetics Wall D4", "Fragrance Counter", "Checkout Queue"] },
  { id: "CAM-04", name: "Camera 4 - Checkout Queue", location: "Checkout C2", res: "1080p FHD", fps: 30, ip: "192.168.1.104", path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoytimes.mp4", baseCount: 9, zones: ["Checkout Counter 1", "Express Lane", "Exit Lobby"] },
];

const BB_COLORS = ["#10B981", "#06B6D4", "#8B5CF6", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#84CC16"];

// Seeded random helper
function seeded(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  return Math.floor(r * (max - min + 1)) + min;
}

// Deterministic Zone Resolver by Coordinate Position (bbX, bbY)
function resolveZoneByPosition(x, y, activeCam) {
  if (x < 32 && y < 45) return activeCam.zones[0] || "Bakery Endcap A1";
  if (x >= 32 && x < 62 && y < 45) return activeCam.zones[1] || "Dairy Section B2";
  if (x >= 62 && y < 45) return activeCam.zones[2] || "Snack Display D1";
  if (x < 35 && y >= 45) return activeCam.zones[0] || "Produce Bins C1";
  if (x >= 35 && x < 65 && y >= 45) return "Central Aisle";
  return "Checkout Queue";
}

// Build initial trackers with stable IDs & realistic initial states
function createInitialTrackers(cam) {
  const seed = cam.id.charCodeAt(4) * 555;
  const count = cam.baseCount;
  return Array.from({ length: count }, (_, i) => {
    const id = `TRK-${101 + i}`;
    const startX = seeded(seed + i * 17, 10, 68);
    const startY = seeded(seed + i * 23, 15, 55);
    const zone = resolveZoneByPosition(startX, startY, cam);
    return {
      id,
      zone,
      zoneDwellTime: seeded(seed + i * 11, 10, 45),
      totalDwellTime: seeded(seed + i * 11, 30, 180),
      activity: "Walking",
      attentionScore: seeded(seed + i * 13, 70, 96),
      productsViewed: seeded(seed + i * 3, 2, 6),
      productsPicked: seeded(seed + i * 7, 1, 3),
      productsReturned: seeded(seed + i * 19, 0, 1),
      comparisons: seeded(seed + i * 29, 0, 2),
      status: "Active",
      color: BB_COLORS[i % BB_COLORS.length],
      bbX: startX,
      bbY: startY,
      targetX: startX + seeded(seed + i * 31, -12, 12),
      targetY: startY + seeded(seed + i * 37, -8, 8),
      bbW: 12,
      bbH: 22,
      journey: ["Entrance", zone],
    };
  });
}

export default function LiveCameras() {
  const { selectedCamera, setSelectedCamera } = useCams();
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [trackers, setTrackers] = useState([]);
  const [cumulativeCount, setCumulativeCount] = useState(12);
  const [detectionLog, setDetectionLog] = useState([]);
  const activeCam = CAMERAS.find(c => c.id === selectedCamera) || CAMERAS[0];

  // 1. Initialize trackers when active camera changes
  useEffect(() => {
    const initial = createInitialTrackers(activeCam);
    setTrackers(initial);
    setSelectedTracker(null);
    setCumulativeCount(initial.length + 6);
  }, [selectedCamera]);

  // 2. Continuous Real-Time Tracking Engine (100ms tick loop)
  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount += 1;

      setTrackers(prevTrackers => {
        return prevTrackers.map((tr) => {
          const dx = tr.targetX - tr.bbX;
          const dy = tr.targetY - tr.bbY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let newX = tr.bbX;
          let newY = tr.bbY;
          let newTargetX = tr.targetX;
          let newTargetY = tr.targetY;
          let newAct = tr.activity;
          let newViewed = tr.productsViewed;
          let newPicked = tr.productsPicked;
          let newReturned = tr.productsReturned;
          let newComparisons = tr.comparisons;

          if (dist < 1.2) {
            // Reached destination -> stationary dwell near shelf
            newTargetX = Math.max(8, Math.min(75, tr.bbX + (Math.random() - 0.5) * 30));
            newTargetY = Math.max(12, Math.min(60, tr.bbY + (Math.random() - 0.5) * 20));
            
            // Deterministic action transitions based on stationary dwell
            const randAct = Math.random();
            if (randAct < 0.35) {
              newAct = "Viewing Product";
              newViewed += 1;
            } else if (randAct < 0.60) {
              newAct = "Picking Product";
              newPicked += 1;
            } else if (randAct < 0.75) {
              newAct = "Comparing Products";
              newComparisons += 1;
            } else if (randAct < 0.88) {
              newAct = "Browsing";
            } else {
              newAct = "Returning Product";
              newReturned += 1;
            }
          } else {
            // Moving towards waypoint target -> Walking
            newAct = "Walking";
            const speed = 0.35;
            newX += (dx / dist) * speed;
            newY += (dy / dist) * speed;
          }

          // Deterministic Zone derived from current position (newX, newY)
          const newZone = resolveZoneByPosition(newX, newY, activeCam);
          const isNewZone = newZone !== tr.zone;
          
          // Zone Dwell Reset logic: reset zoneDwellTime to 0 on new zone entry
          const newZoneDwell = isNewZone ? 0 : (tickCount % 10 === 0 ? tr.zoneDwellTime + 1 : tr.zoneDwellTime);
          const newTotalDwell = tickCount % 10 === 0 ? tr.totalDwellTime + 1 : tr.totalDwellTime;

          // Journey Trajectory append on zone change
          const newJourney = isNewZone ? [...tr.journey, newZone] : tr.journey;

          return {
            ...tr,
            bbX: parseFloat(newX.toFixed(2)),
            bbY: parseFloat(newY.toFixed(2)),
            targetX: newTargetX,
            targetY: newTargetY,
            activity: newAct,
            zone: newZone,
            zoneDwellTime: newZoneDwell,
            totalDwellTime: newTotalDwell,
            productsViewed: newViewed,
            productsPicked: newPicked,
            productsReturned: newReturned,
            comparisons: newComparisons,
            journey: newJourney,
          };
        });
      });

      // Append detection log every 30 ticks
      if (tickCount % 30 === 0) {
        const events = ["Shopper Detected", "Product Interaction", "Dwell Threshold (30s)", "Product Picked Up", "Product Compared"];
        const ev = events[Math.floor(Math.random() * events.length)];
        const z = activeCam.zones[Math.floor(Math.random() * activeCam.zones.length)];
        const conf = (95.2 + Math.random() * 4.3).toFixed(1);
        const now = new Date().toLocaleTimeString("en-US", { hour12: false });
        setDetectionLog(prev => [
          { time: now, event: ev, zone: z, confidence: `${conf}%`, id: `TRK-${Math.floor(Math.random()*6 + 101)}` },
          ...prev.slice(0, 19)
        ]);
      }

    }, 100);

    return () => clearInterval(interval);
  }, [activeCam]);

  // 3. SYNCHRONIZED REAL-TIME LIVE INFERENCE METRICS DIRECTLY FROM TRACKERS
  const peopleTrackedCount = trackers.length;
  const totalProductsViewed = trackers.reduce((s, t) => s + t.productsViewed, 0);
  const totalProductsPicked = trackers.reduce((s, t) => s + t.productsPicked, 0);
  const totalProductsReturned = trackers.reduce((s, t) => s + t.productsReturned, 0);
  const totalComparisons = trackers.reduce((s, t) => s + t.comparisons, 0);
  const avgDwellSeconds = peopleTrackedCount > 0 ? Math.round(trackers.reduce((s, t) => s + t.totalDwellTime, 0) / peopleTrackedCount) : 0;
  const totalCountMetrics = cumulativeCount;

  const fmtDwell = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  const selectedTrackerData = trackers.find(t => t.id === selectedTracker);

  return (
    <div className="space-y-5 font-sans text-xs pb-6">

      {/* ── SECTION 1: TOP KPI CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Cameras", val: "4 / 4", sub: "100% Online", icon: "📹", accent: "blue" },
          { label: "AI Tracking Model", val: "YOLOv8 + ByteTrack", sub: "99.4% Accuracy", icon: "🤖", accent: "purple" },
          { label: "People Tracked Live", val: `${peopleTrackedCount} Active`, sub: "Real-time Detection", icon: "👥", accent: "emerald" },
          { label: "Inference Latency", val: "12 ms", sub: "Real-time Frame Loop", icon: "⚡", accent: "amber" },
        ].map(({ label, val, sub, icon, accent }) => (
          <div key={label} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between font-mono">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block">{label}</span>
              <h2 className="text-lg font-black text-white leading-tight">{val}</h2>
              <span className={`text-[10px] font-bold text-${accent}-400`}>{sub}</span>
            </div>
            <div className={`w-10 h-10 bg-${accent}-600/20 text-${accent}-400 border border-${accent}-500/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: SURVEILLANCE FEED SELECTOR ───────────────────────────── */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono">
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Select Surveillance Feed</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CAMERAS.map(cam => (
            <button
              key={cam.id}
              onClick={() => setSelectedCamera(cam.id)}
              className={`p-3 rounded-xl border text-left transition ${
                selectedCamera === cam.id
                  ? "bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20"
                  : "bg-[#070C18] border-[#1E293B] hover:border-slate-500"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-cyan-400">{cam.id}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-white text-[11px] leading-tight truncate">{cam.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cam.location}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: LIVE VIDEO PLAYER & REAL-TIME INFERENCE METRICS ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* VIDEO PLAYER CANVAS WITH STABLE BOUNDING BOXES */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-white truncate">{activeCam.name}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowAiBoxes(v => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition ${showAiBoxes ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-[#070C18] border-[#1E293B] text-slate-400"}`}
              >
                AI Overlays
              </button>
              <button
                onClick={() => setShowHeatmap(v => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition ${showHeatmap ? "bg-rose-500/10 border-rose-500/40 text-rose-400" : "bg-[#070C18] border-[#1E293B] text-slate-400"}`}
              >
                Heatmap
              </button>
            </div>
          </div>

          {/* VIDEO FRAME WITH STABLE TRACKING BOUNDING BOXES */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#1E293B]">
            <video
              key={activeCam.path}
              src={activeCam.path}
              autoPlay loop muted playsInline
              className="w-full h-full object-cover"
              style={{ filter: showHeatmap ? "hue-rotate(180deg) saturate(200%) contrast(110%)" : "none" }}
            />

            {/* HUD top-left */}
            <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded-lg text-[8px] text-white border border-white/10 pointer-events-none font-mono space-x-2 z-10">
              <span className="text-rose-400 font-black">● LIVE</span>
              <span>{activeCam.res}</span>
              <span>{activeCam.fps} FPS</span>
              <span className="text-emerald-400">{peopleTrackedCount} Detected</span>
            </div>

            {/* HUD bottom-right */}
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-lg text-[8px] text-cyan-400 border border-white/10 pointer-events-none font-mono z-10">
              ByteTrack Engine · {activeCam.ip}
            </div>

            {/* STABLE BOUNDING BOXES LOCKED ON PERSON */}
            {showAiBoxes && !showHeatmap && trackers.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTracker(t.id)}
                className="absolute cursor-pointer transition-all duration-100 ease-linear hover:z-30"
                style={{
                  left: `${t.bbX}%`,
                  top: `${t.bbY}%`,
                  width: `${t.bbW}%`,
                  height: `${t.bbH}%`,
                  border: `1.5px solid ${t.color}`,
                  borderRadius: "4px",
                  backgroundColor: `${t.color}15`,
                  boxShadow: `0 0 12px ${t.color}40`,
                }}
              >
                {/* Corner Reticle Brackets */}
                <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-white"></div>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 border-white"></div>
                <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 border-white"></div>
                <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-white"></div>

                {/* Top Badge: Stable Unique ID & Real-Time Zone */}
                <div
                  className="absolute -top-5 left-0 px-1.5 py-0.5 text-[8px] font-black font-mono rounded shadow-md border border-black/40 flex items-center gap-1 whitespace-nowrap z-20"
                  style={{ backgroundColor: t.color, color: "#000" }}
                >
                  <span>{t.id}</span>
                  <span className="opacity-75">|</span>
                  <span>{t.zone}</span>
                </div>

                {/* Bottom Badge: Detected Action & Zone Dwell Duration */}
                <div className="absolute -bottom-5 left-0 px-1.5 py-0.5 bg-[#070C18]/90 border border-[#1E293B] text-white text-[8px] font-bold font-mono rounded flex items-center gap-1 shadow-lg whitespace-nowrap z-20">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                  <span>{t.activity}</span>
                  <span className="text-slate-400">({fmtDwell(t.zoneDwellTime)})</span>
                </div>
              </div>
            ))}
          </div>

          {/* TECH SPECS ROW */}
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            {[
              ["Resolution", activeCam.res],
              ["Frame Rate", `${activeCam.fps} FPS`],
              ["IP Address", activeCam.ip],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#070C18] border border-[#1E293B] rounded-lg p-2">
                <span className="text-slate-500 block">{k}</span>
                <span className="text-white font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE INFERENCE METRICS PANEL */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Live Inference Metrics</h3>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Frame Sync
            </span>
          </div>

          {/* 7 SYNCHRONIZED METRIC CARDS */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "People Tracked", val: peopleTrackedCount, icon: "👥", color: "emerald" },
              { label: "Products Viewed", val: totalProductsViewed, icon: "👁️", color: "cyan" },
              { label: "Products Picked", val: totalProductsPicked, icon: "🛍️", color: "purple" },
              { label: "Products Returned", val: totalProductsReturned, icon: "↩️", color: "rose" },
              { label: "Avg Dwell Time", val: fmtDwell(avgDwellSeconds), icon: "⏱️", color: "amber" },
              { label: "Comparisons", val: totalComparisons, icon: "⚖️", color: "violet" },
              { label: "Total Count", val: totalCountMetrics, icon: "📊", color: "teal" },
            ].map(({ label, val, icon, color }) => (
              <div key={label} className="bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[9px] block">{label}</span>
                  <span className={`text-${color}-400 font-black text-sm block`}>{val}</span>
                </div>
                <span className="text-base">{icon}</span>
              </div>
            ))}
          </div>

          {/* DYNAMIC ZONE ACTIVITY BREAKDOWN */}
          <div className="pt-2 border-t border-[#1E293B] space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone Activity Breakdown</h4>
            {activeCam.zones.map((zone, zi) => {
              const zoneTrackers = trackers.filter(t => t.zone === zone);
              const pct = peopleTrackedCount > 0 ? Math.round((zoneTrackers.length / peopleTrackedCount) * 100) : 0;
              return (
                <div key={zone} className="space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-300 truncate max-w-[180px]">{zone}</span>
                    <span className="text-white font-bold">{zoneTrackers.length} people ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: BB_COLORS[zi % BB_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* CUSTOMER INSPECTOR PROFILE CARD */}
          {selectedTrackerData && (
            <div className="bg-[#070C18] border border-blue-500/40 p-3.5 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center border-b border-[#1E293B] pb-1.5">
                <span className="font-extrabold text-blue-400 text-xs">{selectedTrackerData.id} Profile</span>
                <span className="text-[9px] text-slate-400 font-mono">Zone Dwell: {fmtDwell(selectedTrackerData.zoneDwellTime)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div><span className="text-slate-400 block">Current Zone:</span><strong className="text-white">{selectedTrackerData.zone}</strong></div>
                <div><span className="text-slate-400 block">Current Action:</span><strong className="text-emerald-400">{selectedTrackerData.activity}</strong></div>
                <div><span className="text-slate-400 block">Total Dwell:</span><strong className="text-amber-400">{fmtDwell(selectedTrackerData.totalDwellTime)}</strong></div>
                <div><span className="text-slate-400 block">Products Picked:</span><strong className="text-purple-400">{selectedTrackerData.productsPicked}</strong></div>
              </div>
              <div className="pt-1.5 border-t border-[#1E293B] text-[9px]">
                <span className="text-slate-400 block mb-1">Customer Trajectory Path:</span>
                <div className="flex flex-wrap items-center gap-1 text-cyan-400 font-bold">
                  {selectedTrackerData.journey.map((jStep, jIdx) => (
                    <React.Fragment key={jIdx}>
                      {jIdx > 0 && <span className="text-slate-600">→</span>}
                      <span className="bg-[#0D182E] px-1.5 py-0.5 rounded border border-[#1E293B]">{jStep}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
