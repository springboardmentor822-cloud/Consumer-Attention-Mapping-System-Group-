import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';

interface Zone {
  id: string;
  zone_name: string;
  coordinates: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
}

export function LiveStoreHeatmap(): JSX.Element {
  const { user } = useAuth();
  const storeId = user?.store_id || '00000000-0000-0000-0000-000000000000';
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>("Connecting...");
  const [activeShoppers, setActiveShoppers] = useState<number>(0);
  const [zones, setZones] = useState<Zone[]>([]);

  // We keep track of the latest coordinates for each shopper to draw them and fade old ones
  const shoppersRef = useRef<Map<string, {x: number, y: number, lastSeen: number}>>(new Map());

  // Fetch zones from backend
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/stream/zones/${storeId}`);
        setZones(response.data);
      } catch (error) {
        console.error("Failed to fetch zones for heatmap", error);
      }
    };
    fetchZones();
  }, [storeId]);

  useEffect(() => {
    let ws: WebSocket;
    let isActive = true;
    
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const WS_URL = `${protocol}//localhost:8000/ws/tracking/${storeId}`;
      
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          if (isActive) setStatus("Connected - Live Stream Active");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Data format expected: { store_id, camera_id, shopper_id, x, y, timestamp }
            
            if (data.shopper_id && data.x !== undefined && data.y !== undefined) {
              shoppersRef.current.set(data.shopper_id, {
                x: data.x, // Assuming 0-100 percentage from our updated live_tracker
                y: data.y,
                lastSeen: Date.now()
              });
              if (isActive) setActiveShoppers(shoppersRef.current.size);
            }
          } catch (e) {
            console.error("Error parsing websocket message", e);
          }
        };

        ws.onclose = () => {
          if (isActive) {
            setStatus("Disconnected");
            setTimeout(connect, 3000);
          }
        };
        
      } catch (e) {
        if (isActive) setStatus("Connection Error");
      }
    };
    
    connect();

    return () => {
      isActive = false;
      if (ws) ws.close();
    };
  }, [storeId]);

  // Animation Loop for Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear canvas with a slight transparent black to create a trailing fade effect (heat)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'; // Matches slate-900 with transparency
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      
      // Draw store zones
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)'; // sky-500
      ctx.fillStyle = 'rgba(14, 165, 233, 0.1)'; 
      ctx.lineWidth = 1.5;
      
      zones.forEach(zone => {
        const x = (zone.coordinates.x_min / 100) * canvas.width;
        const y = (zone.coordinates.y_min / 100) * canvas.height;
        const w = ((zone.coordinates.x_max - zone.coordinates.x_min) / 100) * canvas.width;
        const h = ((zone.coordinates.y_max - zone.coordinates.y_min) / 100) * canvas.height;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
        ctx.font = '11px sans-serif';
        ctx.fillText(zone.zone_name, x + 8, y + 20);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.1)'; // reset fill
      });

      // Iterate through active shoppers
      for (const [id, shopper] of shoppersRef.current.entries()) {
        // Remove stale shoppers (not seen in 2 seconds)
        if (now - shopper.lastSeen > 2000) {
          shoppersRef.current.delete(id);
          setActiveShoppers(shoppersRef.current.size);
          continue;
        }

        // Map percentage (0-100) coordinates to Canvas dimensions
        let renderX = (shopper.x / 100) * canvas.width;
        let renderY = (shopper.y / 100) * canvas.height;

        const isProduct = id.includes('Product');

        // Draw heat dot
        ctx.beginPath();
        ctx.arc(renderX, renderY, isProduct ? 6 : 8, 0, 2 * Math.PI);
        ctx.fillStyle = isProduct ? 'rgba(234, 179, 8, 0.8)' : 'rgba(239, 68, 68, 0.8)'; // amber-500 for products, rose-500 for shoppers
        ctx.fill();
        
        // Add a glow
        ctx.beginPath();
        ctx.arc(renderX, renderY, isProduct ? 12 : 15, 0, 2 * Math.PI);
        ctx.fillStyle = isProduct ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'; 
        ctx.fill();
        
        // Label
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(id.replace("Shopper #", "#").replace("Product #", "P-"), renderX + 12, renderY + 4);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [zones]); // re-run if zones change

  // Calculate separate counts
  const shopperCount = Array.from(shoppersRef.current.keys()).filter(k => k.includes('Shopper')).length;
  const productCount = Array.from(shoppersRef.current.keys()).filter(k => k.includes('Product')).length;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/60 col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Live AI Store Heatmap & Tracking</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Real-time object tracking via YOLOv8 + ByteTrack</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1 text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 
                {productCount} Products Tracked
            </span>
            <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span> 
                {shopperCount} Active Shoppers
            </span>
            <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
                {status}
            </span>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="relative w-full max-w-3xl aspect-video bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={450} 
                className="w-full h-full object-contain"
            />
        </div>
      </CardContent>
    </Card>
  );
}
