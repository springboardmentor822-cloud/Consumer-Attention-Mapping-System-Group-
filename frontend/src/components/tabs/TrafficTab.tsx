"use client";
import React, { useEffect, useState } from 'react';

interface TrendPoint {
  time: string;
  value: number;
}

// Was previously a copy-paste of SecurityTab.tsx (wrong export name,
// firewall placeholder content) — AudienceIntelligenceTab renders this as
// its "Traffic Flow" sub-tab, so real traffic data never showed up there.
// Rebuilt against the same /dashboard/traffic endpoint UniversalAnalyticsTab
// already uses, now wired to the timeFilter prop this component receives.
export default function TrafficTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTraffic = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/v1/dashboard/traffic?time_filter=${timeFilter}`, { credentials: 'include' });
        const data = await res.json();
        if (isMounted && data.status === "success") setTrend(data.data || []);
      } catch (err) {
        console.error("Traffic fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTraffic();
    return () => { isMounted = false; };
  }, [timeFilter]);

  const total = trend.reduce((sum, p) => sum + p.value, 0);
  const peak = trend.length > 0 ? trend.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const maxVal = trend.length > 0 ? Math.max(...trend.map(t => t.value), 1) : 1;

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Store Traffic Flow</h3>
            <p className="text-xs text-slate-400 mt-1">Real daily transaction counts from the sales dataset — a POS-based footfall proxy, not camera tracking.</p>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 rounded-lg">
            Live Sync: supermarket_sales.csv
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-inner">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Transactions</p>
            <p className="text-3xl font-bold text-emerald-400">{loading ? "..." : total.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-inner">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Peak Day</p>
            <p className="text-3xl font-bold text-cyan-400">{loading ? "..." : peak ? `${peak.value}` : "—"}</p>
            <p className="text-xs text-slate-500 mt-1">{loading ? "" : peak ? peak.time : "No data yet"}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          {loading ? (
            <div className="text-center py-16 text-cyan-400 font-mono text-xs animate-pulse">Aggregating traffic data...</div>
          ) : trend.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">No transaction data available for this range.</div>
          ) : (
            <div className="flex items-end justify-between h-48 space-x-2 border-b border-slate-800 pb-2">
              {trend.map((point, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-slate-800 hover:bg-cyan-500 transition-colors rounded-t-sm relative group cursor-pointer"
                    style={{ height: `${(point.value / maxVal) * 100}%`, minHeight: 4 }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {point.value}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 truncate w-full text-center">{point.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
