import React, { useState, useEffect, useRef } from "react";
import { Flame, Eye, MapPin, Layers, Info } from "lucide-react";

export default function HeatmapViewer({ data, heatmapType, setHeatmapType }) {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = data?.coordinate_points || [];
  const hotZones = data?.hot_zones || [];
  const coldZones = data?.cold_zones || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Floor Plan Background Grid
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 2. Draw Store Zones Boundaries
    const zones = [
      { name: "Entrance", x: 20, y: 20, w: 180, h: 140, color: "rgba(99, 102, 241, 0.15)", border: "#6366f1" },
      { name: "Bakery", x: 230, y: 20, w: 220, h: 140, color: "rgba(236, 72, 153, 0.15)", border: "#ec4899" },
      { name: "Beverages", x: 480, y: 20, w: 280, h: 180, color: "rgba(34, 211, 165, 0.15)", border: "#22d3a5" },
      { name: "Cooking Products", x: 230, y: 190, w: 220, h: 180, color: "rgba(245, 158, 11, 0.15)", border: "#f59e0b" },
      { name: "Billing Counter", x: 480, y: 230, w: 280, h: 140, color: "rgba(56, 189, 248, 0.15)", border: "#38bdf8" },
    ];

    zones.forEach((z) => {
      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = z.border;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(z.x, z.y, z.w, z.h);
      ctx.setLineDash([]);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(z.name.toUpperCase(), z.x + 8, z.y + 18);
    });

    // 3. Draw Heatmap Intensity Gradient Circles
    points.forEach((pt) => {
      const px = Math.min(canvas.width - 20, Math.max(20, pt.x));
      const py = Math.min(canvas.height - 20, Math.max(20, pt.y));
      const intensity = pt.intensity || 0.5;

      const radius = 25 + intensity * 15;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);

      if (intensity > 0.7) {
        grad.addColorStop(0, "rgba(239, 68, 68, 0.8)");
        grad.addColorStop(0.5, "rgba(245, 158, 11, 0.5)");
        grad.addColorStop(1, "rgba(239, 68, 68, 0)");
      } else if (intensity > 0.4) {
        grad.addColorStop(0, "rgba(245, 158, 11, 0.7)");
        grad.addColorStop(0.5, "rgba(34, 211, 165, 0.4)");
        grad.addColorStop(1, "rgba(245, 158, 11, 0)");
      } else {
        grad.addColorStop(0, "rgba(56, 189, 248, 0.6)");
        grad.addColorStop(0.5, "rgba(99, 102, 241, 0.3)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Center point
      ctx.fillStyle = intensity > 0.6 ? "#ef4444" : "#38bdf8";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, heatmapType]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    const match = points.find(
      (pt) => Math.hypot(pt.x - mx, pt.y - my) < 25
    );
    setHoveredPoint(match || null);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
      {/* Heatmap Header & Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" /> Interactive Coordinate Heatmap Engine
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time movement and focus density calculated from YOLOv8 tracking coordinates.
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "traffic", label: "Store Traffic", icon: <Layers className="w-3 h-3" /> },
            { key: "shelf", label: "Shelf Engagement", icon: <MapPin className="w-3 h-3" /> },
            { key: "product_attention", label: "Product Focus", icon: <Eye className="w-3 h-3" /> },
            { key: "hotspots", label: "Hotspot Analysis", icon: <Flame className="w-3 h-3" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setHeatmapType(tab.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                heatmapType === tab.key
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Canvas Container */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center items-center p-2">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="w-full h-auto max-h-[420px] rounded-lg cursor-crosshair"
        />

        {/* Hovered Point Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700 text-white px-3.5 py-2 rounded-xl text-xs shadow-2xl backdrop-blur-md space-y-0.5 pointer-events-none">
            <div className="font-bold text-cyan-400">📍 {hoveredPoint.zone}</div>
            <div className="text-[11px] text-slate-300">
              Shelf: <span className="font-semibold text-white">{hoveredPoint.shelf || "N/A"}</span>
            </div>
            <div className="text-[10px] text-amber-400 font-mono">
              Intensity: {(hoveredPoint.intensity * 100).toFixed(0)}% • Coordinates ({hoveredPoint.x}, {hoveredPoint.y})
            </div>
          </div>
        )}
      </div>

      {/* Hotspots & Legend Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="font-bold text-rose-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> High Engagement Hot Zones
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hotZones.map((z, idx) => (
              <span key={idx} className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {z.zone} ({(z.intensity_score * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Low Attention Cold Spots
          </div>
          <div className="flex flex-wrap gap-1.5">
            {coldZones.map((z, idx) => (
              <span key={idx} className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {z.zone} ({(z.intensity_score * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
          <div className="font-bold text-slate-300">Density Scale</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Low (Cool)</span>
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-rose-500" />
            <span>High (Hot)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
