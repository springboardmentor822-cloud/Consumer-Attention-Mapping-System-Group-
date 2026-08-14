import React from 'react';

export default function DeviceHealthTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">💚</span> Hardware & Edge Node Health</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <h4 className="font-bold text-slate-300 mb-4">Jetson Nano Edge AI Server</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Core Temp</span><span className="text-amber-400">62°C</span></div>
            <div className="flex justify-between"><span className="text-slate-400">GPU Util</span><span className="text-emerald-400">84%</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Disk Space</span><span className="text-emerald-400">42GB Free</span></div>
          </div>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <h4 className="font-bold text-slate-300 mb-4">Camera Network Ping</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Cam 1 (192.168.1.15)</span><span className="text-emerald-400">4ms</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Cam 2 (192.168.1.16)</span><span className="text-emerald-400">5ms</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Cam 3 (192.168.1.17)</span><span className="text-rose-400">Offline</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}