import React, { useEffect, useRef, useState } from "react";
import { Layers, Eye, TrendingUp, Sparkles, MapPin } from "lucide-react";
import { heatmapAPI } from "@/lib/api";

interface HeatmapCanvasProps {
  storeId?: number;
}

export const HeatmapCanvas: React.FC<HeatmapCanvasProps> = ({ storeId = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeLayer, setActiveLayer] = useState<"store_traffic" | "zone_activity" | "product_gaze" | "shelf_hotspots">("store_traffic");
  const [gridData, setGridData] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    heatmapAPI.getStoreHeatmap(storeId)
      .then((res) => {
        if (!isMounted) return;
        const layers = res.data?.layers;
        if (layers && layers[activeLayer]) {
          setGridData(layers[activeLayer]);
        }
      })
      .catch(() => {
        // Fallback grid generation if offline
        const sampleGrid: number[][] = [];
        for (let r = 0; r < 30; r++) {
          const row: number[] = [];
          for (let c = 0; c < 30; c++) {
            const dist = Math.sqrt((r - 15) ** 2 + (c - 15) ** 2);
            row.push(Math.max(0, 1 - dist / 15));
          }
          sampleGrid.push(row);
        }
        if (isMounted) setGridData(sampleGrid);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [storeId, activeLayer]);

  // Render heatmap on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gridData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const rows = gridData.length;
    const cols = gridData[0].length;

    ctx.clearRect(0, 0, width, height);

    // Draw dark planogram background
    ctx.fillStyle = "#0c1524";
    ctx.fillRect(0, 0, width, height);

    // Draw store grid guidelines
    ctx.strokeStyle = "#1e293b";
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

    // Render Gaussian KDE Density Cell Overlays
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = gridData[r][c];
        if (val > 0.05) {
          // Color map: low=blue, mid=yellow, high=red
          const alpha = Math.min(0.85, val * 0.8 + 0.1);
          let color = `rgba(59, 130, 246, ${alpha})`; // Blue
          if (val > 0.6) {
            color = `rgba(239, 68, 68, ${alpha})`; // Red
          } else if (val > 0.3) {
            color = `rgba(234, 179, 8, ${alpha})`; // Yellow
          }

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, cellW * (val + 0.5), 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Overlay Shelf Outlines
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 180, 100);
    ctx.fillStyle = "#00f0ff";
    ctx.font = "11px monospace";
    ctx.fillText("Shelf A (Beverages)", 45, 32);

    ctx.strokeStyle = "#a855f7";
    ctx.strokeRect(300, 40, 180, 100);
    ctx.fillStyle = "#a855f7";
    ctx.fillText("Shelf B (Snacks)", 305, 32);

    ctx.strokeStyle = "#f59e0b";
    ctx.strokeRect(100, 220, 380, 80);
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("Checkout Lanes Counter", 105, 212);

  }, [gridData]);

  return (
    <div className="bg-[#0b1422] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Controls Layer Header */}
      <div className="bg-[#080d16] p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-bold">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Homography 2D Heatmap Visualizer (Gaussian KDE)</span>
        </div>

        {/* Layer Selector Buttons */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => setActiveLayer("store_traffic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeLayer === "store_traffic"
                ? "bg-cyan-600 text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Store Traffic</span>
          </button>

          <button
            onClick={() => setActiveLayer("zone_activity")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeLayer === "zone_activity"
                ? "bg-purple-600 text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Zone Activity</span>
          </button>

          <button
            onClick={() => setActiveLayer("product_gaze")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeLayer === "product_gaze"
                ? "bg-indigo-600 text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Gaze Focus</span>
          </button>

          <button
            onClick={() => setActiveLayer("shelf_hotspots")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeLayer === "shelf_hotspots"
                ? "bg-amber-600 text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shelf Hotspots</span>
          </button>
        </div>
      </div>

      {/* Interactive HTML5 Canvas */}
      <div className="relative flex justify-center p-4 bg-[#070e17]">
        {loading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-cyan-400">
            Calculating Homography & Gaussian KDE...
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={560}
          height={320}
          className="w-full max-w-[560px] h-[320px] rounded-lg border border-slate-800 shadow-inner"
        />
      </div>
    </div>
  );
};

export default HeatmapCanvas;
