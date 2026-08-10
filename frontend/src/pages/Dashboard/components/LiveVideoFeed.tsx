import React, { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { useAuth } from '../../../contexts/AuthContext';

export function LiveVideoFeed(): JSX.Element {
  const { user } = useAuth();
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Provide the default mock store ID if user doesn't have one assigned
  const storeId = user?.store_id || '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    // Construct the websocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws/video/${storeId}`;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.frame_base64 && imgRef.current) {
          imgRef.current.src = data.frame_base64;
        }
      } catch (e) {
        console.error("Error parsing video frame", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [storeId]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/60 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <div>
          <CardTitle>Live Camera Feed</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Real-time object tracking stream</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
               LIVE
           </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex items-center justify-center overflow-hidden bg-black rounded-b-xl min-h-[300px]">
          <img 
            ref={imgRef}
            alt="Live Feed" 
            className="w-full h-full object-contain" 
          />
      </CardContent>
    </Card>
  );
}
