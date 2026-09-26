"use client";
import React, { useEffect, useState } from 'react';

interface BlockedIp {
  ip_address: string;
  retry_after_seconds: number;
}

interface SecurityStatus {
  firewall_status: string;
  currently_blocked: BlockedIp[];
  blocked_ip_count_24h: number;
  failed_attempts_24h: number;
  threshold_description: string;
}

export default function SecurityTab() {
  const [data, setData] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = () => {
      fetch('/api/backend/v1/dashboard/security', { credentials: 'include' })
        .then(async (res) => {
          if (res.status === 403) throw new Error("This screen is Administrator-only.");
          if (!res.ok) throw new Error(`Request failed (${res.status}).`);
          return res.json();
        })
        .then((json) => { if (isMounted && json.status === 'success') { setData(json); setError(null); } })
        .catch((err) => { if (isMounted) setError(err.message); })
        .finally(() => { if (isMounted) setLoading(false); });
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center"><span className="mr-2">🔒</span> Security Monitoring & Firewall</h3>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-rose-300">{error}</div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-emerald-300 flex items-start gap-2">
          <span>✅</span>
          <span>
            Real IP-based rate-limiting is active on login. {data?.threshold_description || 'Loading threshold...'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-xs text-slate-400 font-bold uppercase">Firewall Status</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{loading ? '…' : (data?.firewall_status || 'Unknown')}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-xs text-slate-400 font-bold uppercase">Blocked IPs (24h)</p>
          <p className="text-xl font-bold text-slate-300 mt-1">{loading ? '…' : (data?.blocked_ip_count_24h ?? '—')}</p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Currently Blocked (Active Right Now)</h4>
        {loading ? (
          <p className="text-xs text-slate-500 animate-pulse">Checking...</p>
        ) : !data || data.currently_blocked.length === 0 ? (
          <p className="text-xs text-slate-500">No IPs are currently blocked.</p>
        ) : (
          <div className="space-y-2">
            {data.currently_blocked.map((b, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-900 border border-rose-500/20 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-rose-400">{b.ip_address}</span>
                <span className="text-[10px] text-slate-400">unblocks in {b.retry_after_seconds}s</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500 font-mono bg-slate-950 p-3 rounded border border-slate-800 mt-4">
        Blocking is enforced on /api/auth/login server-side (main.py) — this isn&apos;t a network-level firewall, it&apos;s
        application-layer rate-limiting on failed logins specifically. Active-block state is process-local, so it
        clears on a backend restart; the 24h failed-attempt count is persisted and survives restarts.
      </p>
    </div>
  );
}
