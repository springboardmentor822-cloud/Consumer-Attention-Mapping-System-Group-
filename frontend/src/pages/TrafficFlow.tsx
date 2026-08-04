import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PageProps {
  storeId: string;
  token: string | null;
}

interface HeatPoint {
  x: number;
  y: number;
  val: number;
  timestamp: number;
}

export default function TrafficFlow({ storeId, token }: PageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);
  const pointsRef = useRef<HeatPoint[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/api/ws/${storeId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "COORDINATES") {
          const { x, y } = payload;
          pointsRef.current.push({ x, y, val: 1.2, timestamp: Date.now() });
          if (pointsRef.current.length > 500) pointsRef.current.shift();
          draw();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const interval = setInterval(() => {
      const cutoff = Date.now() - 30000;
      pointsRef.current = pointsRef.current.filter(p => p.timestamp > cutoff);
      draw();
    }, 1000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [storeId]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e1e2f';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 30) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 30) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    pointsRef.current.forEach((pt) => {
      const age = Date.now() - pt.timestamp;
      const decay = Math.max(0.1, 1 - age / 30000);
      const radius = 28;
      const gradient = ctx.createRadialGradient(pt.x * 0.5, pt.y * 0.5, 2, pt.x * 0.5, pt.y * 0.5, radius);
      gradient.addColorStop(0, `rgba(244, 63, 94, ${0.65 * decay})`);
      gradient.addColorStop(0.5, `rgba(234, 179, 8, ${0.25 * decay})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pt.x * 0.5, pt.y * 0.5, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  useEffect(() => {
    draw();
  }, []);

  return (
    <div className="space-y-6 text-slate-100 max-w-4xl mx-auto">
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Traffic Flow Heatmap</span>
        <div className="relative border border-slate-900 rounded overflow-hidden aspect-[4/3] w-full bg-black">
          <canvas ref={canvasRef} width={640} height={480} className="w-full h-full block" />
          <div className="absolute top-4 left-4 flex flex-col space-y-1.5 text-xs bg-black/70 p-3 rounded-lg text-slate-400">
            <span>● Electronics Department</span>
            <span>● Apparel Department</span>
            <span>● Home & Living</span>
            <span>● Personal Care Aisle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
