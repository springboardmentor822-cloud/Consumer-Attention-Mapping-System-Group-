"use client";
import React, { useEffect, useState } from 'react';

interface CameraStatusItem {
  camera_id: number;
  zone_name: string;
  status: 'online' | 'stale' | 'never_reported';
}

export default function DeviceMgmtTab() {
  const [cameras, setCameras] = useState<CameraStatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/backend/v1/dashboard/camera-status', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => { if (json.status === 'success') setCameras(json.data || []); })
      .catch((err) => console.error('Camera status fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6">Camera Fleet Management</h3>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          The camera list below is real (same source as Device Health / Camera Status). Reboot and firmware sync
          aren&apos;t real actions, though — this project&apos;s cameras are pre-recorded video files, not physical
          hardware with a reboot or firmware endpoint to call.
        </span>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-cyan-400 font-mono animate-pulse">Loading camera list...</p>
        ) : (
          cameras.map((cam) => (
            <div key={cam.camera_id} className="bg-slate-950 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-200">Camera {cam.camera_id} — {cam.zone_name}</p>
                <p className="text-xs text-slate-500">Status: {cam.status === 'online' ? 'Online' : cam.status === 'stale' ? 'Stale' : 'Never reported'}</p>
              </div>
              <button
                onClick={() => alert("Not a real action — this camera is a pre-recorded video file, not a physical device with a reboot endpoint.")}
                className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded text-xs font-bold hover:bg-amber-500/20"
              >
                Reboot Node
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
