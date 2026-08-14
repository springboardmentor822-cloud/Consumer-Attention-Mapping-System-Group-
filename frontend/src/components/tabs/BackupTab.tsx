import React from 'react';

export default function BackupTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">💾</span> Database Backup & Restore</h3>
      <div className="bg-slate-950 border border-slate-700 p-5 rounded-xl mb-6">
        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Last Automated Snapshot</p>
        <p className="text-lg font-bold text-cyan-400 mb-4">Today at 03:00 AM</p>
        <div className="flex space-x-3">
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-xs font-bold transition">Trigger Manual Backup</button>
          <button className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded text-xs font-bold transition">Restore from Point</button>
        </div>
      </div>
    </div>
  );
}