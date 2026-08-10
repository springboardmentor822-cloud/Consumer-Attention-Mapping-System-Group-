import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
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

export function HeatmapDashboard(): JSX.Element {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<SimpleHeat | null>(null);
  const [activeShoppers, setActiveShoppers] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [viewMode, setViewMode] = useState<'live' | 'historical'>('historical');
  const [timeRange, setTimeRange] = useState<number>(24);
  
  const storeId = user?.store_id || 'test-store-id';

  // Fetch static analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [kpiData, recsData] = await Promise.all([
          analyticsApi.getKPIs(storeId),
          analyticsApi.getRecommendations(storeId)
        ]);
        setKpis(kpiData);
        setRecommendations(recsData);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };
    fetchAnalytics();
  }, [storeId]);

  // Load historical heatmap or set up live WS
  useEffect(() => {
    if (!canvasRef.current) return;
    
    if (!heatRef.current) {
      heatRef.current = new SimpleHeat(canvasRef.current);
    }
    
    let ws: WebSocket | null = null;
    let isActive = true;

    if (viewMode === 'historical') {
      // Fetch KDE historical heatmap data
      const fetchHistoricalHeatmap = async () => {
        try {
          const data = await analyticsApi.getHeatmap(storeId, timeRange);
          if (isActive && heatRef.current && canvasRef.current) {
            heatRef.current.clear();
            const w = canvasRef.current.width;
            const h = canvasRef.current.height;
            // Data points are returned in a 100x100 grid scale
            data.points.forEach((p) => {
              const px = (p[0] / 100) * w;
              const py = (p[1] / 100) * h;
              heatRef.current?.add([px, py, p[2]]);
            });
            heatRef.current.draw();
          }
        } catch (err) {
          console.error("Failed to fetch heatmap data:", err);
        }
      };
      fetchHistoricalHeatmap();
    } else {
      // Live Mode setup
      heatRef.current.clear();
      const wsUrl = `ws://localhost:8000/api/ws/tracking/${storeId}`;
      
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
    }
    
    return () => {
      isActive = false;
      if (ws) ws.close();
    };
  }, [storeId, viewMode, timeRange]);

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
              
              {/* Outer Walls */}
              <div className="absolute inset-4 border-[3px] border-amber-400/80 rounded-sm pointer-events-none"></div>
              <div className="absolute inset-6 border-[2px] border-slate-400/50 pointer-events-none"></div>
              
              {/* Top Section (Counters/Backroom) */}
              <div className="absolute top-6 left-6 w-[40%] h-[20%] border-b-2 border-r-2 border-slate-300 bg-slate-200/50 flex items-center justify-center">
                <span className="text-slate-400 text-sm font-semibold">1</span>
              </div>
              <div className="absolute top-6 left-[46%] w-[25%] h-[15%] border-b-2 border-slate-300 bg-slate-200/50 flex items-center justify-center">
                <span className="text-slate-400 text-sm font-semibold">5</span>
              </div>
              
              {/* Left Aisle */}
              <div className="absolute top-[30%] left-6 w-[10%] h-[35%] border-2 border-slate-400 bg-white shadow-sm flex items-center justify-center">
                <span className="text-slate-400 text-sm font-semibold">2</span>
              </div>
              
              {/* Central Aisles */}
              <div className="absolute top-[35%] left-[25%] w-[15%] h-[8%] border-2 border-slate-400 bg-white shadow-sm flex items-center justify-center">
                <span className="text-slate-400 text-sm font-semibold">3</span>
              </div>
              <div className="absolute top-[55%] left-[30%] w-[20%] h-[10%] border-2 border-slate-400 bg-white shadow-sm flex items-center justify-center">
                <span className="text-slate-400 text-sm font-semibold">4</span>
              </div>
              
              {/* Right L-Shaped Counter */}
              <div className="absolute top-[40%] right-[15%] w-[25%] h-[15%]">
                <div className="absolute bottom-0 right-0 w-full h-[40%] border-2 border-slate-400 bg-white shadow-sm"></div>
                <div className="absolute top-0 right-0 w-[15%] h-full border-2 border-slate-400 bg-white shadow-sm"></div>
                <div className="absolute top-0 left-0 w-[15%] h-full border-2 border-slate-400 bg-white shadow-sm"></div>
                <div className="absolute inset-0 flex items-center justify-center pt-2">
                  <span className="text-slate-400 text-sm font-semibold">7</span>
                </div>
              </div>
              
              {/* Bottom Entrance/Checkout Zone */}
              <div className="absolute bottom-6 left-[15%] right-[15%] h-[8%] border-t-2 border-slate-300 bg-slate-100/50 flex items-center justify-center space-x-12">
                 <div className="w-8 h-8 rounded-full border border-slate-300"></div>
                 <div className="w-8 h-8 rounded-full border border-slate-300"></div>
                 <div className="w-8 h-8 rounded-full border border-slate-300"></div>
                 <span className="text-slate-400 text-sm font-semibold ml-4">6</span>
              </div>
              
              {/* Highlight Circles */}
              <div className="absolute bottom-[20%] left-[10%] w-32 h-32 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex flex-col items-center justify-center shadow-lg">
                <span className="text-indigo-800 font-bold text-sm leading-tight text-center">Additional<br/>Space</span>
              </div>
              
              <div className="absolute bottom-[20%] right-[15%] w-28 h-28 rounded-full bg-emerald-400/30 border-2 border-emerald-400 flex flex-col items-center justify-center shadow-lg">
                <span className="text-emerald-800 font-bold text-sm leading-tight text-center">Empty<br/>Area</span>
              </div>
              
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
