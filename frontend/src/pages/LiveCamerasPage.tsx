import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Camera, Shield, RefreshCw } from 'lucide-react';

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

interface LiveCamerasPageProps {
  storeId: string;
  token: string | null;
}

export default function LiveCamerasPage({ storeId, token }: LiveCamerasPageProps) {
  const [cameras, setCameras] = useState<MonitoredCamera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCameras = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/manager/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCameras(json.live_cameras || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 8000);
    return () => clearInterval(interval);
  }, [storeId]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Loading Cameras...
    </div>
  );

  const activeCount = cameras.filter(c => c.status === 'Online').length;
  const offlineCount = cameras.length - activeCount;

  const healthData = [
    { name: 'Cameras Online', value: activeCount || 1, color: '#10b981' },
    { name: 'Cameras Offline', value: offlineCount, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Camera className="w-5 h-5 mr-2 text-indigo-400" /> Camera Hub & Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live feeds, object tracking HUDs, and camera node health statuses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Grid View (Live Feed) */}
        <div className="lg:col-span-2 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Camera Grid View (Live Feeds)</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cameras.map((cam) => (
              <div key={cam.camera_id} className="bg-[#0f0f18] border border-slate-850 p-3 rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-2">
                  <span>{cam.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${cam.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'}`}>
                    {cam.status}
                  </span>
                </div>
                <div className="relative aspect-video w-full rounded overflow-hidden bg-black border border-slate-800 mb-2">
                  <img
                    src={`http://localhost:8000/api/cameras/${cam.camera_id}/stream`}
                    className="w-full h-full object-cover"
                    alt={cam.name}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-400 bg-slate-950/40 p-2 rounded">
                  <div>Zone ID: <span className="text-slate-200 font-bold">{cam.zone_id}</span></div>
                  <div>Count: <span className="text-slate-200 font-bold">{cam.people_count}</span></div>
                  <div>Density: <span className="text-slate-200 font-bold">{cam.crowd_status}</span></div>
                  <div>Activity: <span className="text-slate-200 font-bold">{cam.shelf_activity}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart (Camera Health Status) */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <Shield className="w-4 h-4 text-cyan-400 mr-2" /> Donut Chart (Camera Health Status)
          </span>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={healthData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} label>
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '9px', marginTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
