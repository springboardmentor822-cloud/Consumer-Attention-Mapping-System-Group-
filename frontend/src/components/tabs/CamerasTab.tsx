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

// 1. Singleton model loader — tries WebGL first (fast), falls back to CPU if WebGL
// isn't available on this device instead of crashing the whole tab.
let sharedModelPromise: Promise<cocoSsd.ObjectDetection> | null = null;
let sharedBackendPromise: Promise<string> | null = null;

const initBackend = async (): Promise<string> => {
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

const getSharedBackend = () => {
  if (!sharedBackendPromise) {
    sharedBackendPromise = initBackend();
  }
  return sharedBackendPromise;
};

const getSharedModel = () => {
  if (!sharedModelPromise) {
    sharedModelPromise = getSharedBackend().then(() => cocoSsd.load());
  }
  return sharedModelPromise;
};

// 2. Global Lock: Prevents multiple cameras from running AI in the exact same millisecond
let globalDetectingLock = false;

const CameraNode = ({ 
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
  // Previous frame's person centroids + the timestamp they were captured at,
  // used to compute real frame-to-frame displacement for the motion proxy.
  const prevCentroidsRef = useRef<{ points: { x: number; y: number }[]; t: number } | null>(null);

  useEffect(() => {
    if (!model) return;

    let animationFrameId: number;
    let lastDetectionTime = 0;
    
    // Throttle to 3 FPS (333ms) - Perfect for dashboard telemetry without UI lag
    const FPS_LIMIT = 3; 
    const INTERVAL = 1000 / FPS_LIMIT;
    
    // Stagger the initial start times based on camera ID so they don't fire simultaneously
    const staggerOffset = cameraId * 100; 

    const detectFrame = async (timestamp: number) => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        
        const timeSinceLast = timestamp - lastDetectionTime;
        
        // Check if it is this camera's turn AND the global thread is free
        if (timeSinceLast >= (INTERVAL + staggerOffset) && !isDetectingRef.current && !globalDetectingLock) {
          
          isDetectingRef.current = true;
          globalDetectingLock = true; // Lock other cameras out
          lastDetectionTime = timestamp;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          // Match canvas internal resolution to video
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          try {
            // Cap detections at 5 to keep processing blazing fast
            const predictions = await model.detect(video, 5, 0.4);

            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              predictions.forEach(prediction => {
                const [x, y, width, height] = prediction.bbox;
                const isPerson = prediction.class === 'person';
                const color = isPerson ? '#10b981' : '#f43f5e';

                // Box
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, width, height);

                // Label
                ctx.fillStyle = color;
                ctx.font = 'bold 16px monospace';
                const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
                const textWidth = ctx.measureText(label).width;
                ctx.fillRect(x, y - 24, textWidth + 10, 24);

                ctx.fillStyle = '#0f172a';
                ctx.fillText(label, x + 5, y - 6);
              });
            }
            // Feed the heatmap: translate each detected person's position within
            // this camera's frame into a point inside its assigned store zone.
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

            // --- Real footfall count: how many people this camera sees right now ---
            const personCount = predictions.filter(p => p.class === 'person').length;
            footfallStore.reportDetection(personCount);

            // --- Real Tier-1 motion proxy for shelf/product cameras ---
            if (SHELF_ZONE_CAMERAS.has(cameraId)) {
              const nowT = performance.now() / 1000; // seconds
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
                  // Naive nearest-neighbor match (small N, good enough for a coarse proxy)
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
            // Unlock immediately so the next camera in the queue can process
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
        <span className="text-emerald-500 flex items-center">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>Live
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
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [backend, setBackend] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSharedBackend().then((activeBackend) => {
      if (!cancelled) setBackend(activeBackend);
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
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Live Camera Feeds & AI Inference</h3>
            <p className="text-slate-400 text-sm mt-1">Real-time edge processing running TensorFlow.js COCO-SSD (Round-Robin Optimized).</p>
          </div>
          <div className={`px-3 py-2 rounded-lg flex items-center mt-4 md:mt-0 border ${
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
                  ? `Shared Model Active${backend ? ` (${backend.toUpperCase()})` : ''}`
                  : 'Loading Model...'}
            </span>
          </div>
        </div>

        {loadError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-6 text-sm text-rose-300">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CameraNode 
            cameraId={1}
            videoSrc="/datasets/archive/cam1.mp4" 
            title="Cam 1: /datasets/archive" 
            titleColor="text-cyan-400" 
            model={model}
            loadError={loadError}
          />
          <CameraNode 
            cameraId={2}
            videoSrc="/datasets/archive_1/cam1.mp4" 
            title="Cam 2: /datasets/archive_1" 
            titleColor="text-purple-400" 
            model={model}
            loadError={loadError}
          />
          <CameraNode 
            cameraId={3}
            videoSrc="/datasets/archive_2_products/cam1.mp4" 
            title="Cam 3: /datasets/archive_2_products" 
            titleColor="text-emerald-400" 
            model={model}
            loadError={loadError}
          />
          <CameraNode 
            cameraId={4}
            videoSrc="/datasets/archive_3_shelves/cam1.mp4" 
            title="Cam 4: /datasets/archive_3_shelves" 
            titleColor="text-rose-400" 
            model={model}
            loadError={loadError}
          />
        </div>
      </div>
    </div>
  );
}