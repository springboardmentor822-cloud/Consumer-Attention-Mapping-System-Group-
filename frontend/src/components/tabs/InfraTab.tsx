"use client";
import React, { useEffect, useState } from 'react';

export default function InfraTab() {
  const [health, setHealth] = useState({ 
    cpu: 0, memUsed: 0, memTotal: 16, memPct: 0, latency: 0, uptime: '0h 0m' 
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = () => {
      fetch('http://127.0.0.1:9000/api/v1/dashboard/system-health')
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.status === 'success') {
            setHealth({
              cpu: data.data.cpu_percent,
              memUsed: data.data.memory_used_gb,
              memTotal: data.data.memory_total_gb,
              memPct: data.data.memory_percent,
              latency: data.data.latency_ms,
              uptime: data.data.uptime
            });
          }
        })
        .catch(err => console.error("Health fetch error:", err));
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getCpuColor = (load: number) => load > 85 ? 'text-rose-400' : load > 60 ? 'text-amber-400' : 'text-emerald-400';
  const getCpuBg = (load: number) => load > 85 ? 'bg-rose-400' : load > 60 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Live Infrastructure Monitor</h3>
            <p className="text-slate-400 text-sm mt-1">Real-time telemetry for the FastAPI backend and AI processing nodes.</p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">System Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl transition-all">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">CPU Load (Host Node)</p>
            <div className="flex items-end space-x-2">
              <p className={`text-3xl font-bold ${getCpuColor(health.cpu)}`}>{health.cpu}%</p>
              <p className="text-slate-400 text-xs mb-1">Active</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${getCpuBg(health.cpu)}`} style={{ width: `${health.cpu}%` }}></div>
            </div>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl transition-all">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Memory Allocation</p>
            <div className="flex items-end space-x-2">
              <p className="text-3xl font-bold text-rose-400">{health.memUsed}</p>
              <p className="text-slate-400 text-xs mb-1">GB / {health.memTotal} GB</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-400 h-full transition-all duration-1000" style={{ width: `${health.memPct}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl transition-all">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">API Latency</p>
            <div className="flex items-end space-x-2">
              <p className="text-3xl font-bold text-cyan-400">{health.latency}</p>
              <p className="text-slate-400 text-xs mb-1">ms (avg)</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all duration-1000" style={{ width: `${health.latency > 100 ? 100 : health.latency}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl transition-all">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Server Uptime</p>
            <div className="flex items-end space-x-2">
              <p className="text-3xl font-bold text-emerald-400">Live</p>
            </div>
            <p className="text-slate-500 text-[10px] mt-3 uppercase tracking-wider">Session Runtime: {health.uptime}</p>
          </div>
        </div>

        <div className="bg-[#04080f] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-400 h-48 overflow-hidden relative shadow-inner">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-[#04080f] border-b border-slate-800 flex items-center z-10">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
              <span className="mr-2">📺</span> tail -f /var/log/visionretail.log
            </span>
          </div>
          <div className="mt-8 space-y-1.5 opacity-80">
            <p><span className="text-emerald-400">[INFO]</span> System check initialized... Network stable.</p>
            <p><span className="text-emerald-400">[INFO]</span> Connected to PostgreSQL and initialized PSUtil hardware monitors.</p>
            <p><span className="text-emerald-400">[INFO]</span> API Request: GET /api/v1/dashboard/system-health - Status: 200 OK</p>
            <p><span className="text-cyan-400">[DATA]</span> Successfully parsed supermarket_sales - Sheet1.csv</p>
          </div>
        </div>
      </div>
    </div>
  );
}