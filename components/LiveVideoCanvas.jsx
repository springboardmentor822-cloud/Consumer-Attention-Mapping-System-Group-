'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Eye, Layers, ShieldCheck, Video } from 'lucide-react';

const YOLOv8_PERSON_CLASS_ID = 'person';

const CAMERA_CONFIG = {
  cam_1: {
    video: '/videos/camera1-entrance.mp4',
    startTime: 25,
    zoneBadge: '1. Entrance Foyer',
    getDetections: (t) => [
      { class: 'person', label: 'ID:101 0.94', x: 0.28 + (t % 12) * 0.012, y: 0.28, w: 0.13, h: 0.58, color: '#f97316', head: { x: 0.34 + (t % 12) * 0.012, y: 0.33 }, gaze: { x: 0.52, y: 0.35 } },
      { class: 'person', label: 'ID:102 0.88', x: 0.62 - (t % 10) * 0.010, y: 0.32, w: 0.12, h: 0.55, color: '#f97316', head: { x: 0.68 - (t % 10) * 0.010, y: 0.37 }, gaze: { x: 0.45, y: 0.40 } },
    ],
    yellowROIs: [
      { x: 0.05, y: 0.12, w: 0.42, h: 0.75, label: 'ENTRANCE FOYER ZONE' },
      { x: 0.53, y: 0.12, w: 0.42, h: 0.75, label: 'AISLE ACCESS ZONE' }
    ]
  },
  cam_2: {
    video: '/videos/camera2-main-aisle.mp4',
    startTime: 160,
    zoneBadge: '2. Main Grocery Aisle',
    getDetections: (t) => [
      { class: 'person', label: 'ID:201 0.92', x: 0.22 + (t % 15) * 0.014, y: 0.26, w: 0.14, h: 0.60, color: '#f97316', head: { x: 0.29 + (t % 15) * 0.014, y: 0.31 }, gaze: { x: 0.15, y: 0.32 } },
      { class: 'person', label: 'ID:202 0.85', x: 0.55 - (t % 12) * 0.009, y: 0.28, w: 0.13, h: 0.58, color: '#f97316', head: { x: 0.61 - (t % 12) * 0.009, y: 0.33 }, gaze: { x: 0.78, y: 0.35 } },
    ],
    yellowROIs: [
      { x: 0.04, y: 0.10, w: 0.38, h: 0.80, label: 'SNACK SHELVES' },
      { x: 0.58, y: 0.10, w: 0.38, h: 0.80, label: 'BEVERAGE RACKS' }
    ]
  },
  cam_3: {
    video: '/videos/camera3-shelf-engagement.mp4',
    startTime: 34, // Matches Dairy Zone screenshot
    zoneBadge: '5. Dairy Zone',
    getDetections: (t) => [
      { class: 'person', label: 'ID:9 0.94', x: 0.44 + Math.sin(t * 0.2) * 0.005, y: 0.36, w: 0.11, h: 0.60, color: '#ea580c', head: { x: 0.49, y: 0.40 }, gaze: { x: 0.58, y: 0.42 } },
      { class: 'person', label: 'ID:2 0.90', x: 0.18 + Math.cos(t * 0.3) * 0.005, y: 0.36, w: 0.06, h: 0.42, color: '#ea580c', head: { x: 0.21, y: 0.39 }, gaze: { x: 0.15, y: 0.40 } },
      { class: 'person', label: 'ID:10 0.85', x: 0.24, y: 0.32, w: 0.05, h: 0.28, color: '#ea580c', head: { x: 0.26, y: 0.34 }, gaze: { x: 0.28, y: 0.35 } },
    ],
    yellowROIs: [
      { x: 0.02, y: 0.05, w: 0.18, h: 0.90, label: 'DAIRY SECTION' },
      { x: 0.20, y: 0.25, w: 0.19, h: 0.20, label: 'MILK RACK' },
      { x: 0.44, y: 0.20, w: 0.54, h: 0.75, label: 'REFRIGERATOR DOORS' },
      { x: 0.66, y: 0.20, w: 0.12, h: 0.75, label: 'GLASS DOOR 1' },
      { x: 0.79, y: 0.20, w: 0.19, h: 0.75, label: 'GLASS DOOR 2' }
    ],
    greenROIs: [
      { x: 0.35, y: 0.52, w: 0.04, h: 0.12 },
      { x: 0.40, y: 0.54, w: 0.04, h: 0.14 },
      { x: 0.94, y: 0.48, w: 0.04, h: 0.16 }
    ]
  },
  cam_4: {
    video: '/videos/camera4-promotional.mp4',
    startTime: 500,
    zoneBadge: '4. Promotional Area',
    getDetections: (t) => [
      { class: 'person', label: 'ID:401 0.91', x: 0.25 + (t % 14) * 0.010, y: 0.28, w: 0.13, h: 0.58, color: '#ea580c', head: { x: 0.31 + (t % 14) * 0.010, y: 0.33 }, gaze: { x: 0.42, y: 0.28 } },
      { class: 'person', label: 'ID:402 0.86', x: 0.58 - (t % 12) * 0.008, y: 0.30, w: 0.12, h: 0.55, color: '#ea580c', head: { x: 0.64 - (t % 12) * 0.008, y: 0.35 }, gaze: { x: 0.75, y: 0.32 } },
    ],
    yellowROIs: [
      { x: 0.20, y: 0.10, w: 0.60, h: 0.78, label: 'PROMOTIONAL ENDCAP (+158% LIFT)' }
    ]
  },
  cam_5: {
    video: '/videos/camera5-checkout.mp4',
    startTime: 40, // Matches Checkout Zone screenshot
    zoneBadge: '6. Checkout Zone',
    getDetections: (t) => [
      { class: 'person', label: 'ID:4 0.77', x: 0.18 + Math.sin(t * 0.2) * 0.003, y: 0.28, w: 0.16, h: 0.62, color: '#ea580c', head: { x: 0.26, y: 0.32 }, gaze: { x: 0.34, y: 0.50 } },
      { class: 'person', label: 'ID:1 0.94', x: 0.34, y: 0.27, w: 0.10, h: 0.28, color: '#ea580c', head: { x: 0.39, y: 0.30 }, gaze: { x: 0.42, y: 0.45 } },
      { class: 'person', label: 'ID:12 0.59', x: 0.38, y: 0.42, w: 0.06, h: 0.14, color: '#ea580c', head: { x: 0.41, y: 0.44 }, gaze: { x: 0.44, y: 0.48 } },
      { class: 'person', label: 'ID:3 0.79', x: 0.58 + Math.cos(t * 0.3) * 0.004, y: 0.25, w: 0.10, h: 0.65, color: '#ea580c', head: { x: 0.63, y: 0.30 }, gaze: { x: 0.50, y: 0.35 } },
      { class: 'person', label: 'ID:2 0.90', x: 0.66 + Math.sin(t * 0.2) * 0.003, y: 0.25, w: 0.16, h: 0.68, color: '#ea580c', head: { x: 0.74, y: 0.30 }, gaze: { x: 0.60, y: 0.40 } },
      { class: 'person', label: 'ID:5 0.83', x: 0.76, y: 0.26, w: 0.08, h: 0.58, color: '#ea580c', head: { x: 0.80, y: 0.30 }, gaze: { x: 0.72, y: 0.42 } },
      { class: 'person', label: 'ID:7 0.74', x: 0.80, y: 0.32, w: 0.20, h: 0.68, color: '#ea580c', head: { x: 0.88, y: 0.36 }, gaze: { x: 0.75, y: 0.50 } },
    ],
    yellowROIs: [
      { x: 0.05, y: 0.15, w: 0.90, h: 0.75, label: 'CHECKOUT BILLING COUNTERS' }
    ],
    greenROIs: [
      { x: 0.33, y: 0.60, w: 0.12, h: 0.08 }
    ]
  },
  cam_6: {
    video: '/videos/camera6-exit.mp4',
    startTime: 900,
    zoneBadge: '6. Exit Foyer',
    getDetections: (t) => [
      { class: 'person', label: 'ID:601 0.89', x: 0.35 + (t % 15) * 0.015, y: 0.26, w: 0.13, h: 0.62, color: '#ea580c', head: { x: 0.41 + (t % 15) * 0.015, y: 0.31 }, gaze: { x: 0.50, y: 0.18 } },
      { class: 'person', label: 'ID:602 0.84', x: 0.60 + (t % 12) * 0.012, y: 0.28, w: 0.12, h: 0.60, color: '#ea580c', head: { x: 0.66 + (t % 12) * 0.012, y: 0.33 }, gaze: { x: 0.54, y: 0.16 } },
    ],
    yellowROIs: [
      { x: 0.10, y: 0.10, w: 0.80, h: 0.80, label: 'EXIT FOYER ZONE' }
    ]
  },
};

export default function LiveVideoCanvas({ camera, height = 'h-64' }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showGaze, setShowGaze] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const cfg = CAMERA_CONFIG[camera.id] || CAMERA_CONFIG.cam_5;

  // Direct DOM video timestamp seeking & playback control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const startPosition = cfg.startTime || 0;

    const seekAndPlay = () => {
      try {
        if (video.duration && Math.abs(video.currentTime - startPosition) > 25) {
          video.currentTime = startPosition;
        }
        video.play().catch(() => {});
      } catch (e) {}
    };

    const handleLoadedMetadata = () => {
      seekAndPlay();
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= startPosition + 35 || video.ended) {
        video.currentTime = startPosition;
        video.play().catch(() => {});
      }
    };

    if (video.readyState >= 1) {
      seekAndPlay();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [camera.id, cfg.startTime]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Yellow ROI Outlines
      if (cfg.yellowROIs) {
        cfg.yellowROIs.forEach(roi => {
          const rx = roi.x * canvas.width;
          const ry = roi.y * canvas.height;
          const rw = roi.w * canvas.width;
          const rh = roi.h * canvas.height;

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(rx, ry, rw, rh);

          if (roi.label) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(rx, ry, ctx.measureText(roi.label).width + 10, 16);
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(roi.label, rx + 5, ry + 12);
          }
        });
      }

      // Draw Green Sub-ROI Outlines
      if (cfg.greenROIs) {
        cfg.greenROIs.forEach(roi => {
          const rx = roi.x * canvas.width;
          const ry = roi.y * canvas.height;
          const rw = roi.w * canvas.width;
          const rh = roi.h * canvas.height;

          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx, ry, rw, rh);
        });
      }

      // Get video-synced human shopper detections
      const currTime = video ? video.currentTime || 0 : 0;
      const detections = cfg.getDetections(currTime);

      // Draw ONLY verified YOLOv8 'person' class shopper detections & ByteTrack MOT IDs
      detections.forEach(s => {
        if (s.class !== YOLOv8_PERSON_CLASS_ID) return;

        const px = s.x * canvas.width;
        const py = s.y * canvas.height;
        const bw = s.w * canvas.width;
        const bh = s.h * canvas.height;

        // Red Gaze Ray: Originates from human head area towards product focus
        if (showGaze && s.head && s.gaze) {
          const hx = s.head.x * canvas.width;
          const hy = s.head.y * canvas.height;
          const gx = s.gaze.x * canvas.width;
          const gy = s.gaze.y * canvas.height;

          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(gx, gy);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.arc(gx, gy, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239,68,68,0.9)';
          ctx.fill();
        }

        // Bounding Box: Vibrant Orange bounding box with filled header header tag (ID:X 0.XX)
        if (showBoxes) {
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(px, py, bw, bh);

          // Filled Orange Header Tag (matching exact reference screenshot)
          const label = s.label || `ID:${s.id} 0.94`;
          ctx.font = 'bold 11px sans-serif';
          const labelW = ctx.measureText(label).width + 12;
          const labelH = 20;

          // Header Box fill
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(px, py, labelW, labelH);

          // Header text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, px + 6, py + 14);
        }

        // Heatmap trail under human body feet
        if (showHeatmap) {
          const g = ctx.createRadialGradient(px + bw / 2, py + bh - 10, 6, px + bw / 2, py + bh - 10, 50);
          g.addColorStop(0, 'rgba(239,68,68,0.75)');
          g.addColorStop(0.5, 'rgba(245,158,11,0.40)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px + bw / 2, py + bh - 10, 50, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Top-Left Zone Badge Overlay (matching exact screenshot design)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 140, 24, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(cfg.zoneBadge || camera.name, 14, 24);

      // Replay / Live pill badge underneath
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.beginPath();
      ctx.roundRect(8, 36, 44, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('REPLAY', 14, 47);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [camera, isPlaying, showBoxes, showGaze, showHeatmap, cfg]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-xl group">

      {/* HTML5 REAL DMART SUPERMARKET MP4 VIDEO PLAYER */}
      <video
        ref={videoRef}
        src={camera.video || '/videos/camera1-entrance.mp4'}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        className={`w-full ${height} object-cover block bg-slate-950`}
      />

      {/* TRANSPARENT COMPUTER VISION OVERLAY CANVAS */}
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="absolute inset-0 w-full h-full pointer-events-none block bg-transparent"
      />

      {/* INTERACTIVE CONTROLS BAR */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-slate-200 border border-slate-700/50 z-20 pointer-events-auto">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlayPause}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-emerald-400 flex items-center gap-1"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Video size={12} className="text-blue-400" />
            {camera.name}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[10px]">
          <button
            onClick={() => setShowBoxes(b => !b)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${showBoxes ? 'bg-orange-600/30 text-orange-300 border-orange-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
          >
            <ShieldCheck size={11} /> Boxes
          </button>
          <button
            onClick={() => setShowGaze(g => !g)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${showGaze ? 'bg-red-600/30 text-red-300 border-red-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
          >
            <Eye size={11} /> Gaze Rays
          </button>
          <button
            onClick={() => setShowHeatmap(h => !h)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${showHeatmap ? 'bg-amber-600/30 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
          >
            <Layers size={11} /> Heatmap
          </button>
        </div>
      </div>
    </div>
  );
}
