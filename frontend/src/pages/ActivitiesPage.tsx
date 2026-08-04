import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface ActiveDot {
  id: string;
  x: number;
  y: number;
  gaze: string | null;
  age: number;
  zoneId: number;
}

interface ActivitiesPageProps {
  storeId: string;
  token: string | null;
}

export default function ActivitiesPage({ storeId, token }: ActivitiesPageProps) {
  const [activeDots, setActiveDots] = useState<ActiveDot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(false);

    const ws = new WebSocket(`ws://localhost:8000/api/ws/${storeId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "COORDINATES") {
          const { shopper_id, x, y, gaze_facing_shelf_id, zone_id } = payload;
          
          setActiveDots(prev => {
            const list = prev.filter(dot => dot.id !== shopper_id);
            list.push({ id: shopper_id, x, y, gaze: gaze_facing_shelf_id, age: Date.now(), zoneId: zone_id });
            return list;
          });
        }
      } catch (err) {
        console.error("WS error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [storeId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDots(prev => prev.filter(dot => Date.now() - dot.age < 5000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Loading Event log...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-400" /> Live Store Activities
          </h1>
          <p className="text-xs text-slate-400 mt-1">Chronological customer activities list mapped from live tracking coordinates</p>
        </div>
      </div>

      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Live Activity timeline</span>
        
        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-850">
          {activeDots.map((dot) => (
            <div key={dot.id} className="relative pl-8 text-xs font-semibold">
              <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full border-4 border-[#121218]"></div>
              <div className="bg-[#0f0f18] border border-slate-850 p-3 rounded-lg max-w-2xl shadow-sm">
                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                  <span className="font-bold uppercase tracking-wider text-indigo-400">ACTIVE DETECTIONS</span>
                  <span>{new Date(dot.age).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-250">
                  Shopper <span className="text-indigo-400">#{dot.id}</span> is inside <span className="text-slate-100 font-bold">Zone {dot.zoneId}</span> 
                  {dot.gaze ? ` and gaze mapped directly to shelf: ${dot.gaze}` : " looking at displays"}
                </p>
              </div>
            </div>
          ))}
          {activeDots.length === 0 && (
            <div className="p-6 text-center text-slate-500">No active customer tracking events registered in the last 5 seconds.</div>
          )}
        </div>
      </div>
    </div>
  );
}
