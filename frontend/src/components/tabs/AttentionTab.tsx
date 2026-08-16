"use client";
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TabTitle = "Engagement Duration Analytics";
const MetricLabel = "Avg Time-in-Frame (s) — not gaze tracking";

interface TrendPoint {
  time: string;
  value: number;
}

interface DwellData {
  has_data: boolean;
  trend: TrendPoint[];
  peak_avg: number;
  overall_avg: number;
  total_sessions: number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { value: number }[];
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 font-mono mb-1">{label}</p>
      <p className="text-cyan-400 font-bold">{payload[0].value}s avg time-in-frame</p>
    </div>
  );
}

export default function AttentionTab() {
  const [data, setData] = useState<DwellData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    // Reuses the real /dashboard/dwell endpoint. This tab used to be labeled
    // "gaze duration", which isn't something the camera setup can measure —
    // the Mall/MERL feeds are overhead/downward-angle, so faces usually
    // aren't visible for real gaze estimation. Relabeled honestly below.
    fetch('/api/backend/v1/dashboard/dwell', { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.status === "success") setData(json.data);
      })
      .catch(err => console.error("Engagement fetch error:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const hasData = data?.has_data && data.trend.length > 0;

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          This was previously labeled &quot;gaze duration&quot;. Real gaze/attention-direction tracking needs a front-facing
          camera and face landmarks — the current overhead camera feeds can&apos;t measure that. What&apos;s shown here is
          real time-in-frame from the shopper tracker, a related but different signal.
        </span>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Peak Avg Time-in-Frame", val: hasData ? `${data!.peak_avg}s` : "—", trend: hasData ? `${data!.total_sessions} tracked sessions` : "No sessions yet", color: "text-emerald-400" },
          { label: "Overall Avg", val: hasData ? `${data!.overall_avg}s` : "—", trend: "Across all completed sessions", color: "text-cyan-400" },
          { label: "Gaze/Attention Tracking", val: "Unavailable", trend: "Requires front-facing camera", color: "text-rose-400" }
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{kpi.label}</h4>
            <p className={`text-3xl font-bold ${kpi.color}`}>{loading ? "..." : kpi.val}</p>
            <p className="text-xs text-slate-500 mt-2">{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Chart Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">{TabTitle} Trend</h3>
            <p className="text-xs text-slate-400 mt-1">Real data from the server-side shopper tracker.</p>
          </div>
          <div className="flex space-x-2">
            <span className="flex items-center text-[10px] font-bold text-slate-400">
              <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div> {MetricLabel}
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-cyan-400 font-mono text-sm animate-pulse">
              Loading telemetry...
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <span className="text-slate-400 text-sm">No completed shopper sessions yet.</span>
              <span className="text-slate-600 text-xs mt-2">Open the Cameras tab to start live tracking.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data!.trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="attentionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#attentionGradient)"
                  dot={{ r: 5, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
