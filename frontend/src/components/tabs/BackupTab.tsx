import React from 'react';

export default function BackupTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">💾</span> Database Backup & Restore</h3>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          Sample screen — there&apos;s no automated backup job configured anywhere in the backend. The SQLite database
          (cams_retail.db) is a single local file; back it up the same way you would any file until real scheduled
          backups are built.
        </span>
      </div>
      <div className="bg-slate-950 border border-slate-700 p-5 rounded-xl mb-6">
        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Last Automated Snapshot</p>
        <p className="text-lg font-bold text-cyan-400 mb-4">Not configured</p>
        <div className="flex space-x-3">
          <button onClick={() => alert("Manual backup isn't wired to real backend logic yet — see the note above.")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-xs font-bold transition">Trigger Manual Backup</button>
          <button onClick={() => alert("Restore isn't wired to real backend logic yet — see the note above.")} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded text-xs font-bold transition">Restore from Point</button>
        </div>
      </div>
    </div>
  );
}