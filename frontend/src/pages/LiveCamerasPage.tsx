import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Camera, Shield, RefreshCw } from 'lucide-react';

interface MonitoredCamera {
  camera_id: string;
  name: string;
  status: string;
  zone_id: number;
  zone_name?: string;
  people_count: number;
  interactions_count?: number;
  crowd_status: string;
  shelf_activity: string;
  monitored_shelves: string[];
  last_updated?: string;
}

interface LiveCamerasPageProps {
  storeId: string;
  token: string | null;
}

function CameraFeed({ cameraId, clean = false, alt = "Camera Feed" }: { cameraId: string; clean?: boolean; alt?: string }) {
  const [src, setSrc] = useState(`http://localhost:8000/api/cameras/${cameraId}/frame?clean=${clean}&t=${Date.now()}`);

  useEffect(() => {
    const timer = setInterval(() => {
      setSrc(`http://localhost:8000/api/cameras/${cameraId}/frame?clean=${clean}&t=${Date.now()}`);
    }, 150);
    return () => clearInterval(timer);
  }, [cameraId, clean]);

  return (
    <img
      src={src}
      className="w-full h-full object-cover"
      alt={alt}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="%230f0f18"/><text x="50" y="32" font-size="6" fill="%23444" text-anchor="middle">STREAM LOADING / INGESTION ACTIVE</text></svg>';
      }}
    />
  );
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

      {/* Camera Grid View (3x3 Live CCTV Matrix) */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Store Surveillance Matrix (3x3 CCTV Grid)</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cameras.map((cam) => (
            <div key={cam.camera_id} className="bg-[#0f0f18] border border-slate-850 p-4 rounded-xl flex flex-col justify-between shadow-sm hover:border-slate-700 transition duration-200">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2.5">
                <span className="text-slate-200 font-bold">{cam.name}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider ${cam.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                  {cam.status}
                </span>
              </div>
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-800 mb-3">
                {cam.status === 'Offline' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-550 text-center select-none">
                    <span className="text-[12px] font-bold text-rose-500 tracking-wider">[ NO SIGNAL ]</span>
                    <span className="text-[9px] text-slate-500 mt-1">Source unavailable</span>
                  </div>
                ) : (
                  <CameraFeed cameraId={cam.camera_id} clean={false} alt={cam.name} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 font-medium">
                <div>Zone: <span className="text-slate-200 font-bold block mt-0.5">{cam.zone_name || 'General Area'}</span></div>
                <div>Shoppers tracked: <span className="text-slate-200 font-bold block mt-0.5">{cam.people_count}</span></div>
                <div>Interactions: <span className="text-slate-200 font-bold block mt-0.5">{cam.interactions_count ?? 0}</span></div>
                <div>Last updated: <span className="text-slate-250 font-bold block mt-0.5 truncate">{cam.last_updated ? new Date(cam.last_updated).toLocaleTimeString() : 'N/A'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Camera Health status row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
