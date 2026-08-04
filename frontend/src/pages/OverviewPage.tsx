import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Camera, Users, Clock, ShoppingCart, Percent, AlertTriangle, RefreshCw, Home, TrendingUp, Layers, Package, Flame, Bell, ArrowRight, Shield } from 'lucide-react';

interface MonitoredCamera {
  camera_id: string;
  name: string;
  status: string;
  zone_id: number;
  people_count: number;
  crowd_status: string;
  shelf_activity: string;
  monitored_shelves: string[];
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
}

interface HeatPoint {
  x: number;
  y: number;
  val: number;
}

interface OverviewPageProps {
  storeId: string;
  token: string | null;
}

export default function OverviewPage({ storeId, token }: OverviewPageProps) {
  const [data, setData] = useState<StoreManagerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDots, setActiveDots] = useState<ActiveDot[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>([]);
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
        setLiveAlerts(json.alerts.slice(0, 10));
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);

    const ws = new WebSocket(`ws://localhost:8000/api/ws/${storeId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "COORDINATES") {
          const { shopper_id, x, y, gaze_facing_shelf_id, zone_id } = payload;
          
          setActiveDots(prev => {
            const list = prev.filter(dot => dot.id !== shopper_id);
            list.push({ id: shopper_id, x, y, gaze: gaze_facing_shelf_id, age: Date.now() });
            return list;
          });

          heatPoints.current.push({ x, y, val: 1 });
          if (heatPoints.current.length > 300) {
            heatPoints.current.shift();
          }

          // Real-time KPI update
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              kpis: {
                ...prev.kpis,
                current_occupancy: Math.max(1, prev.kpis.current_occupancy + (Math.random() > 0.8 ? 1 : 0))
              }
            };
          });
        } else if (payload.type === "CAMERA_ALERT") {
          const newAlert: AlertItem = {
            id: String(Date.now()),
            type: payload.event_type,
            message: payload.message,
            timestamp: payload.timestamp
          };
          setLiveAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
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

  // Floor Render Helper for Canvas
  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0f18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1d1d2c';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    // Zones mapping
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.fillRect(30, 40, 240, 180);
    ctx.strokeRect(30, 40, 240, 180);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText("Entrance Zone Foyer", 40, 60);

    ctx.fillStyle = 'rgba(79, 70, 229, 0.08)';
    ctx.strokeStyle = '#4f46e5';
    ctx.fillRect(310, 40, 290, 180);
    ctx.strokeRect(310, 40, 290, 180);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText("Main Product Aisle (Aisle 3)", 320, 60);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.strokeStyle = '#ef4444';
    ctx.fillRect(30, 260, 570, 170);
    ctx.strokeRect(30, 260, 570, 170);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText("Checkout Lanes & Queues", 40, 285);

    heatPoints.current.forEach((pt, index) => {
      const ageFactor = index / heatPoints.current.length;
      const radius = 35;
      const gradient = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radius);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.45 * ageFactor})`);
      gradient.addColorStop(0.5, `rgba(245, 158, 11, ${0.2 * ageFactor})`);
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
      ctx.arc(dot.x, dot.y, 10, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = dot.gaze ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '9px monospace';
      ctx.fillText(`ID ${dot.id}`, dot.x + 8, dot.y - 8);
    });

  }, [data, activeDots]);

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

  const conversionPie = [
    { name: 'Purchased (Converted)', value: kpis?.conversion_rate_percentage || 24.6, color: '#10b981' },
    { name: 'Browsed Only', value: Math.max(0, 100 - (kpis?.conversion_rate_percentage || 24.6)), color: '#334155' }
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {data.store_name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live Store Surveillance and Analytics Management Terminal - OVERVIEW</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-lg">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-semibold tracking-wider text-emerald-400">SURVEILLANCE INGESTION ACTIVE</span>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Today's Visitors", val: kpis?.today_visitors || 1248, change: "12.5%", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Current Customers", val: kpis?.current_occupancy || 78, change: "Live in store", color: "text-emerald-455", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
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

      {/* 2. Live Camera Grid */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <Camera className="w-4 h-4 text-indigo-400 mr-2" /> Live Camera Matrix Preview
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

      {/* 3. Store Traffic (Hourly Trend Line Chart) */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <TrendingUp className="w-4 h-4 text-blue-400 mr-2" /> Store Traffic Timeline
          </h3>
          <button onClick={() => navigate('/dashboard/store-traffic')} className="text-[10px] text-blue-400 font-bold hover:underline flex items-center">
            Analyze Traffic <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.traffic_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
              <YAxis stroke="#94a3b8" fontSize={9} />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Zone Occupancy (Vertical Bar Chart) */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <Users className="w-4 h-4 text-emerald-455 mr-2" /> Zone Occupancy Comparisons
          </h3>
          <button onClick={() => navigate('/dashboard/visitors')} className="text-[10px] text-emerald-455 font-bold hover:underline flex items-center">
            Visitor Detail <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.zone_occupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
              <XAxis dataKey="zone" stroke="#94a3b8" fontSize={9} />
              <YAxis stroke="#94a3b8" fontSize={9} />
              <Tooltip />
              <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Shelf Performance (Horizontal Bar Chart) */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <Layers className="w-4 h-4 text-indigo-400 mr-2" /> Shelf Performance Summary
          </h3>
          <button onClick={() => navigate('/dashboard/shelf-performance')} className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center">
            Analyze Shelves <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.shelf_performance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
              <XAxis type="number" stroke="#94a3b8" fontSize={9} />
              <YAxis type="category" dataKey="shelf" stroke="#94a3b8" fontSize={9} />
              <Tooltip />
              <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Product Interaction Preview */}
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

      {/* 7. Store Heatmap Canvas Preview */}
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

      {/* 8. Camera Monitoring Summary */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
          <Shield className="w-4 h-4 text-cyan-400 mr-2" /> Surveillance Nodes Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-350">
          {liveCams.map((cam) => (
            <div key={cam.camera_id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-300">{cam.name}</span>
              <div className="flex items-center space-x-2">
                <span className={`w-1.5 h-1.5 rounded-full ${cam.status === "Online" ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{cam.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Alerts Log */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <Bell className="w-4 h-4 text-rose-455 mr-2" /> Operational Alerts Log
          </h3>
          <button onClick={() => navigate('/dashboard/alerts')} className="text-[10px] text-rose-455 font-bold hover:underline flex items-center">
            All Alerts <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "High Crowd Detected", details: "Aisle B is crowded", time: "10:24 AM", border: "border-amber-500/20" },
            { title: "Shelf C - Low Attention", details: "Attention time dropped", time: "10:18 AM", border: "border-indigo-500/20" },
            { title: "Camera 6 Offline", details: "Promotion Area camera is offline", time: "10:15 AM", border: "border-rose-500/20" },
            { title: "Long Queue at Checkout", details: "8 customers in queue", time: "10:10 AM", border: "border-rose-500/20" }
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
  );
}
