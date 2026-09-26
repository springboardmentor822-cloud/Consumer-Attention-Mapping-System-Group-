"use client";
import React, { useEffect, useState } from 'react';

interface CameraStatusItem {
  camera_id: number;
  zone_name: string;
  status: 'online' | 'stale' | 'never_reported';
  seconds_since_last_frame: number | null;
}

const statusStyle = (status: string) => {
  switch (status) {
    case 'online': return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Online' };
    case 'stale': return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Stale' };
    default: return { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', label: 'Never Reported' };
  }
};

export default function DeviceHealthTab() {
  const [cameras, setCameras] = useState<CameraStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = () => {
      fetch('/api/backend/v1/dashboard/camera-status', { credentials: 'include' })
        .then(async (res) => {
          if (res.status === 403) throw new Error("This screen is Administrator-only.");
          if (!res.ok) throw new Error(`Request failed (${res.status}).`);
          return res.json();
        })
        .then((json) => { if (isMounted && json.status === 'success') { setCameras(json.data || []); setError(null); } })
        .catch((err) => { if (isMounted) setError(err.message); })
        .finally(() => { if (isMounted) setLoading(false); });
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">💚</span> Camera Node Health</h3>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-rose-300">{error}</div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
          <span>ℹ️</span>
          <span>
            This project&apos;s cameras are pre-recorded video files, not a physical IoT fleet — there&apos;s no Jetson
            Nano, no GPU, no network to ping, so a fake temperature/GPU-util/ping-latency panel would just be
            noise. What&apos;s real and shown below: whether each camera&apos;s detection loop has reported a frame
            recently. Host machine CPU/memory are real too — see the Infrastructure tab for those.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="md:col-span-2 text-center py-8 text-cyan-400 font-mono text-xs animate-pulse">Checking camera heartbeats...</div>
        ) : cameras.length === 0 ? (
          <div className="md:col-span-2 text-center py-8 text-slate-500 text-xs">No cameras configured.</div>
        ) : (
          cameras.map((cam) => {
            const s = statusStyle(cam.status);
            return (
              <div key={cam.camera_id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-300">Camera {cam.camera_id} — {cam.zone_name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Last frame: </span>
                  <span className="text-slate-200 font-mono">
                    {cam.seconds_since_last_frame === null ? 'never' : `${cam.seconds_since_last_frame}s ago`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
