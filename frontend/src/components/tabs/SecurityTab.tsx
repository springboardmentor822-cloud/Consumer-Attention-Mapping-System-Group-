import React from 'react';

export default function SecurityTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">🔒</span> Security Monitoring & Firewall</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl text-center"><p className="text-xs text-emerald-500 font-bold uppercase">Firewall Status</p><p className="text-xl font-bold text-emerald-400">Active</p></div>
        <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-xl text-center"><p className="text-xs text-rose-500 font-bold uppercase">Blocked IPs (24h)</p><p className="text-xl font-bold text-rose-400">14</p></div>
      </div>
      <p className="text-xs text-slate-400 font-mono bg-slate-950 p-4 rounded border border-slate-800">No anomalous authentication attempts detected on the API gateway.</p>
    </div>
  );
}