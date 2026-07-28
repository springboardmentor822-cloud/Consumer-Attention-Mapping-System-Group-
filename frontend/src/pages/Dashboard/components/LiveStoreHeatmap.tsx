import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

// Example fallback store ID
const STORE_ID = "00000000-0000-0000-0000-000000000000";
const WS_URL = `ws://localhost:8000/ws/tracking/${STORE_ID}`;

export function LiveStoreHeatmap(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>("Connecting...");
  const [activeShoppers, setActiveShoppers] = useState<number>(0);

  // We keep track of the latest coordinates for each shopper to draw them and fade old ones
  const shoppersRef = useRef<Map<string, {x: number, y: number, lastSeen: number}>>(new Map());

  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setStatus("Connected - Live Stream Active");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Data format expected: { store_id, camera_id, shopper_id, x, y, timestamp }
          
          if (data.shopper_id && data.x !== undefined && data.y !== undefined) {
            shoppersRef.current.set(data.shopper_id, {
              x: data.x,
              y: data.y,
              lastSeen: Date.now()
            });
            setActiveShoppers(shoppersRef.current.size);
          }
        } catch (e) {
          console.error("Error parsing websocket message", e);
        }
      };

      ws.onclose = () => {
        setStatus("Disconnected");
      };
      
    } catch (e) {
      setStatus("Connection Error");
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

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
      
      // Draw enhanced blueprint store layout
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)'; // sky-500
      ctx.fillStyle = 'rgba(14, 165, 233, 0.1)'; 
      ctx.lineWidth = 1.5;
      
      const drawZone = (x: number, y: number, w: number, h: number, label: string) => {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        // Draw diagonal hatch or just simple label
        ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
        ctx.font = '11px sans-serif';
        ctx.fillText(label, x + 8, y + 20);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.1)'; // reset fill
      };

      // Main Grocery Aisles
      drawZone(100, 40, 70, 220, "Aisle 1 (Dry)");
      drawZone(210, 40, 70, 220, "Aisle 2 (Cans)");
      drawZone(320, 40, 70, 220, "Aisle 3 (Snacks)");
      
      // Perimeter Departments
      drawZone(430, 40, 220, 90, "Produce / Fresh");
      drawZone(430, 170, 220, 90, "Dairy & Deli");
      
      // Checkout Zone
      drawZone(100, 330, 300, 60, "Checkout Lanes (POS)");
      
      // Entry / Exit
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'; // emerald
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText("▼ STORE ENTRANCE", 650, 400);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'; // red
      ctx.fillText("▲ EXIT", 50, 400);

      // Iterate through active shoppers
      for (const [id, shopper] of shoppersRef.current.entries()) {
        // Remove stale shoppers (not seen in 2 seconds)
        if (now - shopper.lastSeen > 2000) {
          shoppersRef.current.delete(id);
          setActiveShoppers(shoppersRef.current.size);
          continue;
        }

        // Map YOLO normalized coordinates (0-1) to Canvas dimensions, 
        // or handle absolute pixels if the tracker sends raw pixels
        // Assuming YOLO normalized coordinates for safety, fallback to modulo if absolute
        let renderX = shopper.x;
        let renderY = shopper.y;
        
        if (renderX <= 1 && renderY <= 1) {
            renderX *= canvas.width;
            renderY *= canvas.height;
        } else {
            // If absolute, scale down to fit canvas roughly
            renderX = (renderX / 1920) * canvas.width;
            renderY = (renderY / 1080) * canvas.height;
        }

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
  }, []);

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
