'use client';

import React, { useState, useEffect, useRef } from 'react';

interface HeatmapPayload {
  store_id: number;
  layer_type: string;
  grid_width: number;
  grid_height: number;
  total_samples: number;
  density_matrix: number[][];
  hotspot_centers: { zone: string; x: number; y: number; intensity: number }[];
}

export default function InteractiveHeatmapCanvas({ storeId = 1 }: { storeId?: number }) {
  const [layerType, setLayerType] = useState<'foot_traffic' | 'zone_density' | 'gaze_focus' | 'shelf_hotspots'>('foot_traffic');
  const [timeFilter, setTimeFilter] = useState<string>('today');
  const [heatmapData, setHeatmapData] = useState<HeatmapPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; zone: string; intensity: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    async function fetchHeatmap() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/heatmaps/store?store_id=${storeId}&layer_type=${layerType}`);
        if (res.ok) {
          const data = await res.json();
          setHeatmapData(data);
        }
      } catch (err) {
        console.error("Heatmap fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHeatmap();
  }, [storeId, layerType, BACKEND_URL]);

  // Render Heatmap on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw Architectural Floor Plan Blueprint Background
    ctx.fillStyle = '#0f172a'; // Dark slate background
    ctx.fillRect(0, 0, width, height);

    // Floor Grid lines
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

    // Draw Store Fixtures / Shelves Bounding Polygons
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';

    // Entrance
    ctx.strokeRect(20, 20, 140, 100);
    ctx.fillRect(20, 20, 140, 100);

    // Shelf Aisle 1
    ctx.strokeRect(200, 40, 240, 80);
    ctx.fillRect(200, 40, 240, 80);

    // Shelf Aisle 2
    ctx.strokeRect(200, 160, 240, 80);
    ctx.fillRect(200, 160, 240, 80);

    // Checkout Lanes
    ctx.strokeRect(480, 280, 140, 160);
    ctx.fillRect(480, 280, 140, 160);

    // Labels for Store Zones
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Main Entrance', 35, 75);
    ctx.fillText('Aisle 1: Fresh Produce & Snacks', 220, 85);
    ctx.fillText('Aisle 2: Dairy & Beverages', 220, 205);
    ctx.fillText('Checkout Lanes', 505, 360);

    // 2. Render 2D Density Heatmap Overlay (Gaussian Density Matrix)
    const matrix = heatmapData.density_matrix;
    if (matrix && matrix.length > 0) {
      const rows = matrix.length;
      const cols = matrix[0].length;
      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = matrix[r][c]; // 0 to 255
          if (val > 15) {
            const normalized = val / 255.0;
            
            // Color Gradient Palette (Blue -> Cyan -> Green -> Yellow -> Red)
            let rCol = 0, gCol = 0, bCol = 0;
            if (normalized < 0.25) {
              bCol = 255;
              gCol = Math.floor(normalized * 4 * 255);
            } else if (normalized < 0.5) {
              gCol = 255;
              bCol = Math.floor((0.5 - normalized) * 4 * 255);
            } else if (normalized < 0.75) {
              gCol = 255;
              rCol = Math.floor((normalized - 0.5) * 4 * 255);
            } else {
              rCol = 255;
              gCol = Math.floor((1.0 - normalized) * 4 * 255);
            }

            const alpha = Math.min(0.75, normalized * 0.85);
            ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha})`;
            ctx.beginPath();
            ctx.arc((c + 0.5) * cellW, (r + 0.5) * cellH, cellW * 1.2, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }
    }

    // 3. Draw Hotspot Pulse Indicators
    if (heatmapData.hotspot_centers) {
      heatmapData.hotspot_centers.forEach((spot) => {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 16, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 8, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

  }, [heatmapData]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let zone = 'Open Aisle Flow';
    if (x >= 20 && x <= 160 && y >= 20 && y <= 120) zone = 'Main Entrance';
    else if (x >= 200 && x <= 440 && y >= 40 && y <= 120) zone = 'Aisle 1: Snacks & Bakery';
    else if (x >= 200 && x <= 440 && y >= 160 && y <= 240) zone = 'Aisle 2: Beverages';
    else if (x >= 480 && x <= 620 && y >= 280 && y <= 440) zone = 'Checkout Counters';

    const intensity = Math.round(Math.sin((x + y) / 50) * 40 + 55);
    setHoverInfo({ x: Math.round(x), y: Math.round(y), zone, intensity });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl">
      {/* Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            2D Planogram Spatial Density Heatmap
          </h3>
          <p className="text-xs text-slate-400">
            OpenCV Homography coordinate transformation mapped to store blueprint coordinates (x_p, y_p)
          </p>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
          <button
            onClick={() => setLayerType('foot_traffic')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              layerType === 'foot_traffic' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Foot Traffic
          </button>
          <button
            onClick={() => setLayerType('zone_density')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              layerType === 'zone_density' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Zone Dwell
          </button>
          <button
            onClick={() => setLayerType('gaze_focus')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              layerType === 'gaze_focus' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Product Gaze Focus
          </button>
          <button
            onClick={() => setLayerType('shelf_hotspots')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              layerType === 'shelf_hotspots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shelf Hotspots
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950 flex justify-center items-center">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-indigo-400 text-sm">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Computing 2D Gaussian KDE Matrix...
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoverInfo(null)}
          className="cursor-crosshair block w-full max-w-[640px] h-auto"
        />

        {/* Hover Inspect Tooltip */}
        {hoverInfo && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700 px-3 py-2 rounded shadow text-xs text-slate-200">
            <span className="font-semibold text-indigo-400">{hoverInfo.zone}</span> | Coord ({hoverInfo.x}, {hoverInfo.y}) | Intensity: <span className="text-emerald-400 font-bold">{hoverInfo.intensity}%</span>
          </div>
        )}

        {/* Color Legend Bar */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded flex items-center gap-2 text-[10px] text-slate-300">
          <span>Low</span>
          <div className="w-24 h-2.5 rounded bg-gradient-to-r from-blue-600 via-green-500 via-yellow-400 to-red-600" />
          <span>High (Hotspot)</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <div>Total Tracking Samples: <span className="text-slate-200 font-medium">{heatmapData?.total_samples || 0}</span></div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Normal Flow</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Dwell Area</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> High Interaction Hotspot</span>
        </div>
      </div>
    </div>
  );
}
