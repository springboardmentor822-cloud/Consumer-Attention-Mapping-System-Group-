"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { heatmapStore } from '../../lib/heatmapStore';
import { STORE_ZONES, CAMERA_ZONE_MAP } from '../../lib/storeZones';
import { footfallStore } from '../../lib/footfallStore';
import { shelfEventStore } from '../../lib/shelfEventStore';

// Motion classification thresholds for the Tier-1 (motion-in-zone) proxy.
// This is a coarse, honest signal derived from real frame-to-frame bbox
// displacement — it is NOT action recognition (can't distinguish "reach"
// from "inspect"), see shelfEventStore.ts and main.py's _detect_pauses for
// the server-side equivalent used once real tracks exist.
const SUSTAINED_DWELL_PX_PER_S = 25; // below this centroid speed = "paused/engaged"
const MOTION_SPIKE_PX_PER_S = 90;    // above this = "active motion" (e.g. reaching, walking through)

// Cameras pointed at shelf/product zones (per CAMERA_ZONE_MAP) — only these
// feed shelfEventStore, since Cam 1 (Entrance/Mall footage) isn't a shelf.
const SHELF_ZONE_CAMERAS = new Set([2, 3, 4]);

const CAMERAS: { id: number; label: string; color: string; dataset: string; videoSrc: string }[] = [
  { id: 1, label: 'Cam 1: /datasets/archive', color: 'text-cyan-400', dataset: 'archive', videoSrc: '/datasets/archive/cam1.mp4' },
  { id: 2, label: 'Cam 2: /datasets/archive_1', color: 'text-purple-400', dataset: 'archive_1', videoSrc: '/datasets/archive_1/cam1.mp4' },
  { id: 3, label: 'Cam 3: /datasets/archive_2_products', color: 'text-emerald-400', dataset: 'archive_2_products', videoSrc: '/datasets/archive_2_products/cam1.mp4' },
  { id: 4, label: 'Cam 4: /datasets/archive_3_shelves', color: 'text-rose-400', dataset: 'archive_3_shelves', videoSrc: '/datasets/archive_3_shelves/cam1.mp4' },
];

// ===========================================================================
// MODE: "backend" — the REAL pipeline.
//
// Hits the FastAPI backend's authenticated MJPEG endpoint
// (GET /api/camera/stream/{camera_id}, proxied through Next.js at
// /api/backend/camera/stream/{camera_id} so the httpOnly auth cookie rides
// along — see main.py's comment on that route for why a direct cross-origin
// <img src> would silently drop the cookie instead).
//
// This is what actually runs main.py's YOLOv8 + SimpleIOUTracker, the
// GLOBAL_ID_LOCK-guarded cross-camera Re-ID (deep_reid.py), the TTL eviction
// job, and pose_engine.py's reach detection — none of which executed before,
// because nothing in the UI ever requested this endpoint. The backend
// annotates boxes + Global IDs onto the JPEG frames itself, so this is a
// plain <img>, no client-side model needed.
// ===========================================================================
const BackendStreamNode = ({ id, label, color }: { id: number; label: string; color: string }) => {
  const [errored, setErrored] = useState(false);
  // Bump this to force the <img> to reconnect after a transient failure
  // (browsers don't auto-retry a broken multipart/x-mixed-replace stream).
  const [retryKey, setRetryKey] = useState(0);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col h-full">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs font-semibold z-20">
        <span className={color}>{label}</span>
        <span className="text-emerald-500 flex items-center">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>
          Server-Tracked
        </span>
      </div>

      <div className="relative w-full flex-1 aspect-video bg-black flex items-center justify-center overflow-hidden">
        {errored ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm px-4 text-center gap-3">
            <span className="font-mono text-sm text-rose-400">
              Stream unavailable — sign in required, or the backend isn&apos;t running.
            </span>
            <button
              onClick={() => { setErrored(false); setRetryKey(k => k + 1); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded border border-slate-700"
            >
              Retry
            </button>
          </div>
        ) : (
          // Same-origin path is required: /api/backend/... goes through the
          // Next.js rewrite so the httpOnly auth cookie is attached. Pointing
          // this at the backend's own host/port directly will 401.
          // eslint-disable-next-line @next/next/no-img-element -- MJPEG multipart stream, not a static image Next/Image can optimize
          <img
            key={retryKey}
            src={`/api/backend/camera/stream/${id}`}
            alt={label}
            onError={() => setErrored(true)}
            className="absolute inset-0 w-full h-full object-contain z-0"
          />
        )}
      </div>
    </div>
  );
};

// ===========================================================================
// MODE: "local" — the original browser-side demo.
//
// Runs TensorFlow.js COCO-SSD directly against the local sample .mp4 files,
// entirely client-side. Kept as an explicit opt-in fallback (not the
// default) since it's what actually feeds heatmapStore / footfallStore /
// shelfEventStore for anyone who doesn't have the backend reachable — but it
// is a separate, simpler, unauthenticated pipeline from the one main.py
// implements, and doesn't exercise any of the server-side Re-ID/pose/TTL work.
// ===========================================================================
let sharedModelPromise: Promise<cocoSsd.ObjectDetection> | null = null;
let sharedBackendPromise: Promise<string> | null = null;

const initTfBackend = async (): Promise<string> => {
  try {
    await tf.setBackend('webgl');
    await tf.ready();
    return 'webgl';
  } catch (err) {
    console.warn('WebGL backend unavailable, falling back to CPU:', err);
    await tf.setBackend('cpu');
    await tf.ready();
    return 'cpu';
  }
};

const getSharedTfBackend = () => {
  if (!sharedBackendPromise) {
    sharedBackendPromise = initTfBackend();
  }
  return sharedBackendPromise;
};

const getSharedModel = () => {
  if (!sharedModelPromise) {
    sharedModelPromise = getSharedTfBackend().then(() => cocoSsd.load());
  }
  return sharedModelPromise;
};

// Global Lock: Prevents multiple cameras from running AI in the exact same millisecond
let globalDetectingLock = false;

const LocalDemoNode = ({
  videoSrc,
  title,
  titleColor,
  model,
  cameraId,
  loadError
}: {
  videoSrc: string;
  title: string;
  titleColor: string;
  model: cocoSsd.ObjectDetection | null;
  cameraId: number;
  loadError?: string | null;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDetectingRef = useRef(false);
  const prevCentroidsRef = useRef<{ points: { x: number; y: number }[]; t: number } | null>(null);

  useEffect(() => {
    if (!model) return;

    let animationFrameId: number;
    let lastDetectionTime = 0;

    const FPS_LIMIT = 3;
    const INTERVAL = 1000 / FPS_LIMIT;
    const staggerOffset = cameraId * 100;

    const detectFrame = async (timestamp: number) => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {

        const timeSinceLast = timestamp - lastDetectionTime;

        if (timeSinceLast >= (INTERVAL + staggerOffset) && !isDetectingRef.current && !globalDetectingLock) {

          isDetectingRef.current = true;
          globalDetectingLock = true;
          lastDetectionTime = timestamp;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          try {
            const predictions = await model.detect(video, 5, 0.4);

            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              predictions.forEach(prediction => {
                const [x, y, width, height] = prediction.bbox;
                const isPerson = prediction.class === 'person';
                const color = isPerson ? '#10b981' : '#f43f5e';

                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, width, height);

                ctx.fillStyle = color;
                ctx.font = 'bold 16px monospace';
                const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
                const textWidth = ctx.measureText(label).width;
                ctx.fillRect(x, y - 24, textWidth + 10, 24);

                ctx.fillStyle = '#0f172a';
                ctx.fillText(label, x + 5, y - 6);
              });
            }

            const zoneKey = CAMERA_ZONE_MAP[cameraId];
            const zone = zoneKey ? STORE_ZONES[zoneKey] : null;
            if (zone) {
              const heatPoints = predictions
                .filter(p => p.class === 'person')
                .map(p => {
                  const [bx, by, bw, bh] = p.bbox;
                  const nx = Math.min(Math.max((bx + bw / 2) / canvas.width, 0), 1);
                  const ny = Math.min(Math.max((by + bh / 2) / canvas.height, 0), 1);
                  return {
                    x: zone.x + nx * zone.w,
                    y: zone.y + ny * zone.h,
                    weight: Math.min(40 + p.score * 60, 100),
                  };
                });
              heatmapStore.reportBatch(`camera-${cameraId}`, heatPoints);
            }

            const personCount = predictions.filter(p => p.class === 'person').length;
            footfallStore.reportDetection(personCount);

            if (SHELF_ZONE_CAMERAS.has(cameraId)) {
              const nowT = performance.now() / 1000;
              const centroids = predictions
                .filter(p => p.class === 'person')
                .map(p => {
                  const [bx, by, bw, bh] = p.bbox;
                  return { x: bx + bw / 2, y: by + bh / 2 };
                });

              const prev = prevCentroidsRef.current;
              if (prev && centroids.length > 0 && prev.points.length > 0) {
                const dt = nowT - prev.t;
                if (dt > 0) {
                  let totalDisplacement = 0;
                  let matched = 0;
                  centroids.forEach(c => {
                    let best = Infinity;
                    prev.points.forEach(pp => {
                      const d = Math.hypot(c.x - pp.x, c.y - pp.y);
                      if (d < best) best = d;
                    });
                    if (best !== Infinity) {
                      totalDisplacement += best;
                      matched += 1;
                    }
                  });

                  if (matched > 0) {
                    const avgSpeedPxPerS = (totalDisplacement / matched) / dt;
                    if (avgSpeedPxPerS <= SUSTAINED_DWELL_PX_PER_S) {
                      shelfEventStore.logEvent({
                        timestamp: Date.now(),
                        cameraId,
                        type: 'sustained_dwell',
                        intensity: Math.round(Math.max(0, 100 - avgSpeedPxPerS * 2)),
                      });
                    } else if (avgSpeedPxPerS >= MOTION_SPIKE_PX_PER_S) {
                      shelfEventStore.logEvent({
                        timestamp: Date.now(),
                        cameraId,
                        type: 'motion_spike',
                        intensity: Math.round(Math.min(100, avgSpeedPxPerS / 2)),
                      });
                    }
                  }
                }
              }
              prevCentroidsRef.current = { points: centroids, t: nowT };
            }

          } catch (err) {
            console.error(`Camera ${cameraId} detection error:`, err);
          } finally {
            isDetectingRef.current = false;
            globalDetectingLock = false;
          }
        }
      }
      animationFrameId = requestAnimationFrame(detectFrame);
    };

    animationFrameId = requestAnimationFrame(detectFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      heatmapStore.clearSource(`camera-${cameraId}`);
      prevCentroidsRef.current = null;
    };
  }, [model, cameraId]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col h-full">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs font-semibold z-20">
        <span className={titleColor}>{title}</span>
        <span className="text-amber-400 flex items-center">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1 animate-pulse"></span>Browser Demo
        </span>
      </div>

      <div className="relative w-full flex-1 aspect-video bg-black flex items-center justify-center overflow-hidden">
        {!model && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 text-center">
            <span className={`font-mono text-sm ${loadError ? 'text-rose-400' : 'text-cyan-400 animate-pulse'}`}>
              {loadError ? 'Detection unavailable — feed only' : 'Loading Shared AI Model...'}
            </span>
          </div>
        )}

        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay loop muted playsInline crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-contain z-0"
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default function CamerasTab() {
  // Backend stream is the default: it's the pipeline main.py actually
  // implements (locks, TTL eviction, pose-based reach, deep Re-ID). Local
  // mode is an explicit opt-in fallback, not the primary experience.
  const [mode, setMode] = useState<'backend' | 'local'>('backend');

  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tfBackend, setTfBackend] = useState<string | null>(null);

  // Only load the ~6MB client-side model if the person actually switches to
  // local mode — no point paying that cost when the backend stream is doing
  // the real work by default.
  useEffect(() => {
    if (mode !== 'local' || model) return;
    let cancelled = false;

    getSharedTfBackend().then((active) => {
      if (!cancelled) setTfBackend(active);
    });

    getSharedModel()
      .then((loadedModel) => {
        if (!cancelled) setModel(loadedModel);
      })
      .catch((err) => {
        console.error('Failed to load COCO-SSD model:', err);
        if (!cancelled) setLoadError('AI model failed to load. Live detection is unavailable — the video feeds below will still play.');
      });

    return () => { cancelled = true; };
  }, [mode, model]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Live Camera Feeds & AI Inference</h3>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'backend'
                ? "Server-side YOLOv8 + IOU tracking, Re-ID, and pose-based reach detection (main.py)."
                : "Browser-side TensorFlow.js COCO-SSD demo — separate from and simpler than the server pipeline."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setMode('backend')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'backend' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Server AI Stream
              </button>
              <button
                onClick={() => setMode('local')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'local' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Browser Demo
              </button>
            </div>

            {mode === 'local' && (
              <div className={`px-3 py-2 rounded-lg flex items-center border ${
                loadError
                  ? 'bg-rose-500/10 border-rose-500/20'
                  : model
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  loadError ? 'bg-rose-500' : model ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500 animate-pulse'
                }`}></div>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  loadError ? 'text-rose-400' : model ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {loadError
                    ? 'Model Load Failed'
                    : model
                      ? `Shared Model Active${tfBackend ? ` (${tfBackend.toUpperCase()})` : ''}`
                      : 'Loading Model...'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
          <span>ℹ️</span>
          {mode === 'backend' ? (
            <span>
              This feed is the real backend pipeline — YOLOv8 detection, a locked cross-camera Re-ID store,
              TTL-based profile cleanup, and MediaPipe reach detection all run here. It requires you to be signed in
              (the stream is served through the authenticated <code className="bg-slate-900 px-1 rounded">/api/backend/camera/stream/&#123;id&#125;</code> proxy)
              and the backend process to be running.
            </span>
          ) : (
            <span>
              This mode runs a separate, simpler object-detection model entirely in your browser against the same
              sample videos — useful if the backend isn&apos;t reachable, but it does not exercise the server-side
              Re-ID, TTL eviction, or pose-based reach detection described elsewhere in this dashboard.
            </span>
          )}
        </div>

        {mode === 'local' && loadError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-6 text-sm text-rose-300">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mode === 'backend'
            ? CAMERAS.map(cam => (
                <BackendStreamNode key={cam.id} id={cam.id} label={cam.label} color={cam.color} />
              ))
            : CAMERAS.map(cam => (
                <LocalDemoNode
                  key={cam.id}
                  cameraId={cam.id}
                  videoSrc={cam.videoSrc}
                  title={cam.label}
                  titleColor={cam.color}
                  model={model}
                  loadError={loadError}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
