import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Flame, RefreshCw, AlertCircle, Map, Maximize2, Sliders, Calendar, HelpCircle, Video } from 'lucide-react';
import { apiClient } from '../lib/axios';

interface CameraAnchor {
  id: string;
  name: string;
  x: number;
  y: number;
  locationName: string;
  calibrated: boolean;
}

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
}

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

interface LiveHeatmapPageProps {
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

export default function LiveHeatmapPage({ storeId, token }: LiveHeatmapPageProps) {
  // 1. Component State
  const [activeTab, setActiveTab] = useState<'overview' | 'local'>('overview');
  const [selectedCamera, setSelectedCamera] = useState<string>('all');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [bandwidth, setBandwidth] = useState<number>(10.0);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
  const [heatmapPoints, setHeatmapPoints] = useState<HeatPoint[]>([]);
  const [cameras, setCameras] = useState<MonitoredCamera[]>([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState<boolean>(true);
  const [loadingCameras, setLoadingCameras] = useState<boolean>(true);
  
  // Interactive UI elements
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  // 2. Camera Anchors Configuration (From seed_9_cameras.py)
  const cameraAnchors: CameraAnchor[] = useMemo(() => [
    { id: "cam-entrance-001", name: "Entrance Camera", x: 80.0, y: 420.0, locationName: "Entrance Foyer", calibrated: true },
    { id: "cam-exit-001", name: "Exit Camera", x: 560.0, y: 420.0, locationName: "Exit Foyer", calibrated: false },
    { id: "cam-checkout-001", name: "Checkout Camera", x: 220.0, y: 420.0, locationName: "Checkout Lanes", calibrated: false },
    { id: "cam-promotion-001", name: "Promotion Camera", x: 220.0, y: 240.0, locationName: "Promotion Display", calibrated: false },
    { id: "cam-aisle-001", name: "Aisle Camera 1", x: 100.0, y: 100.0, locationName: "Aisle 1 Corridor", calibrated: false },
    { id: "cam-aisle-002", name: "Aisle Camera 2", x: 220.0, y: 100.0, locationName: "Aisle 2 Corridor", calibrated: false },
    { id: "cam-aisle-003", name: "Aisle Camera 3", x: 340.0, y: 100.0, locationName: "Aisle 3 Corridor", calibrated: false },
    { id: "cam-aisle-004", name: "Aisle Camera 4", x: 100.0, y: 340.0, locationName: "Aisle 4 Corridor", calibrated: false },
    { id: "cam-aisle-005", name: "Aisle Camera 5", x: 340.0, y: 340.0, locationName: "Aisle 5 Corridor", calibrated: false }
  ], []);

  // Schematic shelves configuration (From database seed)
  const shelves = useMemo(() => [
    { id: 'shelf-entrance-001', name: 'Entrance Promo Display', x: 50, y: 50, w: 200, h: 300, color: 'rgba(16, 185, 129, 0.05)', stroke: '#10b981' },
    { id: 'shelf-aisle3-001', name: 'Aisle 3 Snack Shelf', x: 100, y: 150, w: 250, h: 300, color: 'rgba(79, 70, 229, 0.05)', stroke: '#4f46e5' },
    { id: 'shelf-checkout-001', name: 'Checkout Counter Impulse Rack', x: 400, y: 100, w: 200, h: 300, color: 'rgba(239, 68, 68, 0.05)', stroke: '#ef4444' }
  ], []);

  // 3. API Integrations
  const fetchHeatmap = async () => {
    setLoadingHeatmap(true);
    try {
      const params: any = {
        bandwidth,
        store_id: storeId
      };
      if (selectedCamera !== 'all') {
        params.camera_id = selectedCamera;
      }
      if (selectedSegment) {
        params.shopper_segment = selectedSegment;
      }
      if (startTime) {
        params.start_time = startTime;
      }
      if (endTime) {
        params.end_time = endTime;
      }

      const res = await apiClient.get('/api/analytics/heatmaps/store', { params });
      setHeatmapPoints(res.data.points || []);
    } catch (err) {
      console.error("Failed to load heatmap", err);
    } finally {
      setLoadingHeatmap(false);
    }
  };

  const fetchCameras = async () => {
    try {
      const res = await apiClient.get(`/api/dashboards/manager/${storeId}`);
      setCameras(res.data.live_cameras || []);
    } catch (err) {
      console.error("Failed to load camera list", err);
    } finally {
      setLoadingCameras(false);
    }
  };

  // Debounced Heatmap refetch when bandwidth/time inputs change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchHeatmap();
    }, 400);
    return () => clearTimeout(handler);
  }, [bandwidth, selectedCamera, selectedSegment, startTime, endTime]);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 10000);
    return () => clearInterval(interval);
  }, [storeId]);

  // Handle marker/card click selection
  const handleSelectCamera = (camId: string) => {
    setSelectedCamera(camId);
    
    // Scroll corresponding camera feed into view on layout select
    const element = document.getElementById(`cam-card-${camId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 4. Approximate Coordinate Projection Method (Option C projection mapping)
  const projectedHeatmapPoints = useMemo(() => {
    if (activeTab === 'local') return heatmapPoints; // In local mode, raw coords are rendered directly

    return heatmapPoints.map((pt) => {
      // Find corresponding camera (or anchor relative to camera selection)
      let anchor = cameraAnchors.find(a => a.id === selectedCamera);
      
      // If 'all' is selected, we distribute points approximately near corresponding cameras
      if (!anchor) {
        const idx = Math.floor((pt.x + pt.y) * 17) % cameraAnchors.length;
        anchor = cameraAnchors[idx];
      }

      // Map local 640x480 space approximately onto a 120x120 footprint around the camera's visual anchor
      const scaleFactor = 1.2;
      const projX = anchor.x - 60 + (pt.x / 640.0) * 120 * scaleFactor;
      const projY = anchor.y - 60 + (pt.y / 480.0) * 120 * scaleFactor;

      return {
        x: Math.max(10, Math.min(630, projX)),
        y: Math.max(10, Math.min(470, projY)),
        intensity: pt.intensity
      };
    });
  }, [heatmapPoints, activeTab, selectedCamera, cameraAnchors]);

  // 5. Canvas Painter
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A. Draw floor plan background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#09090e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = '#11111c';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    if (activeTab === 'overview') {
      // B. Draw shelves (from DB configuration)
      shelves.forEach(sh => {
        ctx.fillStyle = sh.color;
        ctx.strokeStyle = sh.stroke;
        ctx.lineWidth = 1.5;
        ctx.fillRect(sh.x, sh.y, sh.w, sh.h);
        ctx.strokeRect(sh.x, sh.y, sh.w, sh.h);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.fillText(sh.name, sh.x + 8, sh.y + 18);
      });

      // C. Draw Store Zones text labels
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText("AISLE 1-5 ZONE CORRIDORS", 100, 30);
      ctx.fillText("PROMOTION ZONE", 220, 225);
      ctx.fillText("ENTRANCE FOYER", 50, 465);
      ctx.fillText("CHECKOUT LANES", 220, 465);
      ctx.fillText("EXIT GATE", 540, 465);
    } else {
      // Local Mode: draw a simple frame grid with camera details
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, 10, 220, 75);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Local View: ${selectedCamera === 'all' ? 'All Cameras' : selectedCamera}`, 20, 28);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Resolution: 640x480`, 20, 44);
      ctx.fillText(`Coordinate Scale: Local Normalized`, 20, 58);
      ctx.fillText(`Points Rendered: ${heatmapPoints.length}`, 20, 72);
    }

    // D. Overlay Heatmap
    projectedHeatmapPoints.forEach((pt) => {
      const radius = 32;
      const gradient = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radius);
      
      // Professional fire-attention color scale (Red -> Yellow -> transparent)
      gradient.addColorStop(0, `rgba(239, 68, 68, ${pt.intensity * 0.55})`);
      gradient.addColorStop(0.3, `rgba(245, 158, 11, ${pt.intensity * 0.25})`);
      gradient.addColorStop(0.7, `rgba(59, 130, 246, ${pt.intensity * 0.05})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    // E. Draw interactive Camera Markers (Only on Overview Tab)
    if (activeTab === 'overview') {
      cameraAnchors.forEach((cam) => {
        const isSelected = selectedCamera === cam.id;
        const isHovered = hoveredMarker === cam.id;

        // Pulse ring when selected
        if (isSelected || isHovered) {
          ctx.strokeStyle = isSelected ? 'rgba(79, 70, 229, 0.4)' : 'rgba(16, 185, 129, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cam.x, cam.y, 22, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Center dot
        ctx.fillStyle = isSelected ? '#4f46e5' : '#10b981';
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, 7, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, 7, 0, 2 * Math.PI);
        ctx.stroke();

        if (isHovered || isSelected) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = isSelected ? '#4f46e5' : '#10b981';
          ctx.lineWidth = 1;
          const text = cam.name;
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(cam.x - textWidth/2 - 6, cam.y - 30, textWidth + 12, 18);
          ctx.strokeRect(cam.x - textWidth/2 - 6, cam.y - 30, textWidth + 12, 18);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '9px sans-serif';
          ctx.fillText(text, cam.x - textWidth/2, cam.y - 18);
        }
      });
    }

  }, [projectedHeatmapPoints, activeTab, selectedCamera, hoveredMarker]);

  // Click coordinate detection on canvas (to select camera anchors)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'overview') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Detect if clicked close to any camera anchor
    for (const cam of cameraAnchors) {
      const dist = Math.hypot(cam.x - clickX, cam.y - clickY);
      if (dist <= 18) {
        handleSelectCamera(cam.id);
        break;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'overview') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hoverX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const hoverY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Detect hovered camera anchor
    let found: string | null = null;
    for (const cam of cameraAnchors) {
      const dist = Math.hypot(cam.x - hoverX, cam.y - hoverY);
      if (dist <= 18) {
        found = cam.id;
        break;
      }
    }
    setHoveredMarker(found);
  };

  return (
    <div className="space-y-6">
      {/* Header and Integrity Notice */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Flame className="w-6 h-6 mr-2 text-orange-500 animate-pulse" /> Live Attention & Layout Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">Cross-camera shoppers density visualizer and hot spot metrics</p>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex bg-[#121218] p-1 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-650 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5 mr-1.5" /> Store Overview
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'local'
                ? 'bg-indigo-650 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Camera Local View
          </button>
        </div>
      </div>

      {/* Visual Honesty Disclaimer & Badges */}
      <div className="bg-[#121218]/90 border border-slate-800 rounded-xl p-4 flex items-start space-x-3 text-slate-300">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase flex items-center">
            Approximate Local Attention Coverage
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Camera-local analytics projected approximately onto the store layout. Physical camera coverage is not globally calibrated.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-full">
              cam-entrance-001: <strong className="text-emerald-400">Normalized Local (100x100)</strong>
            </span>
            <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-full">
              Other 8 cameras: <strong className="text-amber-400">Uncalibrated Coordinates</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Controls / Filters Row */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Camera Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
            <Video className="w-3 h-3 mr-1" /> Filter Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full bg-[#07070a] border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="all">All Cameras (Aggregated)</option>
            {cameraAnchors.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
        </div>

        {/* Shopper Segment Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
            <Sliders className="w-3 h-3 mr-1" /> Shopper Segment
          </label>
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="w-full bg-[#07070a] border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="">All Shoppers</option>
            <option value="Impulse Buyer">Impulse Buyer</option>
            <option value="Quick Buyer">Quick Buyer</option>
            <option value="Explorer">Explorer</option>
            <option value="Comparison Shopper">Comparison Shopper</option>
            <option value="Brand Loyal Customer">Brand Loyal Customer</option>
          </select>
        </div>

        {/* KDE Bandwidth Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>KDE Bandwidth (Smoothing)</span>
            <span className="text-indigo-400 font-mono font-bold">{bandwidth}</span>
          </label>
          <div className="pt-2">
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={bandwidth}
              onChange={(e) => setBandwidth(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-900 border border-slate-800 h-1 rounded"
            />
          </div>
        </div>

        {/* Start Time */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
            <Calendar className="w-3 h-3 mr-1" /> Start Date/Time
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-[#07070a] border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-1.5 outline-none focus:border-indigo-500"
          />
        </div>

        {/* End Time */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
            <Calendar className="w-3 h-3 mr-1" /> End Date/Time
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-[#07070a] border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-1.5 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layout Floor Plan Visualizer */}
        <div className="lg:col-span-2 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
              {activeTab === 'overview' ? 'Schematic Store Floor Plan Layout' : 'Camera-Local Grid Frame'}
              <span title="Interactive map showing projected density logs" className="inline-flex items-center cursor-pointer">
                <HelpCircle className="w-3 h-3 text-slate-500 ml-1.5" />
              </span>
            </span>
            {selectedCamera !== 'all' && (
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded">
                Focused: {selectedCamera}
              </span>
            )}
          </div>

          <div className="relative border border-slate-850 rounded-lg overflow-hidden w-full aspect-[4/3] bg-black">
            {loadingHeatmap && (
              <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center text-xs text-indigo-400 z-10 font-bold backdrop-blur-[1px]">
                <RefreshCw className="animate-spin mr-2 w-4 h-4" /> Updating Heatmap...
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className="w-full h-full block cursor-crosshair"
            />
          </div>

          {/* Attention Density scale Legend */}
          <div className="w-full flex justify-between items-center mt-4 text-[10px] font-bold text-slate-400 bg-[#0c0c12] p-3 rounded-lg border border-slate-850">
            <span>LOW ATTENTION</span>
            <div className="flex-1 mx-4 h-2 rounded bg-gradient-to-r from-blue-500/20 via-yellow-500/80 to-red-600"></div>
            <span>HIGH ATTENTION</span>
          </div>
        </div>

        {/* Live Camera Grid Panel */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Live Camera Nodes Feed</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Scroll to monitor active RTSP/development streams</p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingCameras ? (
              <div className="text-xs text-slate-500 flex items-center py-4">
                <RefreshCw className="animate-spin mr-1.5 w-3.5 h-3.5" /> Loading feeds...
              </div>
            ) : (
              cameras.map((cam) => {
                const isSelected = selectedCamera === cam.camera_id;
                return (
                  <div
                    key={cam.camera_id}
                    id={`cam-card-${cam.camera_id}`}
                    onClick={() => handleSelectCamera(cam.camera_id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-650/10 border-indigo-500 shadow-md shadow-indigo-500/5'
                        : 'bg-[#0f0f18] border-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-2">
                      <span className="text-slate-200">{cam.name}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="text-[8px] uppercase tracking-wider text-rose-500 font-bold">LIVE</span>
                      </div>
                    </div>

                    {/* Camera Video Frame */}
                    <div className="relative aspect-video w-full rounded overflow-hidden bg-black border border-slate-900 mb-2">
                      <CameraFeed cameraId={cam.camera_id} clean={false} alt={cam.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500">
                      <div>Zone ID: <span className="text-slate-300 font-bold">{cam.zone_id}</span></div>
                      <div>Shoppers: <span className="text-slate-300 font-bold">{cam.people_count}</span></div>
                      <div>Calibration: <span className={cam.camera_id === 'cam-entrance-001' ? 'text-emerald-400' : 'text-amber-400'}>{cam.camera_id === 'cam-entrance-001' ? 'Norm Local' : 'Uncalibrated'}</span></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
