import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCams } from "../../services/CamsContext";

// ─── CAMERA DEFINITIONS ──────────────────────────────────────────────────────
const CAMERAS = [
  {
    id: "CAM-01", name: "Retail Store USA – Main Aisle",
    location: "Aisle B / Central Aisle", fps: 30, res: "720p HD",
    ip: "192.168.1.101", status: "Online",
    zones: ["Central Aisle", "Display Shelf", "End-Cap"],
    path: "/videos/store1.mp4", baseCount: 8,
  },
  {
    id: "CAM-02", name: "Supermarket Scale & Produce",
    location: "Fresh Produce / Scale Station", fps: 25, res: "240p SD",
    ip: "192.168.1.102", status: "Online",
    zones: ["Produce Section", "Scale Station", "Fruit Bins"],
    path: "/videos/aisle1.mp4", baseCount: 5,
  },
  {
    id: "CAM-03", name: "Checkout Counter Station #1",
    location: "Billing Counters 1–4", fps: 30, res: "1080p FHD",
    ip: "192.168.1.103", status: "Online",
    zones: ["Counter 1", "Counter 2", "Queue Lane A"],
    path: "/videos/checkout1.mp4", baseCount: 6,
  },
  {
    id: "CAM-04", name: "Checkout Counter Station #2",
    location: "Billing Counters 5–8", fps: 30, res: "1080p FHD",
    ip: "192.168.1.104", status: "Online",
    zones: ["Counter 5", "Counter 6", "Queue Lane B"],
    path: "/videos/checkout2.mp4", baseCount: 4,
  },
];

const ACTIVITIES = ["Browsing", "Picking Product", "Comparing Products", "Walking", "Waiting", "Returning Product"];
const ACTIVITY_COLOR = {
  "Browsing": "text-blue-400 border-blue-500/40 bg-blue-500/10",
  "Picking Product": "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  "Comparing Products": "text-purple-400 border-purple-500/40 bg-purple-500/10",
  "Walking": "text-slate-300 border-slate-500/40 bg-slate-500/10",
  "Waiting": "text-amber-400 border-amber-500/40 bg-amber-500/10",
  "Returning Product": "text-rose-400 border-rose-500/40 bg-rose-500/10",
};
const BB_COLORS = ["#10B981","#2563EB","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899","#84CC16"];

// Seeded random helper (deterministic per camera)
function seeded(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  return Math.floor(r * (max - min + 1)) + min;
}

// Build initial tracker roster for a camera
function buildTrackers(cam, seed) {
  const count = seeded(seed, cam.baseCount - 1, cam.baseCount + 3);
  return Array.from({ length: count }, (_, i) => {
    const id = `TRK-${String(seeded(seed + i * 17, 200, 999)).padStart(3,"0")}`;
    const zone = cam.zones[seeded(seed + i * 7, 0, cam.zones.length - 1)];
    const act = ACTIVITIES[seeded(seed + i * 13, 0, ACTIVITIES.length - 1)];
    return {
      id,
      zone,
      activity: act,
      dwellTime: seeded(seed + i * 5, 15, 340),
      attentionScore: seeded(seed + i * 11, 60, 99),
      productsViewed: seeded(seed + i * 3, 1, 8),
      productsPicked: seeded(seed + i * 9, 0, 3),
      productsReturned: seeded(seed + i * 19, 0, 1),
      comparisons: seeded(seed + i * 23, 0, 2),
      status: "Active",
      color: BB_COLORS[i % BB_COLORS.length],
      // Bounding-box position % within video frame
      bbX: seeded(seed + i * 37, 5, 75),
      bbY: seeded(seed + i * 41, 10, 65),
      bbW: seeded(seed + i * 43, 10, 18),
      bbH: seeded(seed + i * 47, 18, 28),
      // path history (zone transitions)
      pathHistory: [
        cam.zones[seeded(seed + i * 53, 0, cam.zones.length - 1)],
        cam.zones[seeded(seed + i * 59, 0, cam.zones.length - 1)],
        zone,
      ].filter((v, idx, arr) => arr.indexOf(v) === idx),
    };
  });
}

// ─── HEATMAP CANVAS ──────────────────────────────────────────────────────────
function HeatmapCanvas({ trackers, camId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#070C18";
    ctx.fillRect(0, 0, W, H);

    // Draw heat blobs per tracker (gaussian-like radial gradient)
    trackers.forEach(t => {
      const cx = (t.bbX / 100) * W + (t.bbW / 200) * W;
      const cy = (t.bbY / 100) * H + (t.bbH / 200) * H;
      const intensity = t.attentionScore / 100;
      const radius = 30 + t.dwellTime / 12;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const alpha = Math.min(0.85, intensity);
      if (intensity > 0.85) {
        grad.addColorStop(0, `rgba(255,0,0,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,100,0,${alpha * 0.6})`);
        grad.addColorStop(1, "rgba(255,255,0,0)");
      } else if (intensity > 0.65) {
        grad.addColorStop(0, `rgba(255,165,0,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,200,0,${alpha * 0.5})`);
        grad.addColorStop(1, "rgba(255,255,0,0)");
      } else {
        grad.addColorStop(0, `rgba(0,150,255,${alpha})`);
        grad.addColorStop(0.5, `rgba(0,200,255,${alpha * 0.4})`);
        grad.addColorStop(1, "rgba(0,255,255,0)");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Grid overlay
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += W / 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += H / 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Legend gradient bar
    const lgrd = ctx.createLinearGradient(10, H - 18, W - 10, H - 18);
    lgrd.addColorStop(0, "rgba(0,150,255,0.9)");
    lgrd.addColorStop(0.5, "rgba(255,165,0,0.9)");
    lgrd.addColorStop(1, "rgba(255,0,0,0.9)");
    ctx.fillStyle = lgrd;
    ctx.beginPath();
    ctx.roundRect(10, H - 20, W - 20, 8, 4);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "9px monospace";
    ctx.fillText("LOW", 12, H - 24);
    ctx.fillText("HIGH", W - 34, H - 24);
  }, [trackers, camId]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={200}
      className="w-full h-full rounded-xl"
    />
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function LiveCameras() {
  const { selectedCamera, setSelectedCamera } = useCams();
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [trackers, setTrackers] = useState([]);
  const [inferenceMetrics, setInferenceMetrics] = useState({});
  const [detectionLog, setDetectionLog] = useState([]);
  const [tick, setTick] = useState(0);

  const activeCam = CAMERAS.find(c => c.id === selectedCamera) || CAMERAS[0];

  // ─ Initialize trackers whenever camera changes ──────────────────────────
  useEffect(() => {
    const seed = activeCam.id.charCodeAt(4) * 1234 + Date.now() % 1000;
    const initial = buildTrackers(activeCam, seed);
    setTrackers(initial);
    setSelectedTracker(null);
    setDetectionLog([]);
    setTick(0);
  }, [selectedCamera]);

  // ─ Live simulation tick every 3 s ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setTrackers(prev => {
        // Drift positions, update activities & dwell time
        return prev.map(tr => {
          const drift = () => (Math.random() - 0.5) * 4;
          const newAct = Math.random() < 0.12
            ? ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]
            : tr.activity;
          const newZone = Math.random() < 0.08
            ? activeCam.zones[Math.floor(Math.random() * activeCam.zones.length)]
            : tr.zone;
          const newPH = newZone !== tr.zone
            ? [...tr.pathHistory.slice(-4), newZone]
            : tr.pathHistory;
          return {
            ...tr,
            activity: newAct,
            zone: newZone,
            pathHistory: newPH,
            dwellTime: tr.dwellTime + 3,
            attentionScore: Math.min(99, Math.max(40, tr.attentionScore + Math.round((Math.random() - 0.5) * 4))),
            productsViewed: newAct === "Browsing" ? tr.productsViewed + (Math.random() < 0.15 ? 1 : 0) : tr.productsViewed,
            productsPicked: newAct === "Picking Product" ? tr.productsPicked + (Math.random() < 0.1 ? 1 : 0) : tr.productsPicked,
            comparisons: newAct === "Comparing Products" ? tr.comparisons + (Math.random() < 0.1 ? 1 : 0) : tr.comparisons,
            bbX: Math.max(2, Math.min(80, tr.bbX + drift())),
            bbY: Math.max(5, Math.min(65, tr.bbY + drift())),
          };
        });
      });

      // Randomly add/remove a tracker
      setTrackers(prev => {
        let updated = [...prev];
        if (Math.random() < 0.15 && prev.length < activeCam.baseCount + 5) {
          const seed2 = Date.now();
          const newId = `TRK-${String(Math.floor(Math.random() * 800) + 200).padStart(3,"0")}`;
          const zone = activeCam.zones[Math.floor(Math.random() * activeCam.zones.length)];
          updated.push({
            id: newId, zone,
            activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
            dwellTime: 0, attentionScore: Math.floor(Math.random() * 30) + 60,
            productsViewed: 0, productsPicked: 0, productsReturned: 0, comparisons: 0,
            status: "Active", color: BB_COLORS[prev.length % BB_COLORS.length],
            bbX: Math.random() * 75 + 5, bbY: Math.random() * 60 + 5,
            bbW: 10 + Math.random() * 10, bbH: 18 + Math.random() * 12,
            pathHistory: [zone],
          });
        }
        if (Math.random() < 0.10 && prev.length > 2) {
          updated = updated.slice(1);
        }
        return updated;
      });

      // Append to detection log
      const events = [
        "Shopper Detected", "Product Interaction", "Dwell Threshold (45s)", "Product Picked Up",
        "Product Compared", "Product Returned", "Zone Transition", "Queue Detected",
      ];
      const ev = events[Math.floor(Math.random() * events.length)];
      const zone = activeCam.zones[Math.floor(Math.random() * activeCam.zones.length)];
      const conf = (90 + Math.random() * 9).toFixed(1);
      const now = new Date();
      const ts = now.toLocaleTimeString("en-US", { hour12: false });
      setDetectionLog(prev => [
        { time: ts, event: ev, zone, confidence: `${conf}%`, id: `TRK-${Math.floor(Math.random()*800+200)}` },
        ...prev.slice(0, 29),
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedCamera, activeCam]);

  // ─ Derive live inference metrics ───────────────────────────────────────
  useEffect(() => {
    setInferenceMetrics({
      fps: activeCam.fps,
      peopleTracked: trackers.length,
      productsViewed: trackers.reduce((s, t) => s + t.productsViewed, 0),
      productsPicked: trackers.reduce((s, t) => s + t.productsPicked, 0),
      productsReturned: trackers.reduce((s, t) => s + t.productsReturned, 0),
      avgDwell: trackers.length
        ? Math.round(trackers.reduce((s, t) => s + t.dwellTime, 0) / trackers.length)
        : 0,
      comparisons: trackers.reduce((s, t) => s + t.comparisons, 0),
      totalCount: trackers.length + Math.floor(tick * 0.4),
      accuracy: (98.5 + Math.random() * 1.4).toFixed(1),
      latency: (10 + Math.random() * 8).toFixed(0),
    });
  }, [trackers, tick]);

  const selectedTrackerData = trackers.find(t => t.id === selectedTracker);

  const fmtDwell = (s) => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;

  return (
    <div className="space-y-5 font-sans text-xs">

      {/* ── SECTION 1: KPI CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Cameras", val: "4 / 4", sub: "100% Online", icon: "📹", accent: "blue" },
          { label: "AI Model", val: "YOLOv8", sub: `Accuracy ${inferenceMetrics.accuracy || "—"}%`, icon: "🤖", accent: "purple" },
          { label: "Shoppers Tracked", val: `${inferenceMetrics.peopleTracked ?? "—"} Live`, sub: "ByteTrack IDs active", icon: "👥", accent: "emerald" },
          { label: "Inference Latency", val: `${inferenceMetrics.latency ?? "—"} ms`, sub: "Zero frame drops", icon: "⚡", accent: "amber" },
        ].map(({ label, val, sub, icon, accent }) => (
          <div key={label} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5 font-mono">
              <span className="text-slate-400 text-[11px] block">{label}</span>
              <h2 className="text-lg font-black text-white leading-tight">{val}</h2>
              <span className={`text-[10px] font-bold text-${accent}-400`}>{sub}</span>
            </div>
            <div className={`w-10 h-10 bg-${accent}-600/20 text-${accent}-400 border border-${accent}-500/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: CAMERA SELECTOR ───────────────────────────────────── */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
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
                <span className="text-[10px] font-black font-mono text-cyan-400">{cam.id}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-white text-[11px] leading-tight truncate">{cam.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cam.location}</p>
              <p className="text-[10px] text-blue-400 font-bold mt-1">{trackers.length} tracked</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: VIDEO + INFERENCE METRICS (2-col) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* VIDEO PLAYER WITH AI BOUNDING BOXES */}
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

          {/* VIDEO FRAME */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#1E293B]">
            <video
              key={activeCam.path}
              src={activeCam.path}
              autoPlay loop muted playsInline
              className="w-full h-full object-cover"
              style={{ filter: showHeatmap ? "hue-rotate(180deg) saturate(200%) contrast(110%)" : "none" }}
            />

            {/* HUD top-left */}
            <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded-lg text-[8px] text-white border border-white/10 pointer-events-none font-mono space-x-2">
              <span className="text-rose-400 font-black">● LIVE</span>
              <span>{activeCam.res}</span>
              <span>{activeCam.fps} FPS</span>
              <span className="text-emerald-400">{trackers.length} tracked</span>
            </div>

            {/* HUD bottom-right */}
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-lg text-[8px] text-cyan-400 border border-white/10 pointer-events-none font-mono">
              YOLOv8 + ByteTrack · {activeCam.ip}
            </div>

            {/* AI BOUNDING BOXES */}
            {showAiBoxes && !showHeatmap && trackers.map(t => (
              <div
                key={t.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${t.bbX}%`,
                  top: `${t.bbY}%`,
                  width: `${t.bbW}%`,
                  height: `${t.bbH}%`,
                  border: `2px solid ${t.color}`,
                  borderRadius: "3px",
                  backgroundColor: `${t.color}18`,
                  transition: "left 0.8s ease, top 0.8s ease",
                }}
              >
                <div
                  className="absolute -top-4 left-0 px-1.5 py-0.5 text-[7px] font-black rounded whitespace-nowrap"
                  style={{ backgroundColor: t.color, color: "#000" }}
                >
                  {t.id} · {t.activity}
                </div>
              </div>
            ))}
          </div>

          {/* CAMERA TECH SPECS */}
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
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Live Inference Metrics</h3>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-time
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Frame Rate", val: `${inferenceMetrics.fps} FPS`, icon: "🎞️", color: "blue" },
              { label: "People Tracked", val: inferenceMetrics.peopleTracked ?? 0, icon: "👥", color: "emerald" },
              { label: "Products Viewed", val: inferenceMetrics.productsViewed ?? 0, icon: "👁️", color: "cyan" },
              { label: "Products Picked", val: inferenceMetrics.productsPicked ?? 0, icon: "🛍️", color: "purple" },
              { label: "Products Returned", val: inferenceMetrics.productsReturned ?? 0, icon: "↩️", color: "rose" },
              { label: "Avg Dwell Time", val: fmtDwell(inferenceMetrics.avgDwell ?? 0), icon: "⏱️", color: "amber" },
              { label: "Comparisons", val: inferenceMetrics.comparisons ?? 0, icon: "⚖️", color: "violet" },
              { label: "Total Count", val: inferenceMetrics.totalCount ?? 0, icon: "📊", color: "teal" },
            ].map(({ label, val, icon, color }) => (
              <div key={label} className="bg-[#070C18] border border-[#1E293B] p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[9px] block">{label}</span>
                  <span className={`text-${color}-400 font-black text-sm block`}>{val}</span>
                </div>
                <span className="text-base">{icon}</span>
              </div>
            ))}
          </div>

          {/* Mini sparkline bars per zone */}
          <div className="pt-2 border-t border-[#1E293B] space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone Activity</h4>
            {activeCam.zones.map((zone, zi) => {
              const zoneTrackers = trackers.filter(t => t.zone === zone);
              const pct = trackers.length > 0 ? Math.round((zoneTrackers.length / trackers.length) * 100) : 0;
              return (
                <div key={zone} className="space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-300 truncate max-w-[180px]">{zone}</span>
                    <span className="text-white font-bold">{zoneTrackers.length} people ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1E293B] rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-700"
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
        </div>
      </div>

      {/* ── SECTION 4: HEATMAP + AI LOG (2-col) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* DYNAMIC ATTENTION HEATMAP */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Attention Heatmap</h3>
            <span className="text-[9px] text-rose-400 font-bold">Live · Updates every 3s</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-[#1E293B] aspect-video">
            <HeatmapCanvas trackers={trackers} camId={selectedCamera} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>📍 Based on {trackers.length} active trackers</span>
            <span className="text-emerald-400">Camera: {selectedCamera}</span>
          </div>
        </div>

        {/* AI DETECTION LOG */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">AI Detection Log</h3>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Feed
            </span>
          </div>
          <div className="overflow-y-auto max-h-52 space-y-1 pr-1">
            {detectionLog.length === 0 && (
              <p className="text-slate-500 text-[10px] text-center py-4">Awaiting detections…</p>
            )}
            {detectionLog.map((det, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-[#070C18] border border-[#1E293B] rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[8px] text-slate-500 font-mono whitespace-nowrap">{det.time}</span>
                  <span className="text-[10px] text-white font-bold truncate">{det.event}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[8px] text-slate-400 truncate max-w-[80px]">{det.zone}</span>
                  <span className="text-[8px] text-emerald-400 font-bold">{det.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 5: ACTIVE SHOPPER TRACKERS TABLE ─────────────────────── */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">
            Active Shopper Trackers
            <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[9px]">
              {trackers.length} live
            </span>
          </h3>
          <span className="text-[9px] text-slate-400">Click a row to inspect tracker</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="pb-2 pl-1">Tracker ID</th>
                <th className="pb-2">Zone</th>
                <th className="pb-2">Activity</th>
                <th className="pb-2">Dwell</th>
                <th className="pb-2">Attention</th>
                <th className="pb-2">Viewed</th>
                <th className="pb-2">Picked</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {trackers.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTracker(prev => prev === t.id ? null : t.id)}
                  className={`cursor-pointer transition ${
                    selectedTracker === t.id
                      ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                      : "hover:bg-[#070C18]/60"
                  }`}
                >
                  <td className="py-2.5 pl-1">
                    <span
                      className="font-black text-xs px-1.5 py-0.5 rounded"
                      style={{ color: t.color, borderColor: t.color, border: `1px solid ${t.color}44`, backgroundColor: `${t.color}18` }}
                    >
                      {t.id}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300 max-w-[120px] truncate">{t.zone}</td>
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${ACTIVITY_COLOR[t.activity]}`}>
                      {t.activity}
                    </span>
                  </td>
                  <td className="py-2.5 text-amber-400 font-bold">{fmtDwell(t.dwellTime)}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${t.attentionScore}%`, backgroundColor: t.attentionScore > 80 ? "#10B981" : t.attentionScore > 60 ? "#F59E0B" : "#EF4444" }}
                        />
                      </div>
                      <span className="text-white font-bold">{t.attentionScore}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-cyan-400 font-bold">{t.productsViewed}</td>
                  <td className="py-2.5 text-purple-400 font-bold">{t.productsPicked}</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded border text-[8px] font-bold text-emerald-400 border-emerald-500/40 bg-emerald-500/10">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 6: CUSTOMER DETAIL DRAWER ───────────────────────────── */}
      {selectedTrackerData && (
        <div className="bg-[#0F172A] border border-blue-500/30 p-5 rounded-2xl font-mono space-y-4 ring-2 ring-blue-500/10">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">
              Tracker Detail —
              <span className="ml-2 font-black" style={{ color: selectedTrackerData.color }}>
                {selectedTrackerData.id}
              </span>
            </h3>
            <button
              onClick={() => setSelectedTracker(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-[#1E293B] transition"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Current Zone", val: selectedTrackerData.zone, icon: "📍" },
              { label: "Activity", val: selectedTrackerData.activity, icon: "🏃" },
              { label: "Total Dwell", val: fmtDwell(selectedTrackerData.dwellTime), icon: "⏱️" },
              { label: "Attention Score", val: `${selectedTrackerData.attentionScore}%`, icon: "🧠" },
              { label: "Products Viewed", val: selectedTrackerData.productsViewed, icon: "👁️" },
              { label: "Products Picked", val: selectedTrackerData.productsPicked, icon: "🛍️" },
              { label: "Products Returned", val: selectedTrackerData.productsReturned, icon: "↩️" },
              { label: "Comparisons", val: selectedTrackerData.comparisons, icon: "⚖️" },
            ].map(({ label, val, icon }) => (
              <div key={label} className="bg-[#070C18] border border-[#1E293B] p-3 rounded-xl">
                <span className="text-slate-400 text-[9px] block">{icon} {label}</span>
                <span className="text-white font-black text-sm mt-0.5 block">{val}</span>
              </div>
            ))}
          </div>

          {/* Movement Path */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Movement Path History</h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedTrackerData.pathHistory.map((zone, idx) => (
                <React.Fragment key={idx}>
                  <span className="px-2.5 py-1 bg-blue-600/10 border border-blue-500/30 text-blue-300 rounded-lg text-[10px] font-bold">
                    {zone}
                  </span>
                  {idx < selectedTrackerData.pathHistory.length - 1 && (
                    <span className="text-slate-600 text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
              <span className="px-2.5 py-1 bg-emerald-600/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold animate-pulse">
                📍 {selectedTrackerData.zone} (Now)
              </span>
            </div>
          </div>

          {/* Interaction Summary */}
          <div className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl text-[10px] text-slate-400 space-y-1">
            <p className="text-white font-bold">AI Interaction Summary</p>
            <p>This shopper has been active in <strong className="text-cyan-400">{selectedTrackerData.pathHistory.length}</strong> zones, viewed <strong className="text-cyan-400">{selectedTrackerData.productsViewed}</strong> products, picked <strong className="text-purple-400">{selectedTrackerData.productsPicked}</strong> item(s), and spent an average dwell time of <strong className="text-amber-400">{fmtDwell(selectedTrackerData.dwellTime)}</strong> in camera view. Current interaction status: <strong className={ACTIVITY_COLOR[selectedTrackerData.activity].split(" ")[0]}>{selectedTrackerData.activity}</strong>. Attention engagement score: <strong className="text-emerald-400">{selectedTrackerData.attentionScore}%</strong>.</p>
          </div>
        </div>
      )}

    </div>
  );
}
