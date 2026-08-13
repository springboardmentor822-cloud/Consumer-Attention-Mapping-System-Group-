import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Users, Clock, ShoppingCart, Percent, AlertTriangle, RefreshCw, Flame, Bell, ArrowRight, Shield, Sliders } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

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

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
}

interface ZoneConfig {
  id: string;
  name: string;
  cameraId: string;
  anchor: { x: number; y: number };
  box: { x: number; y: number; w: number; h: number };
}

interface OverviewPageProps {
  storeId: string;
  token: string | null;
}

function CameraFeed({ cameraId, clean = false, alt = "Camera Feed" }: { cameraId: string; clean?: boolean; alt?: string }) {
  const [src, setSrc] = useState(`http://localhost:8000/api/cameras/${cameraId}/frame?clean=${clean}&t=${Date.now()}`);

  useEffect(() => {
    const timer = setInterval(() => {
      setSrc(`http://localhost:8000/api/cameras/${cameraId}/frame?clean=${clean}&t=${Date.now()}`);
    }, 150);
    return () => clearInterval(timer);
  }, [cameraId, clean]);

  return (
    <img
      src={src}
      className="w-full h-full object-cover"
      alt={alt}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="%230f0f18"/><text x="50" y="32" font-size="6" fill="%23444" text-anchor="middle">STREAM LOADING / INGESTION ACTIVE</text></svg>';
      }}
    />
  );
}

export default function OverviewPage({ storeId, token }: OverviewPageProps) {
  const [data, setData] = useState<StoreManagerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedCamera, setSelectedCamera] = useState<string>('all');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [bandwidth, setBandwidth] = useState<number>(8.0);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Interactive UI State
  const [hoveredZone, setHoveredZone] = useState<ZoneConfig | null>(null);
  const [cameraHeatmaps, setCameraHeatmaps] = useState<Record<string, HeatPoint[]>>({});
  const [loadingHeatmap, setLoadingHeatmap] = useState<boolean>(false);
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();

  // Zone Definitions & Layout Boxes (Conforms to the 640x480 space)
  const zones: ZoneConfig[] = useMemo(() => [
    { id: "entrance", name: "Entrance", cameraId: "cam-entrance-001", anchor: { x: 80, y: 420 }, box: { x: 20, y: 370, w: 120, h: 80 } },
    { id: "checkout", name: "Checkout", cameraId: "cam-checkout-001", anchor: { x: 220, y: 420 }, box: { x: 160, y: 370, w: 120, h: 80 } },
    { id: "exit", name: "Exit", cameraId: "cam-exit-001", anchor: { x: 560, y: 420 }, box: { x: 500, y: 370, w: 120, h: 80 } },
    { id: "promotion", name: "Promotion Area", cameraId: "cam-promotion-001", anchor: { x: 220, y: 240 }, box: { x: 160, y: 200, w: 120, h: 80 } },
    { id: "aisle1", name: "Aisle 1", cameraId: "cam-aisle-001", anchor: { x: 100, y: 100 }, box: { x: 40, y: 40, w: 100, h: 85 } },
    { id: "aisle2", name: "Aisle 2", cameraId: "cam-aisle-002", anchor: { x: 220, y: 100 }, box: { x: 160, y: 40, w: 110, h: 85 } },
    { id: "aisle3", name: "Aisle 3", cameraId: "cam-aisle-003", anchor: { x: 340, y: 100 }, box: { x: 290, y: 40, w: 100, h: 85 } },
    { id: "aisle4", name: "Aisle 4", cameraId: "cam-aisle-004", anchor: { x: 100, y: 340 }, box: { x: 40, y: 270, w: 110, h: 85 } },
    { id: "aisle5", name: "Aisle 5", cameraId: "cam-aisle-005", anchor: { x: 340, y: 340 }, box: { x: 290, y: 270, w: 100, h: 85 } }
  ], []);

  // Fetch standard KPI and chart metadata
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

  // Fetch heatmap data for all cameras or selected camera
  const fetchHeatmapData = async () => {
    setLoadingHeatmap(true);
    const updatedHeatmaps: Record<string, HeatPoint[]> = {};
    const fetchList = selectedCamera === 'all' ? zones.map(z => z.cameraId) : [selectedCamera];

    await Promise.all(
      fetchList.map(async (camId) => {
        try {
          const params = new URLSearchParams({
            store_id: storeId,
            camera_id: camId,
            bandwidth: String(bandwidth)
          });
          if (selectedSegment) params.append("shopper_segment", selectedSegment);
          if (startTime) params.append("start_time", startTime);
          if (endTime) params.append("end_time", endTime);

          const res = await fetch(`http://localhost:8000/api/analytics/heatmaps/store?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            updatedHeatmaps[camId] = json.points || [];
          }
        } catch (e) {
          console.error(`Failed to load heatmap for ${camId}`, e);
        }
      })
    );
    setCameraHeatmaps(updatedHeatmaps);
    setLoadingHeatmap(false);
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, [storeId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHeatmapData();
    }, 450);
    return () => clearTimeout(handler);
  }, [selectedCamera, selectedSegment, bandwidth, startTime, endTime]);

  // Compute activity stats dynamically
  const zoneStats = useMemo(() => {
    const stats: Record<string, { activity: string; pointCount: number; labelColor: string }> = {};
    
    zones.forEach(z => {
      const pts = cameraHeatmaps[z.cameraId] || [];
      const count = pts.length;
      let activity = "No Data";
      let labelColor = "text-slate-500";
      
      if (count > 800) {
        activity = "High Activity";
        labelColor = "text-rose-455";
      } else if (count > 150) {
        activity = "Medium Activity";
        labelColor = "text-amber-455";
      } else if (count > 0) {
        activity = "Low Activity";
        labelColor = "text-blue-455";
      }

      stats[z.id] = { activity, pointCount: count, labelColor };
    });

    return stats;
  }, [cameraHeatmaps, zones]);

  // Sorted list of active zones
  const topActiveZones = useMemo(() => {
    return zones
      .map(z => ({ name: z.name, count: zoneStats[z.id]?.pointCount || 0, status: zoneStats[z.id]?.activity || "No Data" }))
      .sort((a, b) => b.count - a.count);
  }, [zones, zoneStats]);

  // Interactive Floor Canvas Painter (Layered Rendering Engine)
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // LAYER 1: Dark store/floor background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#07070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle flooring pattern grid lines
    ctx.strokeStyle = '#0f0f1c';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 30) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 30) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    // Outer perimeter walls
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // LAYER 2: Clearly visible physical store structures (shelves, counters, aisles)
    // Draw checkout counter impulse rack
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 1.5;
    ctx.fillRect(200, 390, 80, 20);
    ctx.strokeRect(200, 390, 80, 20);
    
    ctx.fillStyle = '#475569';
    ctx.font = '8px Inter, sans-serif';
    ctx.fillText("Impulse Rack", 212, 402);

    // Draw main structural product shelves blocks
    const physicalShelves = [
      { x: 45, y: 140, w: 90, h: 25, label: "Snack Aisle Shelf" },
      { x: 165, y: 140, w: 100, h: 25, label: "Beverage Rack" },
      { x: 295, y: 140, w: 90, h: 25, label: "Bakery Counter" },
      { x: 45, y: 220, w: 90, h: 25, label: "Produce Island" },
      { x: 295, y: 220, w: 90, h: 25, label: "Frozen Case" },
    ];

    physicalShelves.forEach(sh => {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.fillRect(sh.x, sh.y, sh.w, sh.h);
      ctx.strokeRect(sh.x, sh.y, sh.w, sh.h);
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px Inter, sans-serif';
      ctx.fillText(sh.label, sh.x + 8, sh.y + 16);
    });

    // Draw checkout counters
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.fillRect(160, 425, 45, 12);
    ctx.strokeRect(160, 425, 45, 12);
    ctx.fillText("Lane 1", 170, 434);

    ctx.fillRect(235, 425, 45, 12);
    ctx.strokeRect(235, 425, 45, 12);
    ctx.fillText("Lane 2", 245, 434);

    // Draw visual zone boundaries
    zones.forEach(z => {
      const isSelected = selectedCamera === 'all' || selectedCamera === z.cameraId;
      const isHovered = hoveredZone?.id === z.id;
      
      ctx.save();
      ctx.strokeStyle = isSelected 
        ? (isHovered ? '#818cf8' : '#4f46e5') 
        : '#1e293b';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.setLineDash([4, 4]); // Clean dotted boundaries
      ctx.strokeRect(z.box.x, z.box.y, z.box.w, z.box.h);
      ctx.restore();

      // LAYER 5: Zone/camera labels (Rendered below camera anchors to avoid overlapping)
      ctx.fillStyle = isSelected ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText(z.name, z.box.x + 6, z.box.y + 14);

      const stat = zoneStats[z.id];
      ctx.fillStyle = stat?.pointCount > 0 ? '#10b981' : '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText(`Pts: ${stat?.pointCount || 0}`, z.box.x + 6, z.box.y + 26);
    });

    // LAYER 3: Camera-specific heatmap gradients overlay
    Object.entries(cameraHeatmaps).forEach(([camId, points]) => {
      const zone = zones.find(z => z.cameraId === camId);
      if (!zone) return;

      const isSelected = selectedCamera === 'all' || selectedCamera === camId;
      if (!isSelected) return;

      points.forEach(pt => {
        // Project local 640x480 coordinate into target zone bounding box bounds
        const px = zone.box.x + (pt.x / 640.0) * zone.box.w;
        const py = zone.box.y + (pt.y / 480.0) * zone.box.h;
        
        const radius = 20;
        const intensity = pt.intensity;
        const gradient = ctx.createRadialGradient(px, py, 1, px, py, radius);
        
        // Heatmap colors: red/orange/yellow transparency scale
        gradient.addColorStop(0, `rgba(239, 68, 68, ${0.22 * intensity})`);   // Orange/Red High
        gradient.addColorStop(0.5, `rgba(245, 158, 11, ${0.12 * intensity})`); // Amber Medium
        gradient.addColorStop(1, 'rgba(0,0,0,0)');                           // Fade out

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // LAYER 4: Camera anchor marker
    zones.forEach(z => {
      const isSelected = selectedCamera === 'all' || selectedCamera === z.cameraId;
      
      ctx.fillStyle = isSelected ? '#ff0055' : '#1e293b';
      ctx.strokeStyle = isSelected ? '#ffffff' : '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(z.anchor.x, z.anchor.y, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

  }, [cameraHeatmaps, selectedCamera, hoveredZone, zoneStats]);

  // Click handler to select camera from Canvas box
  const handleCanvasClick = () => {
    if (hoveredZone) {
      setSelectedCamera(hoveredZone.cameraId);
      // Scroll corresponding live camera into view
      const element = document.getElementById(`cam-card-${hoveredZone.cameraId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      setSelectedCamera('all');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const matched = zones.find(
      z => x >= z.box.x && x <= z.box.x + z.box.w && y >= z.box.y && y <= z.box.y + z.box.h
    );
    setHoveredZone(matched || null);
  };

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

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {data.store_name} Analytics Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live customer attention telemetry and store metrics compilation</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-lg">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">System Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Today's Visitors", val: kpis?.today_visitors || 0, change: "12.5%", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Current Shoppers", val: kpis?.current_occupancy || 0, change: "Live", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Avg Dwell Time", val: kpis?.avg_dwell_time_seconds ? `${Math.floor(kpis.avg_dwell_time_seconds / 60)}m ${Math.round(kpis.avg_dwell_time_seconds % 60)}s` : "0m", change: "8.3%", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Products Picked", val: kpis?.products_picked_today || 0, change: "15.7%", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          { label: "Conversion Rate", val: kpis?.conversion_rate_percentage ? `${kpis.conversion_rate_percentage}%` : "0.0%", change: "5.6%", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { label: "Cameras Online", val: kpis?.cameras_status || "0/0 Online", change: "Verified", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" }
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-[#0d0d15] border ${kpi.border} p-4 rounded-xl flex flex-col justify-between shadow-md`}>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{kpi.label}</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-200">{kpi.val}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${kpi.bg} ${kpi.color}`}>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Control Bar */}
      <div className="bg-[#121218] border border-slate-850 p-4 rounded-xl shadow-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Attention Filters</span>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Camera Filter Selector */}
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Cameras</option>
            {zones.map(z => (
              <option key={z.cameraId} value={z.cameraId}>{z.name}</option>
            ))}
          </select>

          {/* Segment Filter Selector */}
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Shopper Segments</option>
            <option value="Quick Buyer">Quick Buyer</option>
            <option value="Impulse Buyer">Impulse Buyer</option>
            <option value="Browser">Browser</option>
          </select>

          {/* Bandwidth Selector */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-slate-400 font-medium">Bandwidth:</span>
            <input 
              type="range" min="4.0" max="15.0" step="1.0"
              value={bandwidth} onChange={(e) => setBandwidth(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] font-mono text-slate-300">{bandwidth}</span>
          </div>

          {/* Time pickers */}
          <input 
            type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 px-2 py-1.5 rounded-lg focus:outline-none"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input 
            type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 px-2 py-1.5 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Unified Live Camera Streams Section (Primary Workspace Layout) */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <Camera className="w-4 h-4 text-indigo-400 mr-2" /> Live Camera Stream Workspace
          </h3>
          <span className="text-[9px] bg-slate-850 px-2.5 py-0.5 rounded text-slate-400 uppercase font-mono">
            {selectedCamera === 'all' ? 'All Channels Active' : `Filtered: ${selectedCamera}`}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Floor Plan and analytics (62% width equivalent) */}
          <div className="lg:col-span-8 space-y-2">
            <div className="relative border border-slate-850 rounded-lg overflow-hidden aspect-[4/3] w-full">
              <canvas 
                ref={canvasRef} 
                width={640} 
                height={480} 
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredZone(null)}
                className="w-full h-full block cursor-crosshair" 
              />

              {/* Bounding box warning label badge */}
              <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[8px] text-slate-400 font-medium">
                Approximate camera-local coverage mapped onto store layout
              </div>

              {/* Hover Tooltip Overlay */}
              {hoveredZone && (
                <div 
                  className="absolute bg-slate-950/95 border border-indigo-500/30 p-3 rounded-lg shadow-xl text-[10px] space-y-1.5 text-slate-200 pointer-events-none"
                  style={{
                    left: `${Math.min(75, (hoveredZone.box.x + hoveredZone.box.w / 2) / 640 * 100)}%`,
                    top: `${Math.min(75, (hoveredZone.box.y + hoveredZone.box.h + 10) / 480 * 100)}%`
                  }}
                >
                  <p className="font-bold text-slate-100 border-b border-slate-800 pb-1">{hoveredZone.name} Zone</p>
                  <p><span className="text-slate-400">Camera Node:</span> <span className="font-mono">{hoveredZone.cameraId}</span></p>
                  <p><span className="text-slate-400">Attention Density:</span> <span className={`font-bold ${zoneStats[hoveredZone.id]?.labelColor}`}>{zoneStats[hoveredZone.id]?.activity}</span></p>
                  <p><span className="text-slate-400">Active points count:</span> <span className="font-mono">{zoneStats[hoveredZone.id]?.pointCount || 0}</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Camera streams (38% width equivalent, scrollable) */}
          <div className="lg:col-span-4 space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {liveCams.map((cam) => {
              const isSelected = selectedCamera === cam.camera_id;
              return (
                <div 
                  key={cam.camera_id} 
                  id={`cam-card-${cam.camera_id}`}
                  onClick={() => setSelectedCamera(isSelected ? 'all' : cam.camera_id)}
                  className={`bg-[#0f0f18] border p-2.5 rounded-xl flex flex-col shadow-sm transition-all duration-300 cursor-pointer ${
                    isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/20 shadow-indigo-500/5' : 'border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-300">{cam.name}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{cam.camera_id}</span>
                  </div>

                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-850 mb-2">
                    {cam.status === 'Offline' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-550 text-center select-none">
                        <span className="text-[10px] font-bold text-rose-500 tracking-wider">NO SIGNAL</span>
                        <span className="text-[7px] text-slate-500 mt-0.5">Source unavailable</span>
                      </div>
                    ) : (
                      <>
                        <CameraFeed cameraId={cam.camera_id} clean={false} alt={cam.name} />
                        <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] text-emerald-400 font-bold flex items-center">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>Live
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span>Current Shoppers: <span className="font-bold text-slate-200">{cam.people_count}</span></span>
                    <span className="uppercase text-[8px] font-bold px-1.5 py-0.5 bg-slate-850 rounded text-slate-350">{cam.crowd_status} Activity</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom summaries: Top Active Zones and Hourly visitor traffic charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Active Zones */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            Top Active Zones
          </h4>
          <div className="space-y-2">
            {topActiveZones.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#0d0d15] p-2.5 rounded-lg border border-slate-850 text-xs">
                <span className="text-slate-300 font-semibold">{idx + 1}. {item.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-slate-500">{item.count} pts</span>
                  <span className={`text-[9px] font-bold uppercase ${
                    item.status.includes('High') ? 'text-rose-450' : item.status.includes('Medium') ? 'text-amber-450' : 'text-blue-450'
                  }`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Visitors */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            Hourly Visitor Traffic
          </h4>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.traffic_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d1d29" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={8} />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <ChartTooltip />
                <Line type="monotone" dataKey="visitors" stroke="#4f46e5" strokeWidth={2.0} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Alerts Log */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Operational Alerts Log
            </h4>
            <button onClick={() => navigate('/dashboard/alerts')} className="text-[10px] text-rose-455 font-bold hover:underline flex items-center">
              All Alerts <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
          <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
            {liveAlerts.length > 0 ? (
              liveAlerts.slice(0, 2).map((item, idx) => (
                <div key={idx} className="bg-[#0f0f18] border border-slate-850 p-2 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-300 text-[10px]">{item.type}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{item.message}</p>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-slate-500 italic">No recent alerts registered.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
