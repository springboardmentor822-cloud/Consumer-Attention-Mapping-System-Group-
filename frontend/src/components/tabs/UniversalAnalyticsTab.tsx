"use client";
import React, { useEffect, useState } from 'react';

interface TrendPoint { time: string; value: number; }

export default function UniversalAnalyticsTab({ title }: { title: string }) {
  const [trafficTrend, setTrafficTrend] = useState<TrendPoint[]>([]);
  const [dwellAvg, setDwellAvg] = useState<number | null>(null);
  const [pauseEvents, setPauseEvents] = useState<number | null>(null);
  const [topSegmentShare, setTopSegmentShare] = useState<{ label: string; share: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const [trafficRes, dwellRes, behaviorRes, segRes] = await Promise.all([
          fetch('/api/backend/v1/dashboard/traffic', { credentials: 'include' }),
          fetch('/api/backend/v1/dashboard/dwell', { credentials: 'include' }),
          fetch('/api/backend/v1/dashboard/behavior', { credentials: 'include' }),
          fetch('/api/backend/v1/dashboard/behavioral-segments', { credentials: 'include' }),
       ]);
        const traffic = await trafficRes.json();
        if (isMounted && traffic.status === "success") setTrafficTrend(traffic.data || []);

        const dwell = await dwellRes.json();
        if (isMounted && dwell.status === "success" && dwell.data.has_data) setDwellAvg(dwell.data.overall_avg);

        const behavior = await behaviorRes.json();
        if (isMounted && behavior.status === "success" && behavior.data.has_data) setPauseEvents(behavior.data.pause_events);

        const seg = await segRes.json();
        if (isMounted && seg.status === "success" && seg.has_data && seg.data.length > 0) {
          setTopSegmentShare({ label: seg.data[0].label, share: seg.data[0].share });
        }
      } catch (err) {
        console.error("Universal Analytics fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  const maxTraffic = trafficTrend.length > 0 ? Math.max(...trafficTrend.map(t => t.value), 1) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-200">{title}</h3>
            <p className="text-slate-400 text-sm mt-1">Real metrics pulled from the dwell, behavior, traffic, and segmentation endpoints.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-inner">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Avg Dwell (Live Tracking)</p>
            <span className="text-3xl font-bold text-slate-100">{loading ? "..." : dwellAvg !== null ? `${dwellAvg}s` : "—"}</span>
            {dwellAvg === null && !loading && <p className="text-[10px] text-slate-600 mt-2">No sessions tracked yet</p>}
          </div>
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-inner">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pause Events (Engagement Proxy)</p>
            <span className="text-3xl font-bold text-slate-100">{loading ? "..." : pauseEvents !== null ? pauseEvents : "—"}</span>
            {pauseEvents === null && !loading && <p className="text-[10px] text-slate-600 mt-2">No sessions tracked yet</p>}
          </div>
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-inner">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Top Shopper Segment</p>
            <span className="text-2xl font-bold text-slate-100">{loading ? "..." : topSegmentShare ? topSegmentShare.label : "—"}</span>
            {topSegmentShare && <p className="text-[10px] text-emerald-400 mt-2">{topSegmentShare.share}% of tracked sessions</p>}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h4 className="text-sm font-bold text-slate-300 mb-6">Transactions Per Day (Real, from Sales CSV)</h4>
          {loading ? (
            <div className="text-center py-12 text-cyan-400 font-mono text-xs animate-pulse">Loading...</div>
          ) : trafficTrend.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No transaction data available.</div>
          ) : (
            <>
              <div className="flex items-end justify-between h-48 space-x-2 border-b border-slate-800 pb-2">
                {trafficTrend.map((point, i) => (
                  <div key={i} className="w-full bg-slate-800 hover:bg-cyan-500 transition-colors rounded-t-sm relative group cursor-pointer" style={{ height: `${(point.value / maxTraffic) * 100}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
                      {point.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-wider overflow-hidden">
                {trafficTrend.map((point, i) => <span key={i} className="truncate">{point.time}</span>)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
