import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

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
  
  const storeId = user?.store_id || 'test-store-id';

  useEffect(() => {
    if (canvasRef.current && !heatRef.current) {
      heatRef.current = new SimpleHeat(canvasRef.current);
    }
    
    // Setup WebSocket
    const wsUrl = `ws://localhost:8000/api/ws/tracking/${storeId}`;
    let ws: WebSocket | null = null;
    
    const connectWs = () => {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => setConnectionStatus('connected');
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setTimeout(connectWs, 3000); // Reconnect loop
      };
      
      const shopperPositions = new Map<string, {x: number, y: number, time: number}>();
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (heatRef.current && canvasRef.current) {
            // Map percentages to canvas pixels
            const px = (data.x / 100) * canvasRef.current.width;
            const py = (data.y / 100) * canvasRef.current.height;
            
            // Add point to heatmap
            heatRef.current.add([px, py, 1]);
            
            // Trim data periodically
            if (heatRef.current.data.length > 3000) {
              heatRef.current.data = heatRef.current.data.slice(-1500);
            }
            
            // Request animation frame for smooth drawing
            requestAnimationFrame(() => heatRef.current?.draw());
          }
          
          // Track active shoppers
          const now = Date.now();
          shopperPositions.set(data.shopper_id, { x: data.x, y: data.y, time: now });
          
          // Clean up old shoppers (not seen in 5 seconds)
          let activeCount = 0;
          let anomalies = 0;
          for (const [id, pos] of shopperPositions.entries()) {
            if (now - pos.time > 5000) {
              shopperPositions.delete(id);
            } else {
              activeCount++;
              // If multiple shoppers are clustered tightly, we could count anomalies
              // This is a naive anomaly detection for demonstration
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
      if (ws) ws.close();
    };
  }, [storeId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Live Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : connectionStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
              {connectionStatus === 'connected' ? 'Streaming' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Shoppers (Live)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <Users className="w-6 h-6 mr-3 text-blue-500" />
              {activeShoppers}
            </div>
          </CardContent>
        </Card>

        <Card className={anomalyCount > 0 ? "border-red-500 bg-red-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bottleneck Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <AlertTriangle className={`w-6 h-6 mr-3 ${anomalyCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
              {anomalyCount > 0 ? (
                <span className="text-red-600 dark:text-red-400">{anomalyCount} Alerts</span>
              ) : (
                "Normal Traffic"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Traffic Heatmap</CardTitle>
              <CardDescription>Real-time visualization of shopper density using AI stream processing.</CardDescription>
            </div>
            <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10">
              WebSockets Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center items-center" style={{ minHeight: '600px' }}>
            {/* Store Layout Background (Simulated) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ 
                   backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                   backgroundSize: '50px 50px' 
                 }}>
            </div>
            
            {/* Shelf Outlines */}
            <div className="absolute top-[20%] left-[20%] w-[20%] h-[15%] border-2 border-slate-700 bg-slate-800/50 rounded flex items-center justify-center text-xs text-slate-500 font-mono">AISLE 1</div>
            <div className="absolute top-[20%] left-[60%] w-[20%] h-[15%] border-2 border-slate-700 bg-slate-800/50 rounded flex items-center justify-center text-xs text-slate-500 font-mono">AISLE 2</div>
            <div className="absolute bottom-[20%] left-[40%] w-[20%] h-[10%] border-2 border-slate-700 bg-slate-800/50 rounded flex items-center justify-center text-xs text-slate-500 font-mono">CHECKOUT</div>
            
            {/* Heatmap Layer */}
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={600} 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 opacity-80 mix-blend-screen"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
