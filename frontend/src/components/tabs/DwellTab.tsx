"use client";
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TabTitle = "Dwell Time Analysis";
const MetricLabel = "Average Dwell Seconds (Live Camera Tracking)";

interface TrendPoint {
  time: string;
  value: number;
}

interface ZoneBreakdown {
  zone: string;
  avg_dwell: number;
  sessions: number;
}

interface DwellData {
  has_data: boolean;
  message?: string;
  trend: TrendPoint[];
  peak_avg: number;
  overall_avg: number;
  bounce_rate: number;
  zone_breakdown: ZoneBreakdown[];
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
      <p className="text-cyan-400 font-bold">{payload[0].value}s avg dwell</p>
    </div>
  );
}

export default function DwellTab() {
  const [data, setData] = useState<DwellData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDwell = () => {
      fetch('http://127.0.0.1:9000/api/v1/dashboard/dwell')
        .then(res => res.json())
        .then(json => {
          if (isMounted && json.status === "success") {
            setData(json.data);
          }
        })
        .catch(err => console.error("Dwell fetch error:", err))
        .finally(() => { if (isMounted) setLoading(false); });
    };

    fetchDwell();
    // Poll every 10s — this is real tracking data that accumulates as camera
    // feeds run, not a static array, so it's worth refreshing periodically.
    const interval = setInterval(fetchDwell, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const hasData = data?.has_data && data.trend.length > 0;

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Peak Avg Dwell", val: hasData ? `${data!.peak_avg}s` : "—", trend: hasData ? `${data!.total_sessions} tracked sessions` : "No sessions yet", color: "text-emerald-400" },
          { label: "Top Engagement Zone", val: hasData && data!.zone_breakdown[0] ? data!.zone_breakdown[0].zone : "—", trend: hasData && data!.zone_breakdown[0] ? `${data!.zone_breakdown[0].avg_dwell}s avg` : "Awaiting camera data", color: "text-cyan-400" },
          { label: "Bounces (Under 5s)", val: hasData ? `${data!.bounce_rate}%` : "—", trend: "Of all tracked sessions", color: "text-rose-400" }
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
            <p className="text-xs text-slate-400 mt-1">
              Real data from the server-side YOLOv8 + IOU tracker — hourly average of completed shopper session durations.
            </p>
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
              Loading dwell telemetry...
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <span className="text-slate-400 text-sm">
                {data?.message || "No completed shopper sessions yet."}
              </span>
              <span className="text-slate-600 text-xs mt-2">
                Open the Cameras tab to start live tracking — this chart populates as people leave camera frame.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data!.trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dwellGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#dwellGradient)"
                  dot={{ r: 5, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Zone Breakdown */}
      {hasData && data!.zone_breakdown.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 mb-4">Per-Zone Dwell Breakdown</h3>
          <div className="space-y-3">
            {data!.zone_breakdown.map((z, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
                <span className="text-sm font-bold text-slate-300">{z.zone}</span>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-slate-500">{z.sessions} sessions</span>
                  <span className="text-amber-400 font-bold">{z.avg_dwell}s avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
