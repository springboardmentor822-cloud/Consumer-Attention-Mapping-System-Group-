import React, { useEffect, useRef, useState } from 'react';
import { Flame, Layers, MapPin, Eye } from 'lucide-react';

export default function HeatmapCanvas({ title = 'Store Attention Heatmap', type = 'traffic' }) {
  const canvasRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('all');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    // Clear background - Dark BI Blueprint layout
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Draw Floor Plan Blueprint Layout Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Internal zones (Entrance, Aisle 1, Aisle 2, Shelf Areas, Checkout)
    ctx.strokeRect(40, 40, 100, 70); // Entrance
    ctx.strokeRect(160, 40, 140, 110); // Electronics Zone
    ctx.strokeRect(320, 40, 140, 110); // Apparel Zone
    ctx.strokeRect(40, 140, 100, 100); // Customer Lounge / Cafe
    ctx.strokeRect(160, 170, 300, 70); // Checkout & Service Counters

    // Zone Text Labels
    ctx.fillStyle = '#475569';
    ctx.font = '10px sans-serif';
    ctx.fillText('ENTRANCE', 50, 75);
    ctx.fillText('ELECTRONICS AISLE', 175, 95);
    ctx.fillText('APPAREL & FOOTWEAR', 330, 95);
    ctx.fillText('CAFE / LOUNGE', 50, 190);
    ctx.fillText('CHECKOUT COUNTERS', 240, 210);

    // Heat points generation based on type
    const heatPoints = [
      { x: 230, y: 85, radius: 45, intensity: 0.9, label: 'High Attention (Shelf A)' },
      { x: 380, y: 85, radius: 40, intensity: 0.85, label: 'High Dwell (Apparel)' },
      { x: 90, y: 75, radius: 35, intensity: 0.7, label: 'Entry Flow' },
      { x: 310, y: 200, radius: 50, intensity: 0.95, label: 'Checkout Queue' },
      { x: 80, y: 190, radius: 25, intensity: 0.3, label: 'Low Traffic' },
    ];

    // Render Radial Heat Gradients
    heatPoints.forEach((point) => {
      const gradient = ctx.createRadialGradient(point.x, point.y, 5, point.x, point.y, point.radius);

      if (point.intensity > 0.8) {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.75)'); // Red hotspot
        gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)'); // Yellow/orange mid
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (point.intensity > 0.5) {
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.7)'); // Amber mid
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.35)'); // Blue mid
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Blue low
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [type, activeLayer]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-rose-500" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <div className="flex gap-1.5 rounded-lg border border-slate-800 bg-slate-950 p-1">
          {['all', 'high', 'zones'].map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                activeLayer === layer
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        <canvas ref={canvasRef} width={500} height={260} className="w-full h-64 object-cover" />

        {/* Legend */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded border border-slate-800 bg-black/80 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[10px] text-slate-400">Intensity:</span>
          <div className="flex h-2 w-24 rounded bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500" />
          <span className="text-[10px] text-slate-400">Low → High</span>
        </div>
      </div>
    </div>
  );
}
