import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useCams } from "../../services/CamsContext";

// ─────────────────────────────────────────────────────────────────────────────
// Camera definitions — must match backend CAMERA_VIDEO_MAP
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CAMERAS = [
  {
    id: "CAM-01",
    name: "Camera 1 - Main Central Aisle",
    location: "Aisle B (Main Corridor)",
    res: "1080p FHD",
    fps: 30,
    ip: "192.168.1.101",
    path: "/videos/store1.mp4",
    zones: ["Main Central Aisle", "Dairy Coolers", "Bakery Shelf"],
  },
  {
    id: "CAM-02",
    name: "Camera 2 - Produce & Scale Station",
    location: "Fresh Produce Section",
    res: "1080p FHD",
    fps: 30,
    ip: "192.168.1.102",
    path: "/videos/aisle1.mp4",
    zones: ["Produce Bins", "Organic Wall", "Scale Station"],
  },
  {
    id: "CAM-03",
    name: "Camera 3 - Checkout Counter #1",
    location: "Billing Counters 1–4",
    res: "1080p FHD",
    fps: 28,
    ip: "192.168.1.103",
    path: "/videos/checkout1.mp4",
    zones: ["Billing Counter 1", "Express Queue", "Impulse Rack"],
  },
  {
    id: "CAM-04",
    name: "Camera 4 - Checkout Counter #2",
    location: "Billing Counters 5–8",
    res: "1080p FHD",
    fps: 30,
    ip: "192.168.1.104",
    path: "/videos/checkout2.mp4",
    zones: ["Billing Counter 5", "Express Queue", "Exit Corridor"],
  },
];

// Bounding box colors — cycling per track ID
const BB_COLORS = [
  "#10B981", "#06B6D4", "#8B5CF6", "#F59E0B",
  "#EF4444", "#3B82F6", "#EC4899", "#84CC16",
];

// WebSocket reconnect backoff schedule (ms)
const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 10000];

// ─────────────────────────────────────────────────────────────────────────────
// Zone resolution — based on normalized center coords (same logic as before)
// ─────────────────────────────────────────────────────────────────────────────
function resolveZoneByPosition(centerXPercent, centerYPercent, activeCam) {
  const zones = activeCam.zones || ["Main Central Aisle", "Dairy Coolers", "Bakery Shelf"];
  if (centerYPercent < 40) {
    if (centerXPercent < 38) return zones[0];
    if (centerXPercent < 68) return zones[1] || zones[0];
    return zones[2] || zones[0];
  } else if (centerYPercent < 70) {
    if (centerXPercent < 42) return zones[0];
    if (centerXPercent < 70) return zones[1] || zones[0];
    return zones[2] || zones[1] || zones[0];
  }
  return zones[2] || zones[1] || zones[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-track state managed in a ref (not React state, to avoid re-render lag)
// ─────────────────────────────────────────────────────────────────────────────
const fmtDwell = (s) => (s >= 60 ?`${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

// EMA_ALPHA for small stable movements. For large jumps (fast movement), alpha snaps
// toward 1.0 so the box doesn't lag behind the person.
const EMA_ALPHA_BASE = 0.55;      // normal frame-to-frame smoothing
const EMA_ALPHA_FAST = 0.90;      // snap factor when person moves quickly

// ─────────────────────────────────────────────────────────────────────────────
// LiveCameraFeed — canvas-based real-time tracking overlay
// ─────────────────────────────────────────────────────────────────────────────
const LiveCameraFeed = React.forwardRef(({
  showAiBoxes,
  showHeatmap,
  selectedTracker,
  setSelectedTracker,
  activeCam,
  getTrackColor,
  debugInfo,
  showVideo,
  wsStatus,
  videoStatus,
  onVideoTimeUpdate,
  onVideoStatusChange,
}, ref) => {
  // React state — only for things that must trigger a DOM re-render
  const [sourceDims, setSourceDims] = useState({ width: 1280, height: 720 });
  const [hudTrackCount, setHudTrackCount] = useState(0);

  // DOM refs
  const containerRef = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);

  // Tracking data refs — written immediately on every WS frame, never React state
  const tracksRef       = useRef([]);
  const sourceDimsRef2  = useRef({ width: 1280, height: 720 });
  const hudTimerRef     = useRef(0);
  const frameImageRef   = useRef(null);
  const frameImageLoadedRef = useRef(false);
  const lastTracksReceivedAtRef = useRef(Date.now());

  // rAF control
  const rafIdRef = useRef(null);

  // ── SYNCHRONOUS prop → ref sync (in render body, always current) ──────────
  const showAiBoxesRef   = useRef(showAiBoxes);
  const showHeatmapRef   = useRef(showHeatmap);
  const wsStatusRef      = useRef(wsStatus);
  const selectedRef      = useRef(selectedTracker);
  const showVideoRef     = useRef(showVideo);
  showAiBoxesRef.current  = showAiBoxes;
  showHeatmapRef.current  = showHeatmap;
  wsStatusRef.current     = wsStatus;
  selectedRef.current     = selectedTracker;
  showVideoRef.current    = showVideo;

  // Callback refs (kept fresh every render)
  const timeUpdateRef   = useRef(onVideoTimeUpdate);
  const statusChangeRef = useRef(onVideoStatusChange);
  timeUpdateRef.current   = onVideoTimeUpdate;
  statusChangeRef.current = onVideoStatusChange;

  // ── Canvas draw (called from rAF — zero React involvement) ────────────────
  const drawCanvas = useCallback(() => {
    rafIdRef.current = null;

    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Use getBoundingClientRect for sub-pixel accurate sizing
    const rect = container.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;
    if (cssW <= 0 || cssH <= 0) return;

    // Device pixel ratio for crisp HiDPI rendering
    const dpr = window.devicePixelRatio || 1;
    const pw  = Math.round(cssW * dpr);
    const ph  = Math.round(cssH * dpr);

    // Resize internal canvas resolution only when needed (avoids clearing the canvas unnecessarily)
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width  = pw;
      canvas.height = ph;
    }

    const ctx = canvas.getContext("2d");
    // Apply DPR scale so all drawing coords are in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Object-cover transform — same formula as pixelBboxToCSS util
    const { width: nativeW, height: nativeH } = sourceDimsRef2.current;
    const scale  = Math.max(cssW / nativeW, cssH / nativeH);
    const offX   = (nativeW * scale - cssW) / 2;
    const offY   = (nativeH * scale - cssH) / 2;

    // Draw background video frame if online
    if (showVideoRef.current && wsStatusRef.current === "online" && frameImageLoadedRef.current && frameImageRef.current && frameImageRef.current.complete) {
      ctx.drawImage(
        frameImageRef.current,
        -offX,
        -offY,
        nativeW * scale,
        nativeH * scale
      );
    } else {
      ctx.clearRect(0, 0, cssW, cssH);
    }

    // Guard: don't draw boxes when toggled off, heatmap on, or WS not live
    if (!showAiBoxesRef.current || showHeatmapRef.current || wsStatusRef.current !== "online") {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }

    const tracks = tracksRef.current;
    if (!tracks || tracks.length === 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }

    const selId  = selectedRef.current;
    const dt     = Date.now() - lastTracksReceivedAtRef.current;

    // roundRect helper with fallback for older browsers
    const rr = (x, y, w, h, r) => {
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
      }
    };

    for (const t of tracks) {
      if (!t.normBbox) continue;
      const { x, y, w, h } = t.normBbox;

      // Keep bounding boxes within visible camera canvas boundaries
      const cx1 = Math.max(0, Math.min(1 - w, x));
      const cy1 = Math.max(0, Math.min(1 - h, y));
      const cx2 = cx1 + w;
      const cy2 = cy1 + h;

      const px1 = cx1 * nativeW;
      const py1 = cy1 * nativeH;
      const px2 = cx2 * nativeW;
      const py2 = cy2 * nativeH;

      if (px1 >= px2 || py1 >= py2) continue;

      // Convert native pixel → CSS pixel coordinates (object-cover aware)
      const bLeft = px1 * scale - offX;
      const bTop  = py1 * scale - offY;
      const bW    = (px2 - px1) * scale;
      const bH    = (py2 - py1) * scale;

      const isSelected = t.id === selId;
      const color = t.color || "#10B981";

      // ── Box border (Outline-only, transparent, no solid block cover) ──────
      ctx.globalAlpha = 0.90;
      ctx.strokeStyle = color;
      ctx.lineWidth   = isSelected ? 2.5 : 2;
      if (isSelected) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
      rr(bLeft, bTop, bW, bH, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Selected cyan ring ────────────────────────────────────────────────
      if (isSelected) {
        ctx.globalAlpha = 0.90;
        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth   = 1.5;
        rr(bLeft - 2, bTop - 2, bW + 4, bH + 4, 5);
        ctx.stroke();
      }

      // ── TRK ID badge (top-left, above box to never cover face/body) ───────
      const label  = String(t.id);
      const fSize  = 9;
      ctx.font     = `900 ${fSize}px 'Courier New', monospace`;
      ctx.globalAlpha = 1.0;
      const tw    = ctx.measureText(label).width;
      const padX  = 5;
      const padY  = 3;
      const badgeW = tw + padX * 2;
      const badgeH = fSize + padY * 2;

      // Draw badge just above the box (fall back to top inside if overflowing)
      const badgeY = bTop - badgeH >= 0 ? bTop - badgeH : bTop;

      ctx.fillStyle = color;
      rr(bLeft, badgeY, badgeW, badgeH, 3);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF"; // High-contrast crisp white text
      ctx.fillText(label, bLeft + padX, badgeY + padY + fSize - 1);
    }

    // Reset state
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, []);

  // ── Cancel-and-reschedule rAF ─────────────────────────────────────────────
  // Every call cancels any pending rAF and schedules a fresh one.
  // This guarantees we ALWAYS draw with the most recent tracksRef.current.
  const scheduleRedraw = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(drawCanvas);
  }, [drawCanvas]);

  // ── Imperative API exposed to parent ─────────────────────────────────────
  React.useImperativeHandle(ref, () => ({
    updateFeed(newFrame, newTracks, newDims) {
      // Write tracks immediately — no React state, no scheduling delay
      tracksRef.current = newTracks || [];
      lastTracksReceivedAtRef.current = Date.now();

      if (newDims?.width && newDims?.height) {
        sourceDimsRef2.current = { width: newDims.width, height: newDims.height };
        // Only trigger re-render when dimensions actually change
        setSourceDims(prev =>
          prev.width === newDims.width && prev.height === newDims.height
            ? prev
            : { width: newDims.width, height: newDims.height }
        );
      }

      // Update frame image without triggering a full React re-render
      if (newFrame) {
        if (!frameImageRef.current) {
          frameImageRef.current = new Image();
          frameImageRef.current.onload = () => {
            frameImageLoadedRef.current = true;
            scheduleRedraw();
          };
          frameImageRef.current.onerror = () => {
            frameImageLoadedRef.current = false;
          };
        }
        frameImageRef.current.src = newFrame;
      } else {
        frameImageLoadedRef.current = false;
      }

      // Schedule redraw — cancel any pending rAF so we draw with latest data
      scheduleRedraw();

      // Throttle HUD count to ~10 FPS to avoid triggering full React renders at 30 FPS
      const now = Date.now();
      if (now - hudTimerRef.current > 100) {
        hudTimerRef.current = now;
        setHudTrackCount(tracksRef.current.length);
      }
    },

    clear() {
      tracksRef.current = [];
      if (frameImageRef.current) {
        frameImageRef.current.src = "";
      }
      frameImageLoadedRef.current = false;
      setHudTrackCount(0);
      scheduleRedraw();
    },
  }), [scheduleRedraw]);

  // ── Redraw canvas when visual props change ────────────────────────────────
  // (selectedTracker highlight, showAiBoxes toggle, wsStatus change, etc.)
  // Props are already synced to refs in render body, so drawCanvas will see
  // the new values immediately.
  useEffect(() => {
    scheduleRedraw();
  }, [showAiBoxes, showHeatmap, selectedTracker, wsStatus, scheduleRedraw]);

  // ── Redraw on container resize ────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => scheduleRedraw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [scheduleRedraw]);

  // ── Canvas click → hit-test → setSelectedTracker ─────────────────────────
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleClick = (e) => {
      if (!showAiBoxesRef.current || showHeatmapRef.current || wsStatusRef.current !== "online") return;

      const rect   = canvas.getBoundingClientRect();
      const mx     = e.clientX - rect.left;
      const my     = e.clientY - rect.top;
      const cssW   = rect.width;
      const cssH   = rect.height;

      const { width: nativeW, height: nativeH } = sourceDimsRef2.current;
      const scale  = Math.max(cssW / nativeW, cssH / nativeH);
      const offX   = (nativeW * scale - cssW) / 2;
      const offY   = (nativeH * scale - cssH) / 2;

      let hitId   = null;
      let hitArea = Infinity;

      for (const t of tracksRef.current) {
        if (!t.bbox) continue;
        const { x1, y1, x2, y2 } = t.bbox;
        const bLeft = x1 * scale - offX;
        const bTop  = y1 * scale - offY;
        const bW    = (x2 - x1) * scale;
        const bH    = (y2 - y1) * scale;

        if (mx >= bLeft && mx <= bLeft + bW && my >= bTop && my <= bTop + bH) {
          const area = bW * bH;
          if (area < hitArea) { hitArea = area; hitId = t.id; }
        }
      }

      if (hitId !== null) setSelectedTracker(hitId);
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [setSelectedTracker]);

  // ── Video event handlers ──────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay    = () => { statusChangeRef.current?.("online");      timeUpdateRef.current?.(video.currentTime); };
    const onSeeked  = () => { timeUpdateRef.current?.(video.currentTime); };
    const onWaiting = () => { statusChangeRef.current?.("connecting"); };
    const onPlaying = () => { statusChangeRef.current?.("online");      };
    const onError   = () => { statusChangeRef.current?.("offline");     };

    video.addEventListener("play",    onPlay);
    video.addEventListener("seeked",  onSeeked);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error",   onError);

    const syncTimer = setInterval(() => {
      if (video && !video.paused) timeUpdateRef.current?.(video.currentTime);
    }, 1500);

    return () => {
      video.removeEventListener("play",    onPlay);
      video.removeEventListener("seeked",  onSeeked);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error",   onError);
      clearInterval(syncTimer);
    };
  }, []);

  // ── Reload video on camera switch ─────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      statusChangeRef.current?.("connecting");
      video.load();
      video.play().catch(() => { /* autoplay policy */ });
    }
  }, [activeCam]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-[#0B132B] rounded-xl overflow-hidden border border-[#1E293B] shadow-inner select-none"
    >
      {/* Fallback local Video Element */}
      <video
        ref={videoRef}
        src={activeCam?.path}
        autoPlay loop muted playsInline
        className="w-full h-full object-cover opacity-95"
        style={{
          display: wsStatus === "online" ? "none" : "block",
          opacity: showVideo ? 0.95 : 0,
          filter: showHeatmap ? "hue-rotate(180deg) saturate(200%) contrast(110%)" : "none",
        }}
      />

      {/* Offline / connecting overlay */}
      {videoStatus !== "online" && (
        <div className="absolute inset-0 bg-[#080E1E] flex items-center justify-center text-slate-500 z-10 pointer-events-none">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: "linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              transform: "perspective(500px) rotateX(15deg)",
              transformOrigin: "center top",
            }}
          />
          <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at center, transparent 55%, rgba(3,7,18,0.85) 100%)" }} />
          <span className="z-10 text-[11px] font-mono tracking-wider animate-pulse">
            {videoStatus === "offline" ? "Video Offline" : "Awaiting Stream Connection..."}
          </span>
        </div>
      )}

      {/* Heatmap tint */}
      {showHeatmap && (
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/60 via-amber-600/40 to-rose-600/60 mix-blend-color-dodge pointer-events-none animate-pulse z-10" />
      )}

      {/* ── Canvas tracking overlay ── */}
      {/* CSS size = 100%×100% of container; internal resolution set by drawCanvas with DPR */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 11,
          pointerEvents: showAiBoxes && !showHeatmap && wsStatus === "online" ? "auto" : "none",
          cursor:        showAiBoxes && !showHeatmap && wsStatus === "online" ? "pointer" : "default",
          filter:        showHeatmap ? "hue-rotate(180deg) saturate(200%) contrast(110%)" : "none",
        }}
      />

      {/* HUD — top-left, always above canvas (z-30) */}
      <div className="absolute top-2 left-2 bg-black/85 px-2.5 py-1 rounded-lg text-[8px] text-white border border-white/10 pointer-events-none font-mono space-x-2 z-30 flex items-center shadow-lg">
        <span className="text-rose-400 font-black flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE
        </span>
        <span>{sourceDims.width}×{sourceDims.height}</span>
        <span>{activeCam?.fps || 30} FPS</span>
        <span className="text-emerald-400 font-bold">
          {wsStatus === "online" ? `${hudTrackCount} Persons Tracked` : "Detection Offline"}
        </span>
      </div>

      {/* Debug HUD — bottom-right (z-50) */}
      {debugInfo && (
        <div
          className="absolute bg-black/85 px-2.5 py-1.5 rounded-lg text-[8px] text-cyan-400 border border-cyan-500/30 pointer-events-none font-mono z-50 shadow-lg space-y-0.5"
          style={{ bottom: 8, right: 8 }}
        >
          <div>YOLO: {debugInfo.yoloDetections}</div>
          <div>Persons: {debugInfo.personDetections}</div>
          <div>Tracks: {debugInfo.activeTracks}</div>
          <div>Frame: {debugInfo.frameNumber}</div>
        </div>
      )}
    </div>
  );
});



export default function LiveCameras() {
  const { selectedCamera, setSelectedCamera, updateLiveTrackingState } = useCams();

  const [cameras, setCameras] = useState(DEFAULT_CAMERAS);

  // Fetch cameras from database on mount
  useEffect(() => {
    const fetchCams = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/cameras");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map(c => ({
            id: c.camera_id,
            name: c.name,
            location: c.location || "Store Zone",
            res: c.resolution || "1080p FHD",
            fps: c.fps || 30,
            ip: c.camera_url || "127.0.0.1",
            path: c.stream_url || `/videos/store1.mp4`,
            zones: c.zones && c.zones.length > 0 ? c.zones : ["Main Central Aisle", "Dairy Coolers", "Bakery Shelf"]
          }));
          mapped.sort((a, b) => a.id.localeCompare(b.id));
          setCameras(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch cameras from database:", err);
      }
    };
    fetchCams();
  }, []);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);

  // ── Connection and video statuses ──────────────────────────────────────────
  const [videoStatus, setVideoStatus] = useState("connecting"); // connecting | online | offline
  const [wsStatus, setWsStatus] = useState("connecting"); // connecting | online | offline
  const [detectionStatus, setDetectionStatus] = useState("connecting"); // connecting | online | offline
  const [detectorStatus, setDetectorStatus] = useState("Connecting to Detection Backend...");

  // Sync detectionStatus with wsStatus
  useEffect(() => {
    setDetectionStatus(wsStatus);
  }, [wsStatus]);

  // ── Diagnostics HUD state ──────────────────────────────────────────────────
  const [debugInfo, setDebugInfo] = useState(null);

  // ── Tracking data ──────────────────────────────────────────────────────────
  const [confirmedPersonTracks, setConfirmedPersonTracks] = useState([]);
  const [detectionLog, setDetectionLog] = useState([]);

  // ── Refs for subcomponent and connection ───────────────────────────────────
  const cameraFeedRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const backoffIdxRef = useRef(0);
  const activeCamera = useRef(selectedCamera);

  // ── Per-track dwell/zone/journey state (persisted across WS frames) ────────
  const trackStateRef = useRef({});
  const cumulativeSessionCountRef = useRef(new Set());

  // ── Source dimensions from backend payload ─────────────────────────────────
  const sourceDimsRef = useRef({ width: 1280, height: 720 });

  // ── tracking synchronization refs ──────────────────────────────────────────
  const trackingHistoryRef = useRef([]); // array of { videoTime, tracks }
  const lastLocalUpdateRef = useRef(0);
  const activeIdsStrRef = useRef("");

  // ─────────────────────────────────────────────────────────────────────────
  // Active camera memo
  // ─────────────────────────────────────────────────────────────────────────
  const activeCam = useMemo(
    () => cameras.find((c) => c.id === selectedCamera) || cameras[0] || DEFAULT_CAMERAS[0],
    [selectedCamera, cameras]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Color assignment — stable per TRK-NNN ID
  // ─────────────────────────────────────────────────────────────────────────
  const colorMapRef = useRef({});
  const getTrackColor = useCallback((trackId) => {
    if (!colorMapRef.current[trackId]) {
      const idx = Object.keys(colorMapRef.current).length % BB_COLORS.length;
      colorMapRef.current[trackId] = BB_COLORS[idx];
    }
    return colorMapRef.current[trackId];
  }, []);

  // smoothedBboxRef: trackId → EMA-smoothed normalized bbox { x, y, w, h }
  const smoothedBboxRef = useRef({});

  const adaptTracksPayload = useCallback((payload) => {
    const now = Date.now();
    const rawTracks = payload.tracks || [];

    // Update source dimensions from payload
    if (payload.source?.width && payload.source?.height) {
      sourceDimsRef.current = {
        width: payload.source.width,
        height: payload.source.height,
      };
    }

    const nativeW = sourceDimsRef.current.width;
    const nativeH = sourceDimsRef.current.height;

    const uniqueRawTracks = [];
    const seenIds = new Set();
    for (const tr of rawTracks) {
      if (tr.trackId && !seenIds.has(tr.trackId)) {
        seenIds.add(tr.trackId);
        uniqueRawTracks.push(tr);
      }
    }

    const activeAndLostTracks = [];

    // 1. Add all active raw tracks
    for (const track of uniqueRawTracks) {
      activeAndLostTracks.push({
        trackId: track.trackId,
        bbox: track.bbox,
        confidence: track.confidence,
        isLost: false,
      });
    }

    // 2. Clean up stale track states after 10 seconds of inactivity to prevent memory leak
    // while keeping them cached on brief occlusion to maintain continuity and EMA history.
    for (const id of Object.keys(trackStateRef.current)) {
      if (!seenIds.has(id)) {
        const tstate = trackStateRef.current[id];
        if (!tstate._lostAt) {
          tstate._lostAt = now;
        } else if (now - tstate._lostAt > 10000) {
          delete smoothedBboxRef.current[id];
          delete trackStateRef.current[id];
        }
      } else {
        if (trackStateRef.current[id]._lostAt) {
          delete trackStateRef.current[id]._lostAt;
        }
      }
    }

    const adapted = activeAndLostTracks.map((track) => {
      const { trackId, bbox, confidence } = track;

      // Guard: skip if bbox is missing or invalid (malformed backend payload)
      if (!bbox || bbox.x1 == null || bbox.y1 == null || bbox.x2 == null || bbox.y2 == null) {
        return null;
      }
      if (bbox.x2 <= bbox.x1 || bbox.y2 <= bbox.y1) return null;

      // Convert absolute pixel coords {x1, y1, x2, y2} to normalized {x, y, w, h}
      const x = bbox.x1 / nativeW;
      const y = bbox.y1 / nativeH;
      const w = (bbox.x2 - bbox.x1) / nativeW;
      const h = (bbox.y2 - bbox.y1) / nativeH;
      const normBbox = { x, y, w, h };

      if (!trackStateRef.current[trackId]) {
        trackStateRef.current[trackId] = {
          startTime: now,
          zoneStartTime: now,
          zone: activeCam.zones[0] || "Main Central Aisle",
          journey: [activeCam.zones[0] || "Main Central Aisle"],
          activity: "Walking",
          productsPicked: 0,
          lastBbox: normBbox,
          lastConfidence: confidence,
          lastUpdateTime: now,
          vx: 0,
          vy: 0,
        };
        smoothedBboxRef.current[trackId] = { ...normBbox };
      }

      const tstate = trackStateRef.current[trackId];

      // Calculate velocity vector for active tracks (change in normalized position over time)
      const dt = now - tstate.lastUpdateTime;
      if (dt > 0 && !track.isLost) {
        const instantVx = (normBbox.x - tstate.lastBbox.x) / dt;
        const instantVy = (normBbox.y - tstate.lastBbox.y) / dt;
        tstate.vx = tstate.vx + 0.35 * (instantVx - tstate.vx);
        tstate.vy = tstate.vy + 0.35 * (instantVy - tstate.vy);
      }

      tstate.lastBbox = normBbox;
      tstate.lastConfidence = confidence;
      tstate.lastUpdateTime = now;

      // Use raw current-frame coordinates directly to avoid any lag or interpolation
      const smoothedNormBbox = normBbox;

      // Convert smoothed normalized bbox back to absolute pixel coordinates for rendering
      const smoothedBboxPixels = {
        x1: Math.round(smoothedNormBbox.x * nativeW),
        y1: Math.round(smoothedNormBbox.y * nativeH),
        x2: Math.round((smoothedNormBbox.x + smoothedNormBbox.w) * nativeW),
        y2: Math.round((smoothedNormBbox.y + smoothedNormBbox.h) * nativeH),
      };

      const centerXPercent = (smoothedNormBbox.x + smoothedNormBbox.w / 2) * 100;
      const centerYPercent = (smoothedNormBbox.y + smoothedNormBbox.h / 2) * 100;

      const newZone = resolveZoneByPosition(centerXPercent, centerYPercent, activeCam);
      if (newZone !== tstate.zone) {
        tstate.zone = newZone;
        tstate.zoneStartTime = now;
        tstate.journey = [...tstate.journey, newZone];
      }

      const dwellSeconds = Math.max(1, Math.floor((now - tstate.zoneStartTime) / 1000));
      if (dwellSeconds > 25) tstate.activity = "Viewing Product";
      else if (dwellSeconds > 15) tstate.activity = "Picking Product";
      else if (dwellSeconds > 8) tstate.activity = "Browsing";
      else tstate.activity = "Walking";

      return {
        id: trackId,
        bbox: smoothedBboxPixels,
        normBbox: smoothedNormBbox,
        vx: tstate.vx || 0,
        vy: tstate.vy || 0,
        color: getTrackColor(trackId),
        bbX: centerXPercent - (smoothedNormBbox.w * 100 / 2),
        bbY: centerYPercent - (smoothedNormBbox.h * 100 / 2),
        confidence: (confidence * 100).toFixed(1),
        zone: tstate.zone,
        activity: tstate.activity,
        dwellSeconds,
        totalDwellSeconds: Math.max(1, Math.floor((now - tstate.startTime) / 1000)),
        centerX: centerXPercent,
        centerY: centerYPercent,
        journey: tstate.journey,
        productsPicked: tstate.productsPicked,
        isLost: track.isLost,
        timeSinceLost: track.timeSinceLost || 0,
      };
    });

    return adapted.filter(Boolean);
  }, [activeCam, getTrackColor]);

  const adaptTracksPayloadRef = useRef(adaptTracksPayload);
  adaptTracksPayloadRef.current = adaptTracksPayload;

  const clearTrackingState = useCallback(() => {
    setConfirmedPersonTracks([]);
    trackingHistoryRef.current = [];
    activeIdsStrRef.current = "";
    trackStateRef.current = {};
    colorMapRef.current = {};
    smoothedBboxRef.current = {};
    cumulativeSessionCountRef.current.clear();
    setDebugInfo(null);
    cameraFeedRef.current?.clear();
    if (updateLiveTrackingState) updateLiveTrackingState([], []);
  }, [updateLiveTrackingState]);


  const handleVideoTimeUpdate = useCallback((time) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "sync", time }));
    }
  }, []);

  const handleVideoStatusChange = useCallback((status) => {
    setVideoStatus(status);
  }, []);


  const connectWebSocket = useCallback((cameraId) => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    clearTrackingState();
    setWsStatus("connecting");
    setDetectorStatus("Connecting to Detection Backend...");

    const wsBase = import.meta.env.VITE_CAMS_WS_URL || `ws://${window.location.hostname}:8000`;
    const ws = new WebSocket(`${wsBase}/cams/stream/${cameraId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      backoffIdxRef.current = 0;
      setWsStatus("online");
      setDetectorStatus("YOLOv8 + ByteTrack Active");
      setVideoStatus("online");
    };

    ws.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload.type === "ping") {
        ws.send("pong");
        return;
      }

      if (payload.type === "error") {
        setDetectorStatus(`Backend error: ${payload.message}`);
        return;
      }

      if (payload.type === "connected") {
        setDetectorStatus(`YOLOv8 + ByteTrack — ${cameraId}`);
        return;
      }

      if (payload.type === "loop_reset") {
        cameraFeedRef.current?.clear();
        clearTrackingState();
        setDebugInfo(null);
        return;
      }

      if (payload.type === "tracking_debug") {
        if (payload.cameraId && payload.cameraId !== cameraId.toUpperCase()) return;
        setDebugInfo(payload);
        return;
      }

      if (payload.type === "tracks") {
        if (payload.cameraId && payload.cameraId !== cameraId.toUpperCase()) return;
        setVideoStatus("online");

        const adapted = adaptTracksPayloadRef.current(payload);

        // Push frame and track updates to the high-performance subcomponent immediately
        cameraFeedRef.current?.updateFeed(payload.frame, adapted, payload.source, payload.frameNumber);

        adapted.forEach((t) => {
          cumulativeSessionCountRef.current.add(t.id);
        });

        // Store adapted tracks in history rolling buffer
        const fps = payload.source?.fps || 30;
        const videoTime = payload.frameNumber / fps;
        trackingHistoryRef.current.push({
          videoTime,
          frameNumber: payload.frameNumber,
          tracks: adapted,
          receivedAt: Date.now()
        });
        if (trackingHistoryRef.current.length > 150) {
          trackingHistoryRef.current.shift();
        }

        // Throttle parent React state updates (KPIs/logs) to avoid rendering at 30 FPS.
        const idsStr = adapted.map(t => t.id).sort().join(",");
        const idsChanged = idsStr !== activeIdsStrRef.current;
        const now = Date.now();
        if (idsChanged || now - lastLocalUpdateRef.current > 300) {
          activeIdsStrRef.current = idsStr;
          lastLocalUpdateRef.current = now;
          setConfirmedPersonTracks(adapted);

          // Update detection log for recent tracks
          if (adapted.length > 0) {
            const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
            setDetectionLog((prev) => {
              const newEntries = adapted.slice(0, 5).map((t) => ({
                time: ts,
                id: t.id,
                event: "Tracked",
                zone: t.zone,
                confidence: `${t.confidence}%`,
              }));
              return [...newEntries, ...prev].slice(0, 20);
            });

            setDetectorStatus(`YOLOv8 + ByteTrack — ${adapted.length} person(s)`);
          } else {
            setDetectorStatus("YOLOv8 + ByteTrack — 0 persons detected");
          }
        }

        // Push to CamsContext (heatmap, dashboard analytics)
        if (updateLiveTrackingState) {
          if (adapted.length > 0) {
            const heatmapPoints = adapted.map((p) => ({
              x: p.centerX,
              y: p.centerY,
              zone: p.zone,
              dwell: p.dwellSeconds,
              timestamp: Date.now(),
            }));
            updateLiveTrackingState(adapted, heatmapPoints);
          } else {
            updateLiveTrackingState([], []);
          }
        }
      }
    };

    ws.onerror = () => {
      setWsStatus("offline");
      setDetectorStatus("Detection Offline");
    };

    ws.onclose = (event) => {
      if (cameraId !== activeCamera.current) return;

      setWsStatus("offline");
      setDetectorStatus("Detection Offline — Reconnecting...");
      clearTrackingState();

      const delay = BACKOFF_STEPS[Math.min(backoffIdxRef.current, BACKOFF_STEPS.length - 1)];
      backoffIdxRef.current += 1;

      reconnectTimer.current = setTimeout(() => {
        if (cameraId === activeCamera.current) {
          connectWebSocket(cameraId);
        }
      }, delay);
    };
  }, [adaptTracksPayload, clearTrackingState, updateLiveTrackingState]);

  // ─────────────────────────────────────────────────────────────────────────
  // Connect on mount + reconnect when camera changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    activeCamera.current = selectedCamera;
    backoffIdxRef.current = 0;

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    connectWebSocket(selectedCamera);

    return () => {
      // Cleanup on unmount or camera change
      activeCamera.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // Reset video error on camera switch
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setVideoError(false);
    setSelectedTracker(null);
  }, [selectedCamera]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived analytics — computed strictly from confirmedPersonTracks
  // ─────────────────────────────────────────────────────────────────────────
  const peopleTrackedCount = confirmedPersonTracks.length;
  const walkingCount = confirmedPersonTracks.filter((t) => t.activity === "Walking").length;
  const viewingCount = confirmedPersonTracks.filter((t) =>
    t.activity === "Viewing Product" || t.activity === "Browsing" || t.activity === "Picking Product"
  ).length;
  const totalProductsPicked = confirmedPersonTracks.reduce((s, t) => s + (t.productsPicked || 0), 0);
  const avgDwellSeconds = peopleTrackedCount > 0
    ? Math.round(confirmedPersonTracks.reduce((s, t) => s + t.totalDwellSeconds, 0) / peopleTrackedCount)
    : 0;

  const selectedTrackerData = confirmedPersonTracks.find((t) => t.id === selectedTracker);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 font-sans text-xs pb-6">
      {/* PAGE HEADER */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white tracking-wide">Live Camera Tracking & CCTV Feeds</h1>
      </div>

      {/* ── SECTION 1: TOP KPI CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Video Status", val: videoStatus === "online" ? "● Online" : videoStatus === "connecting" ? "◌ Connecting" : "✕ Offline", sub: activeCam?.name || "Initializing...", icon: "📹", accent: videoStatus === "online" ? "emerald" : videoStatus === "connecting" ? "amber" : "rose" },
          { label: "AI Detection Engine", val: "YOLOv8 + ByteTrack", sub: detectorStatus, icon: "🤖", accent: "purple" },
          { label: "People Tracked Live", val: wsStatus === "online" ? `${peopleTrackedCount} Persons` : "—", sub: wsStatus === "online" ? "Confirmed ByteTracks" : "Detection Offline", icon: "👥", accent: wsStatus === "online" ? "emerald" : "slate" },
          {
            label: "Detection Status",
            val: detectionStatus === "online" ? "● Online" : detectionStatus === "connecting" ? "◌ Connecting" : "✕ Offline",
            sub: activeCam?.location || "Initializing...",
            icon: "⚡",
            accent: detectionStatus === "online" ? "emerald" : detectionStatus === "connecting" ? "amber" : "rose",
          },
        ].map(({ label, val, sub, icon, accent }) => (
          <div key={label} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between font-mono">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block">{label}</span>
              <h2 className="text-lg font-black text-white leading-tight">{val}</h2>
              <span className={`text-[10px] font-bold text-${accent}-400`}>{sub}</span>
            </div>
            <div className={`w-10 h-10 bg-${accent}-600/20 text-${accent}-400 border border-${accent}-500/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
              {icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: SURVEILLANCE FEED SELECTOR ───────────────────────── */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Select Surveillance Feed</h3>
          <span className="text-[10px] text-slate-400 font-mono">YOLOv8 + ByteTrack Multi-Person Detection Matrix</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cameras.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setSelectedCamera(cam.id)}
              className={`p-3 rounded-xl border text-left transition ${selectedCamera === cam.id
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

      {/* ── SECTION 3: LIVE VIDEO + BOUNDING BOXES ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* VIDEO PLAYER + PERSON OVERLAYS */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-white truncate">{activeCam.name}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowVideo((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition ${showVideo && !videoError
    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
    : "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
  }`}
              >
                {showVideo && !videoError ? "📹 Live Stream Feed" : "📸 Store AI Map"}
              </button>
              <button
                onClick={() => setShowAiBoxes((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition ${showAiBoxes
    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
    : "bg-[#070C18] border-[#1E293B] text-slate-400"
  }`}
              >
                Person Overlays
              </button>
              <button
                onClick={() => setShowHeatmap((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition ${showHeatmap
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                  : "bg-[#070C18] border-[#1E293B] text-slate-400"
                  }`}
              >
                Heatmap
              </button>
            </div>
          </div>

          {/* VIDEO + OVERLAY CONTAINER */}
          <LiveCameraFeed
            ref={cameraFeedRef}
            showAiBoxes={showAiBoxes}
            showHeatmap={showHeatmap}
            showVideo={showVideo}
            selectedTracker={selectedTracker}
            setSelectedTracker={setSelectedTracker}
            activeCam={activeCam}
            getTrackColor={getTrackColor}
            debugInfo={debugInfo}
            wsStatus={wsStatus}
            videoStatus={videoStatus}
            onVideoTimeUpdate={handleVideoTimeUpdate}
            onVideoStatusChange={handleVideoStatusChange}
          />

          {/* STREAM SPECS */}
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            {[
              ["Resolution", activeCam.res],
              ["Frame Rate", `${activeCam.fps} FPS`],
              ["Location", activeCam.location],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#070C18] border border-[#1E293B] rounded-lg p-2 font-mono">
                <span className="text-slate-500 block">{k}</span>
                <span className="text-white font-bold truncate">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE INFERENCE METRICS PANEL */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Live Inference Metrics</h3>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
              <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === "online" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              {wsStatus === "online" ? "ByteTrack Engine Sync" : "Detection Offline"}
            </span>
          </div>

          {/* METRIC CARDS */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "People Tracked", val: peopleTrackedCount, icon: "👥", color: "emerald", desc: "Confirmed ByteTracks" },
              { label: "Walking Count", val: walkingCount, icon: "🚶", color: "blue", desc: "In Motion" },
              { label: "Viewing / Browsing", val: viewingCount, icon: "👁️", color: "cyan", desc: "Dwell / Fixations" },
              { label: "Products Picked", val: totalProductsPicked, icon: "🛍️", color: "purple", desc: "Items Picked Up" },
              { label: "Avg Dwell Time", val: fmtDwell(avgDwellSeconds), icon: "⏱️", color: "amber", desc: "Mean Dwell Duration" },
              { label: "Total Session Count", val: cumulativeSessionCountRef.current.size, icon: "📊", color: "teal", desc: "Session Total" },
            ].map(({ label, val, icon, color, desc }) => (
              <div key={label} className="bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[9px] block">{label}</span>
                  <span className={`text-${color}-400 font-black text-sm block mt-0.5`}>{val}</span>
                  <span className="text-[8px] text-slate-500 block">{desc}</span>
                </div>
                <span className="text-lg">{icon}</span>
              </div>
            ))}
          </div>

          {/* ZONE ACTIVITY BREAKDOWN */}
          <div className="pt-2 border-t border-[#1E293B] space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone Activity Breakdown</h4>
              <span className="text-[9px] text-slate-500">Real-Time Occupancy</span>
            </div>
            {activeCam.zones.map((zone, zi) => {
              const zonePersons = confirmedPersonTracks.filter((t) => t.zone === zone);
              const count = zonePersons.length;
              const pct = peopleTrackedCount > 0 ? Math.round((count / peopleTrackedCount) * 100) : 0;
              const accentColor = BB_COLORS[zi % BB_COLORS.length];

              return (
                <div key={zone} className="space-y-1">
                  <div className="flex justify-between text-[9.5px]">
                    <span className="text-slate-200 font-bold truncate max-w-[180px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: accentColor }} />
                      {zone}
                    </span>
                    <span className="text-white font-extrabold">{count} people ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: accentColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* CUSTOMER PROFILE INSPECTOR */}
          {selectedTrackerData && (
            <div className="bg-[#070C18] border border-cyan-500/50 p-3.5 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center border-b border-[#1E293B] pb-1.5">
                <span className="font-black text-cyan-400 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: selectedTrackerData.color }} />
                  {selectedTrackerData.id} Human Profile
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  Zone Dwell: <strong className="text-amber-400">{fmtDwell(selectedTrackerData.dwellSeconds)}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-400 block">Current Zone:</span>
                  <strong className="text-white">{selectedTrackerData.zone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Activity:</span>
                  <strong className="text-emerald-400">{selectedTrackerData.activity}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Dwell Time:</span>
                  <strong className="text-amber-400">{fmtDwell(selectedTrackerData.totalDwellSeconds)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Items Picked:</span>
                  <strong className="text-purple-400">{selectedTrackerData.productsPicked}</strong>
                </div>
              </div>
              <div className="pt-1.5 border-t border-[#1E293B] text-[9px]">
                <span className="text-slate-400 block mb-1">Human Trajectory Path:</span>
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

      {/* ── SECTION 4: REAL-TIME DETECTION LOG ─────────────────────────── */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono space-y-3">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Real-Time Person Detection Log</h3>
          <span className="text-[9px] text-slate-400">YOLOv8 + ByteTrack Frame Stream</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-500">
                <th className="pb-1.5">Timestamp</th>
                <th className="pb-1.5">Person ID</th>
                <th className="pb-1.5">Detected Event</th>
                <th className="pb-1.5">Zone Location</th>
                <th className="pb-1.5 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/50">
              {detectionLog.slice(0, 5).map((log, idx) => (
                <tr key={idx} className="hover:bg-[#172033]/50">
                  <td className="py-1 text-slate-400">{log.time}</td>
                  <td className="py-1 text-cyan-400 font-bold">{log.id}</td>
                  <td className="py-1 text-white">{log.event}</td>
                  <td className="py-1 text-slate-300">{log.zone}</td>
                  <td className="py-1 text-right text-emerald-400 font-bold">{log.confidence}</td>
                </tr>
              ))}
              {detectionLog.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-slate-500">
                    {wsStatus === "offline" ? "⚠️ Detection backend offline" : "Waiting for detection data..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 