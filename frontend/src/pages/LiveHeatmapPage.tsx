import React, { useState, useEffect, useRef } from 'react';
import { Flame, RefreshCw } from 'lucide-react';

interface ActiveDot {
  id: string;
  x: number;
  y: number;
  gaze: string | null;
  age: number;
}

interface HeatPoint {
  x: number;
  y: number;
  val: number;
}

interface LiveHeatmapPageProps {
  storeId: string;
  token: string | null;
}

export default function LiveHeatmapPage({ storeId, token }: LiveHeatmapPageProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDots, setActiveDots] = useState<ActiveDot[]>([]);
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const heatPoints = useRef<HeatPoint[]>([]);

  const fetchDetections = async () => {
    setLoading(false);
  };

  useEffect(() => {
    fetchDetections();

    const ws = new WebSocket(`ws://localhost:8000/api/ws/${storeId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "COORDINATES") {
          const { shopper_id, x, y, gaze_facing_shelf_id } = payload;
          
          setActiveDots(prev => {
            const list = prev.filter(dot => dot.id !== shopper_id);
            list.push({ id: shopper_id, x, y, gaze: gaze_facing_shelf_id, age: Date.now() });
            return list;
          });

          heatPoints.current.push({ x, y, val: 1 });
          if (heatPoints.current.length > 500) {
            heatPoints.current.shift();
          }
        }
      } catch (err) {
        console.error("WS error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [storeId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDots(prev => prev.filter(dot => Date.now() - dot.age < 5000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const drawFloorLayout = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1d1d2c';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.fillRect(30, 40, 240, 180);
    ctx.strokeRect(30, 40, 240, 180);

    ctx.fillStyle = 'rgba(79, 70, 229, 0.08)';
    ctx.strokeStyle = '#4f46e5';
    ctx.fillRect(310, 40, 290, 180);
    ctx.strokeRect(310, 40, 290, 180);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.strokeStyle = '#ef4444';
    ctx.fillRect(30, 260, 570, 170);
    ctx.strokeRect(30, 260, 570, 170);
  };

  useEffect(() => {
    const draw = (canvas: HTMLCanvasElement | null, type: 'traffic' | 'attention') => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawFloorLayout(ctx, canvas.width, canvas.height);

      heatPoints.current.forEach((pt, index) => {
        const ageFactor = index / heatPoints.current.length;
        const radius = type === 'traffic' ? 24 : 36;
        const gradient = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radius);
        
        if (type === 'traffic') {
          gradient.addColorStop(0, `rgba(59, 130, 246, ${0.45 * ageFactor})`);
          gradient.addColorStop(0.5, `rgba(16, 185, 129, ${0.15 * ageFactor})`);
        } else {
          gradient.addColorStop(0, `rgba(239, 68, 68, ${0.5 * ageFactor})`);
          gradient.addColorStop(0.5, `rgba(245, 158, 11, ${0.2 * ageFactor})`);
        }
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });

      activeDots.forEach(dot => {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 11, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = dot.gaze ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    draw(canvasRef1.current, 'traffic');
    draw(canvasRef2.current, 'attention');
  }, [activeDots]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Initializing Heatmaps...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Flame className="w-5 h-5 mr-2 text-orange-500" /> Store Heatmap Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live animated customer traffic density and display attention heatmaps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col items-center">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3">Customer Traffic Heatmap</span>
          <div className="relative border border-slate-850 rounded-lg overflow-hidden w-full aspect-[4/3] bg-black">
            <canvas ref={canvasRef1} width={640} height={480} className="w-full h-full block" />
          </div>
        </div>

        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col items-center">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3">Shelf Attention Heatmap</span>
          <div className="relative border border-slate-850 rounded-lg overflow-hidden w-full aspect-[4/3] bg-black">
            <canvas ref={canvasRef2} width={640} height={480} className="w-full h-full block" />
          </div>
        </div>
      </div>
    </div>
  );
}
