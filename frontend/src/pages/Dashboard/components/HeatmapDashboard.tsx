import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { AlertTriangle, Users, Clock, Award, Activity, Lightbulb } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { analyticsApi, KPIStats, Recommendation } from '../../../api/analytics';

// Basic simpleheat implementation inline for zero-dependency heatmap
class SimpleHeat {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  data: Array<[number, number, number]>;
  max: number;
  r: number;
  grad: Uint8ClampedArray;
  circle: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.data = [];
    this.max = 1;
    this.r = 25; // radius
    
    // Create a color gradient
    const gradCanvas = document.createElement('canvas');
    const gradCtx = gradCanvas.getContext('2d')!;
    gradCanvas.width = 1;
    gradCanvas.height = 256;
    
    const gradient = gradCtx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0.4, 'blue');
    gradient.addColorStop(0.6, 'cyan');
    gradient.addColorStop(0.7, 'lime');
    gradient.addColorStop(0.8, 'yellow');
    gradient.addColorStop(1.0, 'red');
    
    gradCtx.fillStyle = gradient;
    gradCtx.fillRect(0, 0, 1, 256);
    this.grad = gradCtx.getImageData(0, 0, 1, 256).data;
    
    // Pre-draw the alpha circle
    this.circle = document.createElement('canvas');
    const cCtx = this.circle.getContext('2d')!;
    const r = this.r;
    const blur = 15;
    
    this.circle.width = this.circle.height = r * 2;
    cCtx.shadowOffsetX = cCtx.shadowOffsetY = r * 2;
    cCtx.shadowBlur = blur;
    cCtx.shadowColor = 'black';
    cCtx.beginPath();
    cCtx.arc(-r, -r, r - blur, 0, Math.PI * 2, true);
    cCtx.closePath();
    cCtx.fill();
  }

  add(point: [number, number, number]) {
    this.data.push(point);
    return this;
  }
  
  clear() {
    this.data = [];
    return this;
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw all points as alpha shapes
    for (let i = 0, len = this.data.length; i < len; i++) {
      const p = this.data[i];
      this.ctx.globalAlpha = Math.min(Math.max(p[2] / this.max, 0.1), 1.0);
      this.ctx.drawImage(this.circle, p[0] - this.r, p[1] - this.r);
    }

    // Colorize based on alpha
    const colored = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0, len = colored.data.length; i < len; i += 4) {
      const alpha = colored.data[i + 3];
      if (alpha) {
        const offset = alpha * 4;
        colored.data[i] = this.grad[offset];
        colored.data[i + 1] = this.grad[offset + 1];
        colored.data[i + 2] = this.grad[offset + 2];
      }
    }
    this.ctx.putImageData(colored, 0, 0);
  }
}

interface HeatmapDashboardProps {
  storeId?: string;
}

export function HeatmapDashboard({ storeId: propStoreId }: HeatmapDashboardProps = {}): JSX.Element {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<SimpleHeat | null>(null);
  const [activeShoppers, setActiveShoppers] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'live' | 'historical'>('historical');
  const [timeRange, setTimeRange] = useState<number>(720);
  
  const resolvedStoreId = propStoreId || user?.store_id || null;

  // Fetch static analytics data
  useEffect(() => {
    if (!resolvedStoreId) return;

    const fetchAnalytics = async () => {
      try {
        let kpiData = null;
        let recsData = [];
        let zonesData = [];

        try { 
          const kpiRes = await axios.get(`http://localhost:8000/api/analytics/kpis/${resolvedStoreId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          kpiData = kpiRes.data;
        } catch (e) { console.error("KPIs fail", e); }
        try { recsData = await analyticsApi.getRecommendations(resolvedStoreId); } catch (e) { console.error("Recs fail", e); }
        try { 
          const res = await fetch(`http://localhost:8000/api/stream/zones/${resolvedStoreId}`);
          if (res.ok) zonesData = await res.json();
        } catch (e) { console.error("Zones fail", e); }
        
        setKpis(kpiData);
        setRecommendations(recsData);
        setZones(zonesData);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };
    fetchAnalytics();
  }, [resolvedStoreId]);

  // Load historical heatmap
  useEffect(() => {
    if (viewMode !== 'historical' || !resolvedStoreId || !canvasRef.current) return;
    
    if (!heatRef.current) {
      heatRef.current = new SimpleHeat(canvasRef.current);
    }
    
    const fetchHistoricalHeatmap = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/analytics/heatmaps/${resolvedStoreId}?time_range_minutes=${timeRange}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = res.data;
        
        if (heatRef.current && canvasRef.current) {
          heatRef.current.clear();
          if (data.max_val) {
            heatRef.current.max(data.max_val);
          }
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          // Data points are returned in a 100x100 grid scale
          data.points.forEach((p: any) => {
            const px = (p[0] / 100) * w;
            const py = (p[1] / 100) * h;
            heatRef.current?.add([px, py, p[2] * 2]); // Boost density intensity slightly
          });
          heatRef.current.draw();
        }
      } catch (err) {
        console.error("Failed to fetch heatmap data:", err);
      }
    };
    fetchHistoricalHeatmap();
  }, [resolvedStoreId, viewMode, timeRange]);

  // Live Mode setup
  useEffect(() => {
    if (viewMode !== 'live' || !resolvedStoreId || !canvasRef.current) return;
    
    if (!heatRef.current) {
      heatRef.current = new SimpleHeat(canvasRef.current);
    }
    
    heatRef.current.clear();
    heatRef.current.clear();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws/tracking/${resolvedStoreId}`;
    let ws: WebSocket | null = null;
    let isActive = true;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => setConnectionStatus('connected');
      
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (isActive && viewMode === 'live') {
          setTimeout(connectWs, 3000);
        }
      };
      
      const shopperPositions = new Map<string, {x: number, y: number, time: number}>();
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (heatRef.current && canvasRef.current) {
            const px = (data.x / 100) * canvasRef.current.width;
            const py = (data.y / 100) * canvasRef.current.height;
            
            heatRef.current.add([px, py, 1]);
            
            if (heatRef.current.data.length > 3000) {
              heatRef.current.data = heatRef.current.data.slice(-1500);
            }
            
            requestAnimationFrame(() => heatRef.current?.draw());
          }
          
          const now = Date.now();
          shopperPositions.set(data.shopper_id, { x: data.x, y: data.y, time: now });
          
          let activeCount = 0;
          let anomalies = 0;
          for (const [id, pos] of shopperPositions.entries()) {
            if (now - pos.time > 5000) {
              shopperPositions.delete(id);
            } else {
              activeCount++;
            }
          }
          if (activeCount > 20) anomalies++;
          
          setActiveShoppers(activeCount);
          setAnomalyCount(anomalies);
          
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };
    };
    
    connectWs();
    
    return () => {
      isActive = false;
      if (ws) ws.close();
    };
  }, [resolvedStoreId, viewMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Foot Traffic KPI */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Foot Traffic</p>
                <h3 className="text-2xl font-bold text-white">{kpis ? kpis.total_foot_traffic : '...'}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dwell Time KPI */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Avg Dwell Time</p>
                <h3 className="text-2xl font-bold text-white">
                  {kpis ? `${Math.round(kpis.average_dwell_time_seconds / 60)}m ${Math.round(kpis.average_dwell_time_seconds % 60)}s` : '...'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Product KPI */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Top Attraction</p>
                <h3 className="text-xl font-bold text-white truncate w-32" title={kpis?.top_product || ''}>
                  {kpis ? kpis.top_product : '...'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Status KPI */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Live Active Shoppers</p>
                <div className="flex items-center mt-1">
                  <span className={`w-2 h-2 rounded-full mr-2 ${viewMode === 'live' && connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                  <h3 className="text-2xl font-bold text-white">
                    {viewMode === 'live' ? activeShoppers : 'Paused'}
                  </h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Main Area */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Retail Intelligence Heatmap</CardTitle>
              <CardDescription>Visualizing shopper density and attention zones.</CardDescription>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setViewMode('historical')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'historical' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Historical (24h)
              </button>
              <button 
                onClick={() => setViewMode('live')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center ${viewMode === 'live' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Live Stream
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 flex justify-center items-center" style={{ minHeight: '600px', backgroundColor: '#f8fafc' }}>
              {/* Fine Grid Background */}
              <div className="absolute inset-0 opacity-40 pointer-events-none" 
                   style={{ 
                     backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                     backgroundSize: '20px 20px' 
                   }}>
              </div>
              
              {/* Dynamic Database Zones Overlay */}
              {zones.map((zone, idx) => {
                const c = zone.coordinates || {};
                const x = c.x_min || 0;
                const y = c.y_min || 0;
                const w = (c.x_max || 100) - x;
                const h = (c.y_max || 100) - y;
                
                return (
                  <div key={idx} 
                       className="absolute border-[2px] border-slate-500/40 bg-white/10 shadow-sm flex items-center justify-center pointer-events-none z-20 overflow-hidden"
                       style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}>
                     <span className="text-slate-800 text-xs font-bold px-2 py-1 bg-white/60 rounded backdrop-blur drop-shadow-sm text-center leading-tight">
                       {zone.zone_name}
                     </span>
                  </div>
                );
              })}
              
              {/* Heatmap Layer */}
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={600} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 mix-blend-multiply opacity-80 transition-opacity duration-300"
              />

            </div>
          </CardContent>
        </Card>

        {/* Actionable Recommendations Feed */}
        <Card className="border-slate-800 bg-slate-900/80 flex flex-col h-full">
          <CardHeader className="pb-4 border-b border-slate-800">
            <CardTitle className="flex items-center text-lg">
              <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
              Optimization Insights
            </CardTitle>
            <CardDescription>AI-generated actions based on heatmap data.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 overflow-y-auto">
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${
                    rec.type === 'alert' ? 'bg-red-500/10 border-red-500/20 text-red-100' :
                    rec.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-100' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-100'
                  }`}>
                    <h4 className="font-semibold text-sm mb-1 flex items-center">
                      {rec.type === 'alert' && <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />}
                      {rec.title}
                    </h4>
                    <p className="text-xs opacity-80 leading-relaxed">{rec.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6">
                <Activity className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">Analyzing store traffic...</p>
                <p className="text-xs mt-1 opacity-60">Insights will appear here shortly.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
