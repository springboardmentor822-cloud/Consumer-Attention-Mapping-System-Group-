import React from 'react';

export default function ApiPerformanceTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">⚡</span> API Performance & Latency</h3>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          Sample values — there&apos;s no request-latency instrumentation wired up yet. Real backend response time
          isn&apos;t measured or exposed anywhere in this dashboard today.
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 uppercase mb-1">Global Response Time</p>
          <p className="text-3xl font-bold text-emerald-400">42ms</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 uppercase mb-1">99th Percentile</p>
          <p className="text-3xl font-bold text-amber-400">115ms</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 uppercase mb-1">Error Rate (5xx)</p>
          <p className="text-3xl font-bold text-slate-200">0.01%</p>
        </div>
      </div>
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-300 text-sm mb-4">Top Endpoints</h4>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between"><span className="text-cyan-400">GET /api/v1/trajectories</span><span className="text-slate-400">1.2k req/m</span></div>
          <div className="flex justify-between"><span className="text-cyan-400">POST /api/v1/inference</span><span className="text-slate-400">850 req/m</span></div>
        </div>
      </div>
    </div>
  );
}