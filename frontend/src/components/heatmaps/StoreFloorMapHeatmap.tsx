import React, { useEffect, useRef, useState } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { api } from '../../api/client';
import { Play, Pause, RotateCcw, Flame } from 'lucide-react';

interface HeatmapProps {
  storeId?: string;
  shelfId?: string;
}

export const StoreFloorMapHeatmap: React.FC<HeatmapProps> = ({ storeId = 'STORE-812' }) => {
  const { activeHeatmapLayer, setActiveHeatmapLayer } = useFilterStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [heatmapMatrix, setHeatmapMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Simulated live trajectory path for demo playback
  const trajectoryPoints = [
    { x: 120, y: 80, zone: 'BEVERAGES', event: 'TRACK' },
    { x: 160, y: 140, zone: 'BEVERAGES', event: 'TRACK' },
    { x: 220, y: 180, zone: 'BEVERAGES', event: 'GAZE' },
    { x: 300, y: 220, zone: 'BEVERAGES', event: 'PICKUP' },
    { x: 420, y: 260, zone: 'SNACKS', event: 'TRACK' },
    { x: 580, y: 200, zone: 'SNACKS', event: 'GAZE' },
    { x: 640, y: 160, zone: 'SNACKS', event: 'PICKUP' },
    { x: 700, y: 350, zone: 'PRODUCE', event: 'TRACK' },
    { x: 620, y: 480, zone: 'DAIRY', event: 'TRACK' },
    { x: 550, y: 560, zone: 'DAIRY', event: 'PICKUP' },
    { x: 300, y: 650, zone: 'CHECKOUT', event: 'PURCHASE' }
  ];

  // Helper to generate dynamic KDE matrices for all 4 layers
  const generateKdeMatrixForLayer = (layer: string): number[][] => {
    const rows = 40;
    const cols = 60;
    const matrix: number[][] = [];

    // Seed points for different layer hotspots
    let centers: { r: number; c: number; weight: number }[] = [];

    if (layer === 'TRAFFIC') {
      centers = [
        { r: 8, c: 12, weight: 95 },
        { r: 10, c: 24, weight: 85 },
        { r: 14, c: 42, weight: 90 },
        { r: 32, c: 48, weight: 75 },
        { r: 36, c: 22, weight: 98 }
      ];
    } else if (layer === 'ZONE_DENSITY') {
      centers = [
        { r: 12, c: 15, weight: 100 }, // Beverages
        { r: 12, c: 45, weight: 90 },  // Snacks
        { r: 28, c: 15, weight: 80 },  // Produce
        { r: 28, c: 45, weight: 85 }   // Dairy
      ];
    } else if (layer === 'GAZE_FOCUS') {
      centers = [
        { r: 6, c: 18, weight: 98 },  // Eye-level shelf A1
        { r: 6, c: 50, weight: 92 },  // Eye-level shelf B1
        { r: 26, c: 18, weight: 88 }  // Produce gaze
      ];
    } else if (layer === 'SHELF_HOTSPOT') {
      centers = [
        { r: 15, c: 10, weight: 95 }, // Shelf A1 pickup
        { r: 15, c: 30, weight: 88 }, // Shelf A2 pickup
        { r: 15, c: 52, weight: 94 }  // Shelf B1 pickup
      ];
    }

    for (let r = 0; r < rows; r++) {
      const rowArr: number[] = [];
      for (let c = 0; c < cols; c++) {
        let maxVal = 0;
        for (const center of centers) {
          const distSq = (r - center.r) ** 2 + (c - center.c) ** 2;
          const val = center.weight * Math.exp(-distSq / 18);
          if (val > maxVal) maxVal = val;
        }
        rowArr.push(Math.round(maxVal));
      }
      matrix.push(rowArr);
    }
    return matrix;
  };

  // Fetch or update Gaussian KDE matrix when activeHeatmapLayer changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getStoreHeatmap(storeId, activeHeatmapLayer)
      .then((data) => {
        if (mounted && data && data.matrix && data.matrix.length > 0) {
          setHeatmapMatrix(data.matrix);
        } else if (mounted) {
          setHeatmapMatrix(generateKdeMatrixForLayer(activeHeatmapLayer));
        }
      })
      .catch(() => {
        if (mounted) setHeatmapMatrix(generateKdeMatrixForLayer(activeHeatmapLayer));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [storeId, activeHeatmapLayer]);

  // Trajectory playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackIndex((prev) => (prev + 1) % trajectoryPoints.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Clear background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Floor Plan Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Draw Store Zones
    const zones = [
      { name: 'ZONE-01: BEVERAGES', x: 40, y: 40, w: 320, h: 220, color: 'rgba(99, 102, 241, 0.12)', stroke: '#6366f1' },
      { name: 'ZONE-02: SNACKS', x: 400, y: 40, w: 360, h: 220, color: 'rgba(245, 158, 11, 0.12)', stroke: '#f59e0b' },
      { name: 'ZONE-03: PRODUCE', x: 40, y: 300, w: 320, h: 220, color: 'rgba(16, 185, 129, 0.12)', stroke: '#10b981' },
      { name: 'ZONE-04: DAIRY', x: 400, y: 300, w: 360, h: 220, color: 'rgba(236, 72, 153, 0.12)', stroke: '#ec4899' }
    ];

    zones.forEach(z => {
      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = z.stroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(z.x, z.y, z.w, z.h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px Inter';
      ctx.fillText(z.name, z.x + 12, z.y + 24);
    });

    // 4. Render Gaussian KDE Heatmap Matrix with layer-specific color ramps
    if (heatmapMatrix.length > 0) {
      const rows = heatmapMatrix.length;
      const cols = heatmapMatrix[0].length;
      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = heatmapMatrix[r][c]; // 0 to 100
          if (val > 8) {
            let color = '';
            if (activeHeatmapLayer === 'TRAFFIC') {
              if (val > 65) color = `rgba(239, 68, 68, ${val / 130})`;
              else if (val > 35) color = `rgba(245, 158, 11, ${val / 160})`;
              else color = `rgba(59, 130, 246, ${val / 200})`;
            } else if (activeHeatmapLayer === 'ZONE_DENSITY') {
              if (val > 60) color = `rgba(16, 185, 129, ${val / 120})`;
              else if (val > 30) color = `rgba(99, 102, 241, ${val / 150})`;
              else color = `rgba(139, 92, 246, ${val / 200})`;
            } else if (activeHeatmapLayer === 'GAZE_FOCUS') {
              if (val > 60) color = `rgba(236, 72, 153, ${val / 120})`;
              else if (val > 30) color = `rgba(168, 85, 247, ${val / 150})`;
              else color = `rgba(14, 165, 233, ${val / 200})`;
            } else if (activeHeatmapLayer === 'SHELF_HOTSPOT') {
              if (val > 60) color = `rgba(245, 158, 11, ${val / 120})`;
              else if (val > 30) color = `rgba(234, 179, 8, ${val / 150})`;
              else color = `rgba(249, 115, 22, ${val / 200})`;
            }

            ctx.fillStyle = color;
            ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          }
        }
      }
    }

    // 5. Draw Trajectory Path & Playback Node
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);

    for (let i = 0; i <= playbackIndex; i++) {
      const pt = trajectoryPoints[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Current Shopper Node
    const cur = trajectoryPoints[playbackIndex];
    if (cur) {
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tooltip label
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cur.x + 12, cur.y - 12, 115, 24);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(cur.x + 12, cur.y - 12, 115, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter';
      ctx.fillText(`SES-10021 (${cur.event})`, cur.x + 18, cur.y + 4);
    }

  }, [heatmapMatrix, playbackIndex, activeHeatmapLayer]);

  const layers = [
    { id: 'TRAFFIC', label: 'TRAFFIC' },
    { id: 'ZONE_DENSITY', label: 'ZONE DENSITY' },
    { id: 'GAZE_FOCUS', label: 'GAZE FOCUS' },
    { id: 'SHELF_HOTSPOT', label: 'SHELF HOTSPOT' }
  ];

  return (
    <div className="bi-card overflow-hidden">
      <div className="bi-card-header flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-extrabold text-sm text-white">2D Store Floor Plan & Spatial Heatmap Engine</h3>
            <p className="text-xs text-slate-400 font-medium">Gaussian KDE Density Matrix Overlay: {activeHeatmapLayer.replace('_', ' ')}</p>
          </div>
        </div>

        {/* 4 Heatmap Layer Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#090d16] p-1.5 rounded-xl border border-slate-800">
          {layers.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveHeatmapLayer(l.id as any)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                activeHeatmapLayer === l.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400'
                  : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bi-card-body p-4 relative">
        <div className="relative rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner">
          <canvas ref={canvasRef} width={800} height={560} className="w-full h-auto block cursor-crosshair" />

          {/* Control Bar Overlay - Solid Opaque Box */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#0f172a] px-4 py-3 rounded-xl border-2 border-slate-700 flex items-center justify-between shadow-2xl">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => setPlaybackIndex(0)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="text-xs font-extrabold text-slate-200">
                Live Trajectory Playback: <span className="text-indigo-400">SES-10021</span>
              </div>
            </div>

            {/* Heatmap Density Legend */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-300 font-extrabold">Density Gradient:</span>
              <div className="w-28 h-3 rounded bg-gradient-to-r from-blue-600 via-amber-500 to-rose-600 border border-slate-700"></div>
              <span className="text-[10px] text-slate-300 font-bold">Low $\rightarrow$ High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
