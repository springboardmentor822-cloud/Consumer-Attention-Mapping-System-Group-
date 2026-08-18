import React from 'react';

export default function DeviceMgmtTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6">IoT Device Fleet Management</h3>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          Sample fleet entries, not connected to real devices — this project&apos;s cameras are pre-recorded video
          files (see Camera Config in System Settings), not physical IoT hardware with reboot/firmware endpoints.
        </span>
      </div>
      <div className="space-y-3">
        <div className="bg-slate-950 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
          <div><p className="font-bold text-slate-200">Jetson Nano Edge Node (Zone A)</p><p className="text-xs text-slate-500">IP: 192.168.1.10</p></div>
          <button className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded text-xs font-bold hover:bg-amber-500/20">Reboot Node</button>
        </div>
        <div className="bg-slate-950 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
          <div><p className="font-bold text-slate-200">Axis P3245-V Camera</p><p className="text-xs text-slate-500">IP: 192.168.1.15</p></div>
          <button className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded text-xs font-bold hover:bg-cyan-500/20">Sync Firmware</button>
        </div>
      </div>
    </div>
  );
}