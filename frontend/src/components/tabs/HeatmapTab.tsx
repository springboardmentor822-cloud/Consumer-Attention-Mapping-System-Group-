"use client";
import React, { useEffect, useRef, useState } from 'react';

interface HeatPoint { x: number; y: number; weight: number; }
interface ZoneItem { id: string; label: string; x: number; y: number; w: number; h: number; cameraAssigned: number; }

export default function HeatmapTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [dynamicZones, setDynamicZones] = useState<ZoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'traffic' | 'shelf' | 'attention'>('traffic');

  // STEP 1: Fetch the global planogram Layout
  useEffect(() => {
    fetch('http://127.0.0.1:9000/api/v1/layout')
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setDynamicZones(data.data);
        }
      })
      .catch(err => console.error("Layout fetch error:", err));
  }, []);

  // STEP 2: Fetch the telemetry points
  useEffect(() => {
    let isMounted = true;
    const fetchHeatmap = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:9000/api/v1/dashboard/heatmap?layer=${activeLayer}&time_filter=${timeFilter}`);
        const data = await res.json();
        if (isMounted && data.status === "success") {
          setPoints(data.data);
        }
      } catch (err) {
        console.error("Heatmap fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 2000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [activeLayer, timeFilter]);

  // STEP 3: Render the synchronized canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
      
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'; 
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';

      // Draw the dynamically synced zones from the database
      dynamicZones.forEach((zone) => {
        const hasCameraCoverage = zone.cameraAssigned > 0;
        ctx.strokeStyle = hasCameraCoverage ? 'rgba(16, 185, 129, 0.25)' : 'rgba(148, 163, 184, 0.15)';
        ctx.strokeRect(w * zone.x, h * zone.y, w * zone.w, h * zone.h);
        ctx.fillStyle = hasCameraCoverage ? 'rgba(52, 211, 153, 0.6)' : 'rgba(148, 163, 184, 0.4)';
        ctx.fillText(zone.label, w * (zone.x + zone.w / 2), h * (zone.y + zone.h / 2));
      });
      ctx.setLineDash([]); 

      points.forEach(p => {
        const px = p.x * w;
        const py = p.y * h;
        
        let baseRadius = w * 0.1;
        if (activeLayer === 'shelf') baseRadius = w * 0.08;
        if (activeLayer === 'attention') baseRadius = w * 0.04;

        const radius = (p.weight / 100) * baseRadius; 
        const opacity = Math.min((p.weight / 100) * 0.7, 0.9);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        
        if (activeLayer === 'attention') {
          grad.addColorStop(0, `rgba(217, 70, 239, ${opacity})`);
          grad.addColorStop(0.5, `rgba(168, 85, 247, ${opacity * 0.5})`);
        } else if (activeLayer === 'shelf') {
          grad.addColorStop(0, `rgba(239, 68, 68, ${opacity})`);
          grad.addColorStop(0.5, `rgba(245, 158, 11, ${opacity * 0.5})`);
        } else {
          grad.addColorStop(0, `rgba(14, 165, 233, ${opacity})`);
          grad.addColorStop(0.5, `rgba(56, 189, 248, ${opacity * 0.5})`);
        }
        
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [points, activeLayer, dynamicZones]); // Added dynamicZones dependency

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200 h-[calc(100vh-120px)] flex flex-col">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
        <div>
          <h2 className="text-xl font-bold">Spatial Density Heatmaps</h2>
          <p className="text-xs text-slate-400 mt-1">Automatically synced with the global Store Layout Studio planogram.</p>
        </div>
        
        <div className="flex space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button onClick={() => setActiveLayer('traffic')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeLayer === 'traffic' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Store Traffic</button>
          <button onClick={() => setActiveLayer('shelf')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeLayer === 'shelf' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Shelf Engagement</button>
          <button onClick={() => setActiveLayer('attention')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeLayer === 'attention' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Product Attention</button>
        </div>
      </div>

      <div className="flex-1 bg-[#0a0f1c] border border-slate-800 rounded-xl relative overflow-hidden shadow-inner blueprint-bg">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        {loading && points.length === 0 && <div className="absolute inset-0 flex items-center justify-center z-20"><span className="text-cyan-400 animate-pulse font-mono text-sm">Rendering spatial coordinates...</span></div>}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 mix-blend-screen" />
        <div className="absolute bottom-6 right-6 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-4 rounded-lg z-20 shadow-xl">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Intensity Scale</h4>
          <div className="w-48 h-2 rounded-full bg-gradient-to-r from-transparent via-cyan-500 to-rose-500 mb-2"></div>
          <div className="flex justify-between text-[9px] text-slate-500 font-mono"><span>Low</span><span>High Density</span></div>
        </div>
      </div>
    </div>
  );
}