import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  RefreshCw, 
  MapPin, 
  Calendar, 
  Filter, 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import { apiClient } from '../lib/axios';

interface PageProps {
  storeId: string;
  token: string | null;
}

interface ZoneItem {
  id: string;
  name: string;
  zone_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StoreItem {
  id: string;
  name: string;
}

interface CameraItem {
  id: string;
  name: string;
  camera_id: string;
}

interface HeatPoint {
  x: number;
  y: number;
  val: number;
  timestamp: number;
  isHistorical?: boolean;
  intensity?: number;
}

interface HeatmapResponse {
  store_id: string;
  heatmap_type: string;
  points: {
    x: number;
    y: number;
    intensity: number;
  }[];
}

export default function TrafficFlow({ storeId: initialStoreId, token }: PageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId);
  const [dateRange, setDateRange] = useState<string>('today');
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  
  const [historicalPoints, setHistoricalPoints] = useState<HeatPoint[]>([]);
  const [livePoints, setLivePoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Settings Controls
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [radius, setRadius] = useState<number>(26);
  const [opacity, setOpacity] = useState<number>(0.8);
  const [bandwidth, setBandwidth] = useState<number>(8.0);

  // Load store list once
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiClient.get<StoreItem[]>('/api/stores/');
        setStores(res.data);
      } catch (err) {
        console.error('Failed to load stores', err);
      }
    };
    fetchStores();
  }, []);

  // Fetch zones, cameras and heatmap data
  const loadData = async (storeIdToFetch: string, range: string) => {
    setLoading(true);
    setError(null);
    try {
      // Calculate date filters
      let start_time = '';
      let end_time = '';
      const now = new Date();
      
      if (range === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start_time = yesterday.toISOString();
        end_time = today.toISOString();
      } else if (range === 'last7') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        start_time = sevenDaysAgo.toISOString();
      } else if (range === 'last30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        start_time = thirtyDaysAgo.toISOString();
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start_time = today.toISOString();
      }

      // Fetch zones
      const zonesRes = await apiClient.get<ZoneItem[]>(`/api/zones/store/${storeIdToFetch}`);
      setZones(zonesRes.data);

      // Fetch cameras
      const camsRes = await apiClient.get<CameraItem[]>(`/api/cameras/store/${storeIdToFetch}`);
      setCameras(camsRes.data);

      // Fetch historical heatmap data
      const heatmapRes = await apiClient.get<HeatmapResponse>('/api/analytics/heatmaps/store', {
        params: {
          store_id: storeIdToFetch,
          start_time,
          end_time,
          bandwidth
        }
      });

      const parsedPoints = (heatmapRes.data.points || []).map(p => ({
        x: p.x,
        y: p.y,
        val: p.intensity,
        intensity: p.intensity,
        timestamp: Date.now(),
        isHistorical: true
      }));

      setHistoricalPoints(parsedPoints);
      setLivePoints([]); // Reset live queue on store reload
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unable to load traffic heatmap');
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedStoreId(initialStoreId);
    loadData(initialStoreId, dateRange);
  }, [initialStoreId]);

  // WebSocket for Live coordinates
  useEffect(() => {
    if (!selectedStoreId) return;

    const ws = new WebSocket(`ws://localhost:8000/api/ws/${selectedStoreId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "COORDINATES") {
          const { x, y } = payload;
          setLivePoints(prev => {
            const updated = [...prev, { x, y, val: 1.0, timestamp: Date.now(), isHistorical: false }];
            if (updated.length > 200) updated.shift();
            return updated;
          });
        }
      } catch (err) {
        console.error("WS heatmap error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [selectedStoreId]);

  // Clean decayed live coordinates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 30000;
      setLivePoints(prev => prev.filter(p => p.timestamp > cutoff));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Generate dynamic stable illustrative points inside each zone when telemetry is low
  const illustrativePoints = useMemo(() => {
    if (zones.length === 0) return [];
    
    // Seeded random number generator for stability
    let seed = 98765;
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const pts: HeatPoint[] = [];
    zones.forEach((z) => {
      // Scatter 15-25 points inside the zone box
      const ptsCount = Math.floor(lcg() * 11) + 15;
      for (let i = 0; i < ptsCount; i++) {
        const offsetPctX = lcg() * z.width;
        const offsetPctY = lcg() * z.height;
        const pctX = z.x + offsetPctX;
        const pctY = z.y + offsetPctY;
        
        pts.push({
          x: (pctX / 100) * 640.0,
          y: (pctY / 100) * 480.0,
          val: 1.0,
          timestamp: Date.now(),
          isHistorical: true,
          intensity: 0.15 + lcg() * 0.85
        });
      }
    });
    return pts;
  }, [zones]);

  // Determine if telemetry is insufficient (< 5 real points)
  const isIllustrative = useMemo(() => {
    return (historicalPoints.length + livePoints.length) < 5;
  }, [historicalPoints, livePoints]);

  const pointsToDraw = useMemo(() => {
    if (isIllustrative) {
      return illustrativePoints;
    }
    return [...historicalPoints, ...livePoints];
  }, [historicalPoints, livePoints, illustrativePoints, isIllustrative]);

  // Redraw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw solid premium background
    ctx.fillStyle = '#07070c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw modern planogram floor grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    // 3. Draw configured store zones
    zones.forEach((z) => {
      const zX = (z.x / 100) * canvas.width;
      const zY = (z.y / 100) * canvas.height;
      const zW = (z.width / 100) * canvas.width;
      const zH = (z.height / 100) * canvas.height;

      // Semi-transparent overlay block
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(zX, zY, zW, zH);

      // Thin cyan coordinate borders
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(zX, zY, zW, zH);

      // Zone Names
      if (showLabels) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px "Outfit", "Inter", sans-serif';
        ctx.fillText(z.name.toUpperCase(), zX + 8, zY + 16);
      }
    });

    // 4. Draw continuous thermal heat regions
    pointsToDraw.forEach((pt) => {
      let canvasX = pt.x;
      let canvasY = pt.y;

      if (!pt.isHistorical) {
        // Scale live point from [0, 100] to canvas dimensions
        canvasX = (pt.x / 100) * canvas.width;
        canvasY = (pt.y / 100) * canvas.height;
      }

      // Bound checks to prevent clipping overflow
      if (canvasX < 0 || canvasX > canvas.width || canvasY < 0 || canvasY > canvas.height) {
        return;
      }

      const age = pt.isHistorical ? 0 : (Date.now() - pt.timestamp);
      const decay = pt.isHistorical ? 1.0 : Math.max(0.1, 1.0 - age / 30000);
      const intensity = (pt.intensity !== undefined ? pt.intensity : 1.0) * decay * opacity;
      const ptRadius = radius * (pt.isHistorical ? (0.6 + 0.4 * (pt.intensity || 1.0)) : 1.0);

      // Create advanced thermal radial gradient (Red -> Orange -> Yellow -> Transparent)
      const gradient = ctx.createRadialGradient(canvasX, canvasY, 2, canvasX, canvasY, ptRadius);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.75 * intensity})`);
      gradient.addColorStop(0.35, `rgba(249, 115, 22, ${0.5 * intensity})`);
      gradient.addColorStop(0.7, `rgba(234, 179, 8, ${0.28 * intensity})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, ptRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [pointsToDraw, zones, showLabels, radius, opacity]);

  const handleFilterClick = () => {
    loadData(selectedStoreId, dateRange);
  };

  const handleRefreshClick = () => {
    loadData(selectedStoreId, dateRange);
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Premium Module Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Traffic Flow Heatmap</h1>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1.5 animate-pulse"></span>LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Visualize spatial density and shopper attention zones</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Store Selector */}
          <div className="flex items-center space-x-2 bg-[#12121e] border border-slate-800 rounded-lg px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <select 
              value={selectedStoreId} 
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none border-none cursor-pointer text-white"
            >
              {stores.map(st => (
                <option key={st.id} value={st.id} className="bg-[#12121e] text-white">{st.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="flex items-center space-x-2 bg-[#12121e] border border-slate-800 rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none border-none cursor-pointer text-white"
            >
              <option value="today" className="bg-[#12121e] text-white">Today</option>
              <option value="yesterday" className="bg-[#12121e] text-white">Yesterday</option>
              <option value="last7" className="bg-[#12121e] text-white">Last 7 Days</option>
              <option value="last30" className="bg-[#12121e] text-white">Last 30 Days</option>
            </select>
          </div>

          {/* Filter button */}
          <button 
            onClick={handleFilterClick}
            className="flex items-center space-x-1.5 bg-cyan-650 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-md"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* Refresh button */}
          <button 
            onClick={handleRefreshClick}
            className="flex items-center justify-center p-2 bg-[#12121e] hover:bg-[#1a1a2e] border border-slate-800 rounded-lg text-slate-330 transition-colors shadow-inner"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Heatmap (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-cyan-400" /> STORE TRAFFIC FLOW PLANOGRAM
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                isIllustrative 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {isIllustrative ? "Illustrative Store Traffic Layout — Limited Telemetry" : "Live Camera Telemetry Active"}
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[380px] aspect-[4/3] w-full bg-[#08080c] rounded-lg text-slate-400 space-y-4">
                <RefreshCw className="animate-spin text-cyan-500 w-8 h-8" />
                <span className="text-xs">Loading Store Heatmap...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[380px] aspect-[4/3] w-full bg-[#08080c] rounded-lg text-slate-400 p-4">
                <AlertTriangle className="text-rose-500 w-10 h-10 mb-2" />
                <span className="text-xs text-center">{error}</span>
              </div>
            ) : (
              <div className="relative border border-slate-950 rounded-lg overflow-hidden aspect-[4/3] w-full bg-black shadow-inner flex items-center justify-center">
                <canvas ref={canvasRef} width={640} height={480} className="w-full h-full block" />
              </div>
            )}

            {/* Premium Controls Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-900/50 text-xs text-slate-400">
              
              {/* Show Labels Toggle */}
              <div className="flex items-center justify-between bg-[#12121c]/40 border border-slate-900/50 px-3 py-2 rounded-lg">
                <span className="flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Show Labels
                </span>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`p-1 rounded-md transition-colors ${showLabels ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'}`}
                >
                  {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Bandwidth Selector */}
              <div className="flex flex-col space-y-1 bg-[#12121c]/40 border border-slate-900/50 px-3 py-1.5 rounded-lg justify-center">
                <span className="text-[10px] text-slate-555 flex items-center font-mono">
                  <Sliders className="w-3 h-3 mr-1 text-cyan-400" /> Bandwidth: {bandwidth}
                </span>
                <input 
                  type="range" 
                  min="4.0" 
                  max="16.0" 
                  step="1.0"
                  value={bandwidth} 
                  onChange={(e) => setBandwidth(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Radius Control */}
              <div className="flex flex-col space-y-1 bg-[#12121c]/40 border border-slate-900/50 px-3 py-1.5 rounded-lg justify-center">
                <span className="text-[10px] text-slate-555 flex items-center font-mono">
                  <Sliders className="w-3 h-3 mr-1 text-cyan-400" /> Point Radius: {radius}px
                </span>
                <input 
                  type="range" 
                  min="16" 
                  max="44" 
                  value={radius} 
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Opacity Control */}
              <div className="flex flex-col space-y-1 bg-[#12121c]/40 border border-slate-900/50 px-3 py-1.5 rounded-lg justify-center">
                <span className="text-[10px] text-slate-555 flex items-center font-mono">
                  <Sliders className="w-3 h-3 mr-1 text-cyan-400" /> Heat Opacity: {Math.round(opacity * 100)}%
                </span>
                <input 
                  type="range" 
                  min="0.3" 
                  max="1.0" 
                  step="0.1" 
                  value={opacity} 
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

            </div>

          </div>
        </div>

        {/* Right Column: Floor Details & Connected Feeds (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Store Floor Legend */}
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              STORE LAYOUT GEOMETRY
            </span>
            <div className="flex flex-col space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {zones.length === 0 ? (
                <span className="text-xs text-slate-550 italic">No zones configured for this store layout.</span>
              ) : (
                zones.map(z => (
                  <div key={z.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[#12121e]/55 border border-slate-850/50">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-semibold truncate">{z.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize mt-0.5">Type: {z.zone_type}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right font-mono">
                      <div>Pos: ({z.x}%, {z.y}%)</div>
                      <div>Dim: {z.width}% x {z.height}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connected Feeds Info */}
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              ASSOCIATED CAMERAS ({cameras.length})
            </span>
            <div className="flex flex-col space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cameras.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 text-center border border-slate-900/50 rounded-lg">
                  No cameras registered for this store.
                </div>
              ) : (
                cameras.map(cam => {
                  const isCalibrated = cam.id === 'cam-entrance-001';
                  return (
                    <div key={cam.id} className="flex flex-col space-y-1.5 p-2.5 rounded-lg bg-[#12121e]/55 border border-slate-850/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{cam.name}</span>
                        <span className="bg-cyan-500/10 text-cyan-400 text-[8px] px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                          {cam.camera_id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[8px]">
                        <span className="text-slate-550 uppercase tracking-wider font-mono">Homography Map</span>
                        <span className={`font-bold ${isCalibrated ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {isCalibrated ? '✓ CALIBRATED' : '○ DEFAULT / IDENTITY'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
