import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, Activity } from 'lucide-react';

interface LiveVideoFeedProps {
  cameraId?: string;
  storeId?: string;
  cameraName?: string;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
}

export function LiveVideoFeed({ cameraId, storeId, cameraName, onStatusChange }: LiveVideoFeedProps): JSX.Element {
  const { user } = useAuth();
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [activeShoppers, setActiveShoppers] = useState(0);
  const lastFrameTime = useRef<number>(0);
  
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  const resolvedStoreId = storeId || user?.store_id || null;

  useEffect(() => {
    // DO NOT use 00000000-0000-0000-0000-000000000000 or connect if null
    if (!resolvedStoreId || resolvedStoreId === '00000000-0000-0000-0000-000000000000') {
      setStatus('disconnected');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws/video/${resolvedStoreId}`;
    console.log(`[LiveVideoFeed] Connection Setup -> cameraName: ${cameraName || 'Default'}, storeId: ${resolvedStoreId}, cameraId: ${cameraId || 'All'}, WebSocket URL: ${wsUrl}`);
    
    let ws: WebSocket | null = null;
    let isActive = true;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`[Camera Feed] WS OPEN -> ${wsUrl}`);
        if (isActive) setStatus('connecting'); // Don't say connected until first frame
      };
      
      ws.onclose = () => {
        console.log(`[Camera Feed] WS CLOSED`);
        if (isActive) {
          setStatus('disconnected');
          setTimeout(connectWs, 3000);
        }
      };

      let firstFrameLogged = false;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (cameraId && data.camera_id && data.camera_id !== cameraId && data.camera_id !== cameraName) {
            return;
          }
          
          if (data.frame_base64 && imgRef.current) {
            if (!firstFrameLogged) {
              console.log(`[Camera Feed] FIRST FRAME RECEIVED for store ${resolvedStoreId}, camera ${data.camera_id}`);
              firstFrameLogged = true;
            }
            imgRef.current.src = data.frame_base64;
            lastFrameTime.current = Date.now();
            if (status !== 'connected') {
              setStatus('connected');
            }
          }
        } catch (e) {
          console.error("Error parsing video frame", e);
        }
      };
    };

    connectWs();

    // Secondary websocket for tracking metadata (occupancy)
    const trackingWsUrl = `${protocol}//localhost:8000/ws/tracking/${resolvedStoreId}`;
    let trackingWs: WebSocket | null = null;
    
    const connectTrackingWs = () => {
      trackingWs = new WebSocket(trackingWsUrl);
      const shopperPositions = new Map<string, {time: number}>();
      
      trackingWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (cameraId && data.camera_id && data.camera_id !== cameraId && data.camera_id !== cameraName) {
            return;
          }
          
          const now = Date.now();
          shopperPositions.set(data.shopper_id, { time: now });
          
          let activeCount = 0;
          for (const [id, pos] of shopperPositions.entries()) {
            if (now - pos.time > 5000) {
              shopperPositions.delete(id);
            } else {
              activeCount++;
            }
          }
          setActiveShoppers(activeCount);
        } catch (e) {
          // ignore
        }
      };
    };
    
    connectTrackingWs();

    // Check for frame timeout
    const timeoutInterval = setInterval(() => {
      if (lastFrameTime.current > 0 && Date.now() - lastFrameTime.current > 3000) {
        setStatus('disconnected');
      }
    }, 1000);

    return () => {
      isActive = false;
      clearInterval(timeoutInterval);
      if (ws) ws.close();
      if (trackingWs) trackingWs.close();
    };
  }, [resolvedStoreId, cameraId]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/60 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <div>
          <CardTitle className="text-xl">{cameraName || (cameraId && !cameraId.includes('-') ? cameraId : 'CAM-01 — Live Webcam')}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Activity className="w-3 h-3" /> YOLOv8 + ByteTrack • Real-time processed stream
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
             <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold tracking-widest">
                 <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span> 
                 {status === 'connected' ? 'LIVE' : status === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
             </span>
           </div>
           
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
             <Users className="w-4 h-4 text-slate-400" />
             <span className="text-sm font-bold text-white">{activeShoppers}</span>
           </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex items-center justify-center overflow-hidden bg-black rounded-b-xl relative aspect-video" style={{ minHeight: '320px' }}>
          <img 
            ref={imgRef}
            alt="Live Feed" 
            className={`w-full h-full object-contain ${status === 'connected' ? 'block' : 'hidden'}`} 
          />
          {status !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
               <Activity className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
               <p className="text-slate-400 font-medium">Waiting for AI tracking stream...</p>
               <p className="text-slate-500 text-xs mt-2">Ensure the YOLO tracking engine is running with your webcam.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
