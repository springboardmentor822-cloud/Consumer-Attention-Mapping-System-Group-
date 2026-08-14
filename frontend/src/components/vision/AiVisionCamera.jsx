/**
 * AiVisionCamera — Compact surveillance tile
 * ============================================
 * Displays a video feed and receives live tracking status from the
 * CAMS Python backend via WebSocket.
 * 
 * Does NOT perform any browser-side inference.
 * Detection is done exclusively by YOLOv8 + ByteTrack on the backend.
 */
import React, { useRef, useState, useEffect, useCallback } from "react";

const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 10000];

export default function AiVisionCamera({ cameraName, videoSrc, cameraId, showHeatmap = false }) {
  const videoRef  = useRef(null);
  const wsRef     = useRef(null);
  const reconnect = useRef(null);
  const backoffIdx = useRef(0);
  const isMounted  = useRef(true);

  const [status,      setStatus]      = useState("Connecting...");
  const [personCount, setPersonCount] = useState(0);
  const [wsOnline,    setWsOnline]    = useState(false);

  const connect = useCallback((camId) => {
    if (!camId) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }

    const base = import.meta.env.VITE_CAMS_WS_URL || `ws://${window.location.hostname}:8000`;
    let ws;
    try { ws = new WebSocket(`${base}/cams/stream/${camId}`); }
    catch { setStatus("Offline"); return; }

    wsRef.current = ws;

    ws.onopen  = () => { if (!isMounted.current) return; backoffIdx.current = 0; setWsOnline(true); setStatus("YOLOv8 Active"); };
    ws.onerror = () => { if (!isMounted.current) return; setWsOnline(false); setStatus("Detection Offline"); };
    ws.onmessage = (e) => {
      if (!isMounted.current) return;
      try {
        const p = JSON.parse(e.data);
        if (p.type === "tracks") {
          setPersonCount(p.tracks?.length ?? 0);
          setStatus(p.tracks?.length > 0 ? `${p.tracks.length} person(s)` : "Scanning...");
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      if (!isMounted.current) return;
      setWsOnline(false); setStatus("Detection Offline");
      const delay = BACKOFF_STEPS[Math.min(backoffIdx.current, BACKOFF_STEPS.length - 1)];
      backoffIdx.current++;
      reconnect.current = setTimeout(() => { if (isMounted.current) connect(camId); }, delay);
    };
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (cameraId) connect(cameraId);
    return () => {
      isMounted.current = false;
      if (reconnect.current) clearTimeout(reconnect.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [cameraId, connect]);

  return (
    <div className="bg-[#111827] border border-[#273449] rounded-xl p-2.5 space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-extrabold text-white truncate">{cameraName}</h4>
        <span className={`text-[9px] font-mono border px-2 py-0.5 rounded font-bold ${
          wsOnline
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-slate-500/10 border-slate-500/30 text-slate-400"
        }`}>
          {status}
        </span>
      </div>

      <div className="relative w-full h-36 bg-[#000000] border border-[#273449] rounded-lg overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc || "/videos/checkout1.mp4"}
          autoPlay
          loop
          muted
          playsInline
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{
            filter: showHeatmap
              ? "hue-rotate(180deg) saturate(200%) contrast(110%)"
              : "contrast(105%) saturate(90%)",
          }}
        />
        {/* Person count overlay */}
        {wsOnline && personCount > 0 && (
          <div className="absolute top-1 right-1 bg-black/80 border border-emerald-500/50 text-emerald-400 text-[8px] font-mono font-black px-1.5 py-0.5 rounded">
            👥 {personCount}
          </div>
        )}
        {!wsOnline && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 border border-rose-500/40 text-rose-400 text-[8px] font-mono px-2 py-1 rounded">
              Detection Offline
            </span>
          </div>
        )}
        {showHeatmap && (
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/60 via-amber-600/40 to-rose-600/60 mix-blend-color-dodge pointer-events-none" />
        )}
      </div>

      <div className="flex items-center space-x-1.5 pt-0.5">
        <span className={`w-2 h-2 rounded-full ${wsOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
        <span className="text-[10px] text-slate-300 font-extrabold">
          {wsOnline ? "● Live Telemetry Stream" : "○ Backend Offline"}
        </span>
      </div>
    </div>
  );
}
