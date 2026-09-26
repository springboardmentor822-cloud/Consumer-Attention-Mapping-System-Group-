"use client";
import React, { useEffect, useState } from 'react';

interface TopEndpoint { endpoint: string; count: number; }
interface ApiPerfData {
  has_data: boolean;
  message?: string;
  sample_count?: number;
  avg_ms: number;
  p99_ms: number;
  error_rate_pct: number;
  top_endpoints: TopEndpoint[];
}

export default function ApiPerformanceTab() {
  const [data, setData] = useState<ApiPerfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = () => {
      fetch('/api/backend/v1/dashboard/api-performance', { credentials: 'include' })
        .then(async (res) => {
          if (res.status === 403) throw new Error("This screen is Administrator-only.");
          if (!res.ok) throw new Error(`Request failed (${res.status}).`);
          return res.json();
        })
        .then((json) => { if (isMounted && json.status === 'success') { setData(json); setError(null); } })
        .catch((err) => { if (isMounted) setError(err.message); })
        .finally(() => { if (isMounted) setLoading(false); });
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">⚡</span> API Performance & Latency</h3>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-rose-300">{error}</div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-emerald-300 flex items-start gap-2">
          <span>✅</span>
          <span>
            Real request-latency instrumentation is active (main.py middleware) — every request but MJPEG camera
            streams is timed. Stats reset on server restart{data?.sample_count ? ` — based on the last ${data.sample_count.toLocaleString()} requests` : ''}.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 uppercase mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold text-emerald-400">{loading ? '…' : data?.has_data ? `${data.avg_ms}ms` : '—'}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 uppercase mb-1">99th Percentile</p>
          <p className="text-3xl font-bold text-amber-400">{loading ? '…' : data?.has_data ? `${data.p99_ms}ms` : '—'}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 uppercase mb-1">Error Rate (5xx)</p>
          <p className="text-3xl font-bold text-slate-200">{loading ? '…' : data?.has_data ? `${data.error_rate_pct}%` : '—'}</p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-300 text-sm mb-4">Top Endpoints (by request count, this server run)</h4>
        {loading ? (
          <p className="text-xs text-slate-500 animate-pulse">Loading...</p>
        ) : !data?.has_data ? (
          <p className="text-xs text-slate-500">{data?.message || 'No requests recorded yet.'}</p>
        ) : (
          <div className="space-y-2 font-mono text-xs">
            {data.top_endpoints.map((ep, i) => (
              <div key={i} className="flex justify-between"><span className="text-cyan-400">{ep.endpoint}</span><span className="text-slate-400">{ep.count.toLocaleString()} req</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
