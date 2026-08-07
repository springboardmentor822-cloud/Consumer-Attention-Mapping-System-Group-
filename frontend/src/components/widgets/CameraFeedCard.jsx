import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Maximize2, ShieldCheck, AlertTriangle, Eye, Video } from 'lucide-react';

export default function CameraFeedCard({ camera }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Simulated detection targets moving across camera grid
    const targets = Array.from({ length: Math.min(camera.count || 6, 8) }, (_, i) => ({
      x: 30 + Math.random() * (canvas.width - 80),
      y: 30 + Math.random() * (canvas.height - 80),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      id: `P-${100 + i}`,
      dwell: Math.floor(Math.random() * 45) + 5,
    }));

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid overlay lines
      ctx.strokeStyle = '#1e293b';
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

      // Draw Zone label background
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.fillRect(10, 10, 140, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(`ZONE: ${camera.zone || 'General'}`, 18, 26);

      // Update and draw targets
      if (isPlaying) {
        targets.forEach((t) => {
          t.x += t.vx;
          t.y += t.vy;
          if (t.x < 20 || t.x > canvas.width - 40) t.vx *= -1;
          if (t.y < 30 || t.y > canvas.height - 40) t.vy *= -1;

          // Draw bounding box
          ctx.strokeStyle = camera.crowd === 'High' ? '#ef4444' : '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(t.x, t.y, 32, 48);

          // Bounding Box Label
          ctx.fillStyle = camera.crowd === 'High' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)';
          ctx.fillRect(t.x, t.y - 14, 32, 14);
          ctx.fillStyle = '#ffffff';
          ctx.font = '9px sans-serif';
          ctx.fillText(t.id, t.x + 2, t.y - 3);

          // Dwell indicator
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(t.x, t.y + 50, (t.dwell / 50) * 32, 3);
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [camera, isPlaying]);

  const crowdBadge = camera.crowd === 'High'
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    : camera.crowd === 'Medium'
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg backdrop-blur-md transition-all hover:border-slate-700">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="font-semibold text-sm text-white">{camera.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${crowdBadge}`}>
            {camera.crowd} Crowd
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {camera.health}
          </span>
        </div>
      </div>

      {/* Video Simulation Canvas */}
      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        <canvas ref={canvasRef} width={360} height={200} className="w-full h-48 object-cover" />

        {/* Live HUD Overlay */}
        <div className="absolute top-2 left-2 flex items-center gap-2 rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
          <Video className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider">LIVE STREAM</span>
        </div>

        <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded bg-black/60 px-2.5 py-1 text-[11px] text-slate-300 backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-indigo-400" /> Count: <strong className="text-white">{camera.count}</strong>
          </span>
          <span>Activity: <strong className="text-emerald-400">{camera.activity}%</strong></span>
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Toggle Stream Simulation"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
