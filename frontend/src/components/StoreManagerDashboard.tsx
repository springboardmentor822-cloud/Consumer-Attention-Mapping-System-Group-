import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Camera, Users, Clock, ShoppingCart, Percent, AlertTriangle, Play, RefreshCw, Home, TrendingUp, Layers, Package, Flame, FileText, Settings, Shield, Bell, ArrowRight, Eye, CheckCircle, HelpCircle } from 'lucide-react';

interface MonitoredCamera {
  camera_id: string;
  name: string;
  status: string;
  zone_id: number;
  people_count: number;
  crowd_status: string;
  shelf_activity: string;
  monitored_shelves: string[];
  stream_url?: string;
}

interface AlertItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface Kpis {
  today_visitors: number;
  current_occupancy: number;
  avg_dwell_time_seconds: number;
  products_picked_today: number;
  conversion_rate_percentage: number;
  cameras_status: string;
}

interface ChartPoint {
  hour: string;
  visitors: number;
}

interface ZoneOccupancyPoint {
  zone: string;
  occupancy: number;
}

interface ShelfPoint {
  shelf: string;
  score: number;
}

interface ProductPoint {
  product: string;
  picked: number;
  returned: number;
  compared: number;
}

interface StoreManagerData {
  store_id: string;
  store_name: string;
  kpis: Kpis;
  traffic_chart: ChartPoint[];
  zone_occupancy: ZoneOccupancyPoint[];
  shelf_performance: ShelfPoint[];
  product_interactions: ProductPoint[];
  live_cameras: MonitoredCamera[];
  alerts: AlertItem[];
}

interface ActiveDot {
  id: string;
  x: number;
  y: number;
  gaze: string | null;
  age: number;
  zoneId: number;
}

interface HeatPoint {
  x: number;
  y: number;
  val: number;
}

interface StoreManagerDashboardProps {
  storeId: string;
  token: string | null;
  section?: string;
}

export default function StoreManagerDashboard({ storeId, token, section = 'overview' }: StoreManagerDashboardProps) {
  const [data, setData] = useState<StoreManagerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDots, setActiveDots] = useState<ActiveDot[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>([]);
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef3 = useRef<HTMLCanvasElement | null>(null);
  const heatPoints = useRef<HeatPoint[]>([]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/manager/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const json = await res.json();
      setData(json);
      if (json.alerts) {
        setLiveAlerts(json.alerts.slice(0, 15));
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);

    const ws = new WebSocket(`ws://localhost:8000/api/ws/${storeId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "COORDINATES") {
          const { shopper_id, x, y, gaze_facing_shelf_id, zone_id } = payload;
          
          setActiveDots(prev => {
            const list = prev.filter(dot => dot.id !== shopper_id);
            list.push({ id: shopper_id, x, y, gaze: gaze_facing_shelf_id, age: Date.now(), zoneId: zone_id });
            return list;
          });

          heatPoints.current.push({ x, y, val: 1 });
          if (heatPoints.current.length > 500) {
            heatPoints.current.shift();
          }
        } else if (payload.type === "CAMERA_ALERT") {
          const newAlert: AlertItem = {
            id: String(Date.now()),
            type: payload.event_type,
            message: payload.message,
            timestamp: payload.timestamp
          };
          setLiveAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
        }
      } catch (err) {
        console.error("WS error", err);
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [storeId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDots(prev => prev.filter(dot => Date.now() - dot.age < 5000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const drawFloorLayout = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: string) => {
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

    ctx.fillStyle = mode === 'zone' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.08)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.fillRect(30, 40, 240, 180);
    ctx.strokeRect(30, 40, 240, 180);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText("Entrance Zone Foyer", 40, 60);

    ctx.fillStyle = mode === 'zone' ? 'rgba(79, 70, 229, 0.25)' : 'rgba(79, 70, 229, 0.08)';
    ctx.strokeStyle = '#4f46e5';
    ctx.fillRect(310, 40, 290, 180);
    ctx.strokeRect(310, 40, 290, 180);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText("Main Product Aisle (Aisle 3)", 320, 60);

    ctx.fillStyle = mode === 'zone' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.08)';
    ctx.strokeStyle = '#ef4444';
    ctx.fillRect(30, 260, 570, 170);
    ctx.strokeRect(30, 260, 570, 170);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText("Checkout Lanes & Queues", 40, 285);
  };

  useEffect(() => {
    const draw = (canvas: HTMLCanvasElement | null, mode: string) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawFloorLayout(ctx, canvas.width, canvas.height, mode);

      heatPoints.current.forEach((pt, index) => {
        const ageFactor = index / heatPoints.current.length;
        const radius = mode === 'dwell' ? 38 : 24;
        const gradient = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radius);
        
        if (mode === 'dwell') {
          gradient.addColorStop(0, `rgba(239, 68, 68, ${0.5 * ageFactor})`);
          gradient.addColorStop(0.5, `rgba(245, 158, 11, ${0.2 * ageFactor})`);
        } else {
          gradient.addColorStop(0, `rgba(59, 130, 246, ${0.4 * ageFactor})`);
          gradient.addColorStop(0.5, `rgba(16, 185, 129, ${0.15 * ageFactor})`);
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

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.fillText(`ID ${dot.id}`, dot.x + 8, dot.y - 8);
      });
    };

    if (section === 'heatmap' || section === 'overview') {
      draw(canvasRef.current, 'dwell');
      draw(canvasRef2.current, 'footfall');
      draw(canvasRef3.current, 'zone');
    }
  }, [data, activeDots, section]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-slate-100 space-y-4">
      <RefreshCw className="animate-spin text-indigo-500 w-10 h-10" />
      <p className="text-slate-400 text-xs font-semibold">Synchronizing Dashboard Modules...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-slate-100 p-4">
      <AlertTriangle className="text-rose-500 w-12 h-12 mb-3" />
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Terminal Offline</h2>
      <p className="text-slate-500 text-xs mt-1">{error || "Server connection lost"}</p>
    </div>
  );

  const kpis = data.kpis;
  const liveCams = data.live_cameras;

  const mockNewVsReturning = [
    { name: 'New Visitors', value: 72, color: '#3b82f6' },
    { name: 'Returning Visitors', value: 28, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Main Overview Page (Executive Dashboard) */}
      {section === 'overview' && (
        <div className="space-y-8">
          {/* KPI Widget Row */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: "Today's Visitors", val: kpis?.today_visitors || 1248, change: "12.5%", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { label: "Current Customers", val: kpis?.current_occupancy || 78, change: "Live in store", color: "text-emerald-450", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Avg Dwell Time", val: kpis?.avg_dwell_time_seconds ? `${Math.floor(kpis.avg_dwell_time_seconds / 60)}m ${Math.round(kpis.avg_dwell_time_seconds % 60)}s` : "3m 42s", change: "8.3%", color: "text-amber-450", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { label: "Products Picked", val: kpis?.products_picked_today || 362, change: "15.7%", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              { label: "Conversion Rate", val: kpis?.conversion_rate_percentage ? `${kpis.conversion_rate_percentage}%` : "24.6%", change: "5.6%", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
              { label: "Cameras Online", val: kpis?.cameras_status || "8/8 Online", change: "All online", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" }
            ].map((kpi, idx) => (
              <div key={idx} className={`bg-[#0d0d15] border ${kpi.border} p-4 rounded-xl flex flex-col justify-between shadow-md`}>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{kpi.label}</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-200">{kpi.val}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${kpi.bg} ${kpi.color}`}>{kpi.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live Camera Grid Preview */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                <Camera className="w-4 h-4 text-indigo-400 mr-2" /> Live Camera Streams
              </h3>
              <button onClick={() => navigate('/dashboard/live-cameras')} className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center">
                View Full Grid <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              {liveCams.map((cam, idx) => (
                <div key={cam.camera_id} className="bg-[#0f0f18] border border-slate-850 p-2.5 rounded-lg flex flex-col shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 truncate mb-1.5">{idx + 1}. {cam.name}</span>
                  <div className="relative aspect-video w-full rounded overflow-hidden bg-black border border-slate-800 mb-2">
                    <img
                      src={`http://localhost:8000/api/cameras/${cam.camera_id}/stream`}
                      className="w-full h-full object-cover"
                      alt={cam.name}
                    />
                  </div>
                  <span className="text-[8px] text-emerald-400 font-bold flex items-center">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>Live
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Visitors Preview */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                <Users className="w-4 h-4 text-indigo-400 mr-2" /> Visitor Count Analytics
              </h3>
              <button onClick={() => navigate('/dashboard/visitors')} className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center">
                Detailed Analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-500">Visitors Over Time</span>
                <div className="h-36 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.traffic_chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1d1d28" />
                      <XAxis dataKey="hour" hide />
                      <YAxis hide />
                      <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-500">Visitors by Zone</span>
                <div className="h-36 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.zone_occupancy}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1d1d28" />
                      <XAxis dataKey="zone" hide />
                      <YAxis hide />
                      <Bar dataKey="occupancy" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg flex flex-col justify-between">
                <span className="text-[9px] uppercase font-bold text-slate-500">New vs Returning</span>
                <div className="h-36 mt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mockNewVsReturning} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={22} outerRadius={36}>
                        {mockNewVsReturning.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Store Traffic Preview */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-450 mr-2" /> Traffic Flow Paths
              </h3>
              <button onClick={() => navigate('/dashboard/store-traffic')} className="text-[10px] text-blue-450 font-bold hover:underline flex items-center">
                Detailed Flow <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-500">Visitors by Hour</span>
                <div className="h-36 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.traffic_chart}>
                      <Line type="monotone" dataKey="visitors" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-500">Traffic by Zone</span>
                <div className="h-36 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.zone_occupancy} dataKey="occupancy" nameKey="zone" cx="50%" cy="50%" innerRadius={22} outerRadius={36}>
                        {data.zone_occupancy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg flex flex-col justify-around text-[10px] font-bold text-slate-400">
                <div className="bg-slate-950/60 p-2 rounded border border-slate-900 flex justify-between">
                  <span>Entrance ➔ Snacks</span>
                  <span className="text-indigo-400">Active</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-900 flex justify-between">
                  <span>Snacks ➔ Checkout</span>
                  <span className="text-indigo-400">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shelf Performance Preview */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                <Layers className="w-4 h-4 text-indigo-400 mr-2" /> Shelf Performance Preview
              </h3>
              <button onClick={() => navigate('/dashboard/shelf-performance')} className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center">
                Shelf Metrics <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg space-y-2 text-[10px]">
                <span className="text-[9px] uppercase font-bold text-slate-500">Top Shelf by Engagement</span>
                {data.shelf_performance.slice(0, 3).map((shelf, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-350">{shelf.shelf}</span>
                    <span className="text-indigo-400 font-bold">{shelf.score}%</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-500">Shelf Engagement Heat</span>
                <div className="grid grid-cols-4 gap-1.5 mt-3">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className={`h-6 rounded flex items-center justify-center font-bold text-[8px] text-white ${
                      idx === 2 || idx === 5 ? 'bg-red-650' : idx === 1 || idx === 6 ? 'bg-orange-500/80' : 'bg-green-600/50'
                    }`}>
                      Z {idx + 1}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg space-y-2 text-[10px]">
                <span className="text-[9px] uppercase font-bold text-slate-500">Least Engaged Shelves</span>
                {[
                  { name: "Shelf D", val: 38 },
                  { name: "Shelf E", val: 28 },
                  { name: "Shelf F", val: 22 }
                ].map((shelf, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-350">{shelf.name}</span>
                    <span className="text-rose-455 font-bold">{shelf.val}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Interaction Preview */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                <Package className="w-4 h-4 text-purple-400 mr-2" /> SKU Engagement Previews
              </h3>
              <button onClick={() => navigate('/dashboard/product-interaction')} className="text-[10px] text-purple-400 font-bold hover:underline flex items-center">
                Examine Catalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px] font-semibold text-slate-300">
              {[
                { title: "Most Picked", item: "Coca Cola 500ml", count: "48 Picks" },
                { title: "Most Returned", item: "Lays Classic 52g", count: "12 Returns" },
                { title: "Most Compared", item: "iPhone 14", count: "25 Compares" },
                { title: "Least Viewed", item: "Product A", count: "8 Views" }
              ].map((group, idx) => (
                <div key={idx} className="bg-[#0f0f18] border border-slate-850 p-4 rounded-lg shadow-sm">
                  <p className="text-[8px] uppercase font-bold text-slate-500 mb-2">{group.title}</p>
                  <div className="flex justify-between items-center">
                    <span className="truncate text-slate-200">{group.item}</span>
                    <span className="text-indigo-400 font-bold">{group.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Store Heatmap Canvas Preview */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                <Flame className="w-4 h-4 text-orange-400 mr-2" /> Store Heatmap Canvas
              </h3>
              <button onClick={() => navigate('/dashboard/heatmap')} className="text-[10px] text-orange-400 font-bold hover:underline flex items-center">
                Canvas Analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="relative border border-slate-850 rounded-lg bg-[#0f0f18] overflow-hidden aspect-[4/3] max-w-lg mx-auto">
              <canvas ref={canvasRef} width={640} height={480} className="w-full h-full block" />
            </div>
          </div>

          {/* Alerts Preview */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                <Bell className="w-4 h-4 text-rose-455 mr-2" /> Active Store Alerts Log
              </h3>
              <button onClick={() => navigate('/dashboard/alerts')} className="text-[10px] text-rose-455 font-bold hover:underline flex items-center">
                Alert Matrix <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "High Crowd Detected", details: "Aisle B is crowded", time: "10:24 AM", border: "border-amber-500/20", color: "text-amber-450", bg: "bg-amber-500/10" },
                { title: "Shelf C - Low Attention", details: "Attention time dropped", time: "10:18 AM", border: "border-indigo-500/20", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                { title: "Camera 6 Offline", details: "Promotion Area camera is offline", time: "10:15 AM", border: "border-rose-500/20", color: "text-rose-455", bg: "bg-rose-500/10" },
                { title: "Long Queue at Checkout", details: "8 customers in queue", time: "10:10 AM", border: "border-rose-500/20", color: "text-rose-455", bg: "bg-rose-500/10" }
              ].map((item, idx) => (
                <div key={idx} className={`bg-[#0f0f18] border ${item.border} p-3 rounded-lg flex flex-col justify-between shadow-sm`}>
                  <div className="flex justify-between items-start text-[9px] font-bold text-slate-500">
                    <span className="uppercase text-slate-450">{item.title}</span>
                    <span>{item.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-semibold mt-2">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Standalone CCTV Camera Page */}
      {section === 'live-cameras' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Camera className="w-4 h-4 text-indigo-400" />
            <span>Store Video Surveillance Matrix</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveCams.map((cam) => (
              <div key={cam.camera_id} className="bg-[#171722] border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-200">{cam.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider ${cam.status === "Online" ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'}`}>
                    {cam.status}
                  </span>
                </div>
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-850">
                  <img
                    src={`http://localhost:8000/api/cameras/${cam.camera_id}/stream`}
                    className="w-full h-full object-cover"
                    alt={cam.name}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                  <div>Zone ID: <span className="text-slate-200 font-bold block mt-0.5">{cam.zone_id}</span></div>
                  <div>Live Count: <span className="text-slate-200 font-bold block mt-0.5">{cam.people_count}</span></div>
                  <div>Density: <span className="text-slate-200 font-bold block mt-0.5">{cam.crowd_status}</span></div>
                  <div>Activity: <span className="text-slate-200 font-bold block mt-0.5">{cam.shelf_activity}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Dedicated Visitors Page */}
      {section === 'visitors' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Visitor Demographics & Timelines</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#181822] p-5 rounded-xl border border-slate-850">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Visit Timeline</span>
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.traffic_chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d2c" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip />
                    <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#181822] p-5 rounded-xl border border-slate-850">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Zone Comparison</span>
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.zone_occupancy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d2c" />
                    <XAxis dataKey="zone" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip />
                    <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Dedicated Store Traffic Page */}
      {section === 'store-traffic' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Shopper Journey flow Paths</span>
          </h2>
          <div className="bg-[#181822] border border-slate-850 p-6 rounded-xl space-y-6">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Animated Customer Journey Paths</span>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center justify-center text-center font-bold text-xs py-10">
              <div className="bg-indigo-650/15 border border-indigo-500/40 p-4 rounded-xl shadow-md text-indigo-300">
                <p className="text-[8px] uppercase text-slate-500 tracking-widest mb-1">Source Node</p>
                Entrance Foyer
              </div>
              <div className="text-slate-650 animate-pulse text-lg">➔</div>
              <div className="bg-amber-600/15 border border-amber-500/45 p-4 rounded-xl shadow-md text-amber-300">
                <p className="text-[8px] uppercase text-slate-500 tracking-widest mb-1">Aisle Zone</p>
                Promo Displays
              </div>
              <div className="text-slate-650 animate-pulse text-lg">➔</div>
              <div className="bg-rose-650/15 border border-rose-500/40 p-4 rounded-xl shadow-md text-rose-300">
                <p className="text-[8px] uppercase text-slate-500 tracking-widest mb-1">Terminal Node</p>
                Checkout Counter
              </div>
            </div>

            <div className="h-44 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.traffic_chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d1d2c" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke="#e11d48" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 5. Dedicated Shelf Performance Page */}
      {section === 'shelf-performance' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Live Shelf Performance Analysis</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#181822] p-5 rounded-xl border border-slate-850 space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shelf Engagement Index</span>
              <div className="space-y-4 text-xs font-semibold">
                {data.shelf_performance.map((shelf, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>{shelf.shelf}</span>
                      <span className="text-indigo-400 font-bold">{shelf.score} Index</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, shelf.score)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#181822] p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Performing Display Shelf</span>
                <div className="mt-4 bg-slate-900/60 p-4 rounded-lg border border-slate-850">
                  <h4 className="text-lg font-black text-emerald-450">
                    {data.shelf_performance[0]?.shelf || "N/A"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">This display shelf logged the highest customer gaze engagement index today.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Dedicated Product Interaction Page */}
      {section === 'product-interaction' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Package className="w-4 h-4 text-indigo-400" />
            <span>Product Interactions & Conversion Catalog</span>
          </h2>
          <div className="bg-[#181822] border border-slate-850 p-5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 block">Product Engagement Breakdown</span>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left font-semibold text-slate-350">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[9px]">
                    <th className="pb-3">SKU Name</th>
                    <th className="pb-3">Pickups</th>
                    <th className="pb-3">Returns</th>
                    <th className="pb-3">Compared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {data.product_interactions.map((pr, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3 text-slate-200">{pr.product}</td>
                      <td className="py-3 text-indigo-400">{pr.picked}</td>
                      <td className="py-3 text-rose-455">{pr.returned}</td>
                      <td className="py-3 text-amber-400">{pr.compared}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Dedicated Heatmap Page */}
      {section === 'heatmap' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Animated Heatmap Canvases</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#181822] border border-slate-850 p-4 rounded-xl flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Dwell Time Heatmap</span>
              <div className="relative border border-slate-850 rounded-lg overflow-hidden w-full aspect-[4/3] bg-black">
                <canvas ref={canvasRef} width={640} height={480} className="w-full h-full block" />
              </div>
            </div>
            <div className="bg-[#181822] border border-slate-850 p-4 rounded-xl flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Footfall Density Heatmap</span>
              <div className="relative border border-slate-850 rounded-lg overflow-hidden w-full aspect-[4/3] bg-black">
                <canvas ref={canvasRef2} width={640} height={480} className="w-full h-full block" />
              </div>
            </div>
            <div className="bg-[#181822] border border-slate-850 p-4 rounded-xl flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Zone Occupancy Heatmap</span>
              <div className="relative border border-slate-850 rounded-lg overflow-hidden w-full aspect-[4/3] bg-black">
                <canvas ref={canvasRef3} width={640} height={480} className="w-full h-full block" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Dedicated Alerts Page */}
      {section === 'alerts' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Live Security & Event Notifications Log</span>
          </h2>
          <div className="bg-[#181822] border border-slate-850 p-5 rounded-xl divide-y divide-slate-850 text-xs font-semibold text-slate-350">
            {liveAlerts.map((alert) => (
              <div key={alert.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${alert.type === 'overcrowding' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                  <span>{alert.message}</span>
                </div>
                <span className="text-slate-500 text-[10px] font-bold">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {liveAlerts.length === 0 && (
              <div className="py-4 text-slate-500 text-center">No active notifications logged.</div>
            )}
          </div>
        </div>
      )}

      {/* 9. Dedicated Activities Page */}
      {section === 'activities' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Chronological Customer Activity Events</span>
          </h2>
          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-850">
            {activeDots.map((dot) => (
              <div key={dot.id} className="relative pl-8 text-xs font-semibold">
                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full border-4 border-[#121218]"></div>
                <div className="bg-[#181822] border border-slate-850 p-3 rounded-lg max-w-2xl shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span className="font-bold uppercase tracking-wider text-indigo-400">ACTIVE DETECTIONS</span>
                    <span>{new Date(dot.age).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-250">
                    Shopper <span className="text-indigo-400">#{dot.id}</span> is inside <span className="text-slate-100 font-bold">Zone {dot.zoneId}</span> 
                    {dot.gaze ? ` and gaze mapped directly to shelf: ${dot.gaze}` : " looking at displays"}
                  </p>
                </div>
              </div>
            ))}
            {activeDots.length === 0 && (
              <div className="p-6 text-center text-slate-500">No active customer tracking events registered in the last 5 seconds.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
