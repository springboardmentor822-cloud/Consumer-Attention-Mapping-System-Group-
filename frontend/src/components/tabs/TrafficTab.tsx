"use client";
import React, { useEffect, useState } from 'react';
import { footfallStore } from '@/lib/footfallStore';

interface TrendPoint {
  time: string;
  value: number;
}

export default function TrafficTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset loading flag before refetching when timeFilter changes
  setLoading(true);
  fetch(`/api/backend/v1/dashboard/traffic?time_filter=${timeFilter}`, { credentials: 'include' })
    .then(res => res.json())
    .then(json => {
      if (json.status === "success") setTrend(json.data);
    })
    .catch(err => console.error("Traffic fetch error:", err))
    .finally(() => setLoading(false));
}, [timeFilter]);

  // Real live person count currently visible across camera feeds (from
  // CamerasTab's detection loop via footfallStore — only populated while
  // the Cameras tab has been opened at least once this session).
  useEffect(() => {
    const unsubscribe = footfallStore.subscribe(setLiveCount);
    return unsubscribe;
  }, []);

  const maxVal = trend.length > 0 ? Math.max(...trend.map(t => t.value), 1) : 1;
  const peakDay = trend.length > 0 ? trend.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const totalTx = trend.reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg">
          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Transactions (Shown Range)</h4>
          <p className="text-3xl font-bold text-emerald-400">{loading ? "..." : totalTx.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-2">From recorded POS data</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg">
          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Peak Day</h4>
          <p className="text-3xl font-bold text-cyan-400">{loading ? "..." : peakDay?.value ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-2">{peakDay ? peakDay.time : "No data yet"}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg">
          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Live Camera Person Count</h4>
          <p className="text-3xl font-bold text-purple-400">{liveCount}</p>
          <p className="text-xs text-slate-500 mt-2">
            {liveCount > 0 ? "Currently visible across open camera feeds" : "Open the Cameras tab for live count"}
          </p>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Transactions Per Day</h3>
            <p className="text-xs text-slate-400 mt-1">
              Real POS transaction counts grouped by date from the sales dataset — a footfall proxy, not raw video foot traffic.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-cyan-400 font-mono text-xs animate-pulse">Aggregating transaction dates...</div>
        ) : trend.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">No transaction data available.</div>
        ) : (
          <div className="flex items-end justify-between h-64 space-x-2 border-b border-slate-800 pb-2">
            {trend.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                <div
                  className="w-full bg-slate-800 hover:bg-cyan-500 transition-colors rounded-t-sm relative group cursor-pointer"
                  style={{ height: `${(point.value / maxVal) * 100}%`, minHeight: 4 }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
                    {point.value} transactions
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-2 truncate w-full text-center">{point.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
