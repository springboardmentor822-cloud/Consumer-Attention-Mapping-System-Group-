import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Play, Square, Activity, ShieldAlert, Sliders, Filter, Box, Layers, User } from 'lucide-react';

export default function LiveWebcamModal({ isOpen, onClose, storeId = 1, activeToken, theme = 'dark' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [telemetry, setTelemetry] = useState({ fps: 0, humanCount: 0, productCount: 0, shelfCount: 0, maxDwell: 0, detections: [] });
  const [cameraId, setCameraId] = useState(1);
  const [zoneId, setZoneId] = useState(1);

  // Interactive controls
  const [confidence, setConfidence] = useState(0.25);
  const [classFilter, setClassFilter] = useState('all'); // 'all', 'human', 'object'

  const isProcessing = useRef(false);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsRef = useRef(0);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopWebcam();
    }
  }, [isOpen]);

  async function startWebcam() {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStreaming(true);
      lastTimeRef.current = performance.now();
      frameCountRef.current = 0;
      fpsRef.current = 0;
    } catch (err) {
      console.error('Failed to access webcam:', err);
      setErrorMsg(err.message || 'Webcam access denied or unavailable.');
    }
  }

  function stopWebcam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreaming(false);
    setTelemetry({ fps: 0, humanCount: 0, productCount: 0, shelfCount: 0, maxDwell: 0, detections: [] });
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  // Live Frame Ingest Loop
  useEffect(() => {
    let intervalId;
    if (streaming) {
      intervalId = setInterval(async () => {
        if (isProcessing.current || !videoRef.current) return;
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.paused || video.ended) return;

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        isProcessing.current = true;

        // Capture frame onto offscreen canvas
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext('2d');
        offCtx.drawImage(video, 0, 0, width, height);
        const imageBase64 = offscreen.toDataURL('image/jpeg', 0.6);

        const activeStoreId = storeId || 1;

        try {
          const headers = { 'Content-Type': 'application/json' };
          if (activeToken) {
            headers['Authorization'] = `Bearer ${activeToken}`;
          }

          const response = await fetch(`http://localhost:8000/api/stores/${activeStoreId}/tracking/live-frame`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              image_base64: imageBase64,
              camera_id: parseInt(cameraId) || 1,
              zone_id: parseInt(zoneId) || 1,
              confidence: parseFloat(confidence),
              class_filter: classFilter,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Calculate live FPS
            const now = performance.now();
            frameCountRef.current += 1;
            const delta = (now - lastTimeRef.current) / 1000;
            if (delta >= 1.0) {
              fpsRef.current = Math.round((frameCountRef.current / delta) * 10) / 10;
              frameCountRef.current = 0;
              lastTimeRef.current = now;
            }

            const detections = data.detections || [];
            setTelemetry({
              fps: fpsRef.current || 6.5,
              humanCount: data.human_count || 0,
              productCount: data.product_count || 0,
              shelfCount: data.shelf_count || 0,
              maxDwell: data.max_dwell_seconds || 0,
              detections: detections,
            });

            // Overlay bounding boxes on canvas over video
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, width, height);
              drawMultiCategoryHUD(ctx, detections, width, height);
            }
          }
        } catch (err) {
          console.warn('Live frame post warning:', err);
        } finally {
          isProcessing.current = false;
        }
      }, 140); // ~7 frames per second
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [streaming, storeId, activeToken, cameraId, zoneId, confidence, classFilter]);

  function drawMultiCategoryHUD(ctx, detections, width, height) {
    detections.forEach((det) => {
      const [left, top, right, bottom] = det.bbox_xyxy;
      const w = right - left;
      const h = bottom - top;
      const cat = det.retail_category || (det.is_human ? 'human' : 'product');

      // Color coding per retail category
      let mainColor = '#f59e0b'; // Amber (Supermarket Product)
      let fillBg = 'rgba(245, 158, 11, 0.08)';

      if (cat === 'human') {
        mainColor = '#14b8a6'; // Teal (Shopper / Human)
        fillBg = 'rgba(20, 184, 166, 0.08)';
      } else if (cat === 'shelf_structure') {
        mainColor = '#06b6d4'; // Cyan (Shelf / Display Structure)
        fillBg = 'rgba(6, 182, 212, 0.12)';
      } else if (cat === 'bag_basket') {
        mainColor = '#a855f7'; // Purple (Shopper Bag / Basket)
        fillBg = 'rgba(168, 85, 247, 0.10)';
      }

      const confText = `${Math.round(det.confidence * 100)}%`;

      // 1. Draw corner brackets
      const cornerLength = Math.min(24, Math.min(w, h) * 0.25);
      ctx.lineWidth = 3;
      ctx.strokeStyle = mainColor;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(left, top + cornerLength);
      ctx.lineTo(left, top);
      ctx.lineTo(left + cornerLength, top);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(right - cornerLength, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, top + cornerLength);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(left, bottom - cornerLength);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left + cornerLength, bottom);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(right - cornerLength, bottom);
      ctx.lineTo(right, bottom);
      ctx.lineTo(right, bottom - cornerLength);
      ctx.stroke();

      // Box translucent fill
      ctx.fillStyle = fillBg;
      ctx.fillRect(left, top, w, h);

      // 2. Category Tag Label
      const displayTitle = det.display_label || (cat === 'human' ? 'HUMAN' : det.class_name.toUpperCase());
      const tagLabel = cat === 'human' 
        ? `${displayTitle} #${det.track_id} • Dwell ${det.dwell_seconds}s` 
        : `${displayTitle} #${det.track_id}`;
      
      ctx.font = 'bold 12px monospace';
      const labelWidth = ctx.measureText(`${tagLabel} (${confText})`).width;
      const bgTop = top - 24 > 0 ? top - 24 : top;
      
      ctx.fillStyle = mainColor;
      ctx.fillRect(left, bgTop, labelWidth + 14, 24);

      ctx.fillStyle = '#000000';
      ctx.fillText(`${tagLabel} (${confText})`, left + 6, bgTop + 16);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl p-5 overflow-hidden ${
        theme === 'dark' ? 'bg-[#090d16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${streaming ? 'bg-teal-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${streaming ? 'bg-teal-500' : 'bg-amber-500'}`} />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-teal-400" />
                Supermarket Products & Shelf Structure Classifier
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                STATUS: {streaming ? 'MULTI-CATEGORY AI ACTIVE' : 'STANDBY'} • SENSOR: WEBCAM • DETECTOR: YOLO+BYTETRACK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-200">
            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Grid: Video Stream + Controls & Telemetry */}
        <div className="grid gap-4 md:grid-cols-[1fr_310px]">
          {/* Main Video Window with Overlay Canvas */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              className={`w-full h-full object-contain ${streaming ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 text-slate-400">
                <Camera className="h-14 w-14 text-teal-500 animate-pulse" />
                <p className="text-xs font-medium">Click "Start Laptop Webcam" to classify products & shelves</p>
              </div>
            )}
          </div>

          {/* Side Telemetry & Controls Panel */}
          <div className="flex flex-col justify-between space-y-3 bg-slate-900/50 rounded-2xl p-4 border border-slate-800/80">
            <div className="space-y-3.5 text-xs">
              {/* Telemetry Metrics Header */}
              <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-2 border-slate-800">
                <Activity className="h-4 w-4 text-teal-400" /> Supermarket Telemetry
              </h4>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-400 flex items-center gap-1"><User className="h-3 w-3 text-teal-400" /> Humans</div>
                  <div className="font-bold text-teal-400 text-sm mt-0.5">{telemetry.humanCount}</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-400 flex items-center gap-1"><Box className="h-3 w-3 text-amber-400" /> Products</div>
                  <div className="font-bold text-amber-400 text-sm mt-0.5">{telemetry.productCount}</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-400 flex items-center gap-1"><Layers className="h-3 w-3 text-cyan-400" /> Shelves</div>
                  <div className="font-bold text-cyan-400 text-sm mt-0.5">{telemetry.shelfCount}</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-400">Max Dwell</div>
                  <div className="font-bold text-white text-sm mt-0.5">{telemetry.maxDwell}s</div>
                </div>
              </div>

              {/* Category Legend & Sliders */}
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1"><Sliders className="h-3 w-3 text-teal-400" /> Confidence</span>
                  <span className="text-teal-400 font-mono">{Math.round(confidence * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.80"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 accent-teal-500 rounded-lg cursor-pointer"
                />

                <div className="pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Filter className="h-3 w-3 text-amber-400" /> Class Filter
                  </label>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold">
                    <button
                      onClick={() => setClassFilter('all')}
                      className={`py-1 rounded border transition cursor-pointer ${
                        classFilter === 'all' ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setClassFilter('human')}
                      className={`py-1 rounded border transition cursor-pointer ${
                        classFilter === 'human' ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      Humans
                    </button>
                    <button
                      onClick={() => setClassFilter('object')}
                      className={`py-1 rounded border transition cursor-pointer ${
                        classFilter === 'object' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      Items
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Detections Tag List */}
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Classified Retail Items</h5>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-[10px] font-mono">
                  {telemetry.detections.length === 0 ? (
                    <p className="text-slate-500 italic">No objects in camera view</p>
                  ) : (
                    telemetry.detections.map((det, idx) => {
                      const cat = det.retail_category;
                      let badgeColor = 'text-amber-400';
                      if (cat === 'human') badgeColor = 'text-teal-400';
                      else if (cat === 'shelf_structure') badgeColor = 'text-cyan-400';
                      else if (cat === 'bag_basket') badgeColor = 'text-purple-400';

                      return (
                        <div key={idx} className="flex justify-between items-center p-1.5 rounded bg-slate-950/80 border border-slate-800">
                          <span className={`font-bold ${badgeColor}`}>
                            {det.display_label || det.class_name.toUpperCase()} #{det.track_id}
                          </span>
                          <span className="text-slate-400">{det.is_human ? `${det.dwell_seconds}s` : `${Math.round(det.confidence * 100)}%`}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Main Action Control */}
            <div className="pt-2 border-t border-slate-800">
              {!streaming ? (
                <button
                  onClick={startWebcam}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  <Play className="h-4 w-4" /> Start Laptop Webcam
                </button>
              ) : (
                <button
                  onClick={stopWebcam}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs transition cursor-pointer"
                >
                  <Square className="h-4 w-4" /> Stop Live Feed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
