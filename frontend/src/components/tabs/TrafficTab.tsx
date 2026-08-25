import React from 'react';

export default function SecurityTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">🔒</span> Security Monitoring & Firewall</h3>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          Sample screen — there&apos;s no firewall or IP-blocking logic anywhere in the backend. Auth failures aren&apos;t
          currently rate-limited or tracked per-IP; the numbers below don&apos;t reflect anything the server actually
          monitors yet.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center"><p className="text-xs text-slate-400 font-bold uppercase">Firewall Status</p><p className="text-xl font-bold text-slate-300">Not configured</p></div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center"><p className="text-xs text-slate-400 font-bold uppercase">Blocked IPs (24h)</p><p className="text-xl font-bold text-slate-300">—</p></div>
      </div>
      <p className="text-xs text-slate-400 font-mono bg-slate-950 p-4 rounded border border-slate-800">No IP-blocking or rate-limiting is currently implemented, so this can&apos;t report on it.</p>
    </div>
  );
}