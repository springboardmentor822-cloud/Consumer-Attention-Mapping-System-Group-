"use client";
import React, { useEffect, useState } from 'react';

interface TrendPoint {
  time: string;
  value: number;
}

interface BehaviorData {
  has_data: boolean;
  message?: string;
  is_estimated?: boolean;
  estimate_basis?: string;
  pause_events: number;
  multi_pause_sessions_pct: number;
  avg_pause_duration: number;
  trend: TrendPoint[];
  total_sessions?: number;
}

export default function BehaviorTab() {
  const [data, setData] = useState<BehaviorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBehavior = () => {
      fetch('/api/backend/v1/dashboard/behavior', { credentials: 'include' })
        .then(res => res.json())
        .then(json => {
          if (isMounted && json.status === "success") setData(json.data);
        })
        .catch(err => console.error("Behavior fetch error:", err))
        .finally(() => { if (isMounted) setLoading(false); });
    };
    fetchBehavior();
    const interval = setInterval(fetchBehavior, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const hasData = data?.has_data;
  const maxTrendVal = hasData && data!.trend.length > 0 ? Math.max(...data!.trend.map(t => t.value), 1) : 1;

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">

      {/* Honesty banner — this tab reports a movement-based proxy, not literal
          action recognition (no pose/hand-tracking model is running). */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          These numbers are derived from real camera-tracked movement (pauses in shopper motion), not item-level
          action recognition. &quot;Pause events&quot; ≈ moments a tracked shopper stood still — a proxy for engagement,
          not a confirmed pickup.
        </span>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pause Events (Engagement Proxy)", val: hasData ? `${data!.pause_events}` : "—", trend: hasData ? `Across ${data!.total_sessions ?? 0} tracked sessions` : "No sessions yet", color: "text-emerald-400" },
          { label: "Multi-Pause Sessions", val: hasData ? `${data!.multi_pause_sessions_pct}%` : "—", trend: "2+ pauses in one session (revisit proxy)", color: "text-cyan-400" },
          { label: "Avg Pause Duration", val: hasData ? `${data!.avg_pause_duration}s` : "—", trend: "Per detected pause", color: "text-amber-400" }
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{kpi.label}</h4>
            <p className={`text-3xl font-bold ${kpi.color}`}>{loading ? "..." : kpi.val}</p>
            <p className="text-xs text-slate-500 mt-2">{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Pause Events by Hour</h3>
            <p className="text-xs text-slate-400 mt-1">Real movement-derived data from the server-side shopper tracker.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-cyan-400 font-mono text-xs animate-pulse">Loading behavior telemetry...</div>
        ) : !hasData || data!.trend.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">{data?.message || "No completed shopper sessions yet."}</p>
            <p className="text-slate-600 text-xs mt-2">Open the Cameras tab to start live tracking on shelf-facing feeds.</p>
          </div>
        ) : (
          <div className="flex items-end justify-between h-48 space-x-2 border-b border-slate-800 pb-2">
            {data!.trend.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-slate-800 hover:bg-cyan-500 transition-colors rounded-t-sm relative group cursor-pointer"
                  style={{ height: `${(point.value / maxTrendVal) * 100}%`, minHeight: 4 }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {point.value}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-2">{point.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
