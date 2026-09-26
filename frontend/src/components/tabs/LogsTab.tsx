"use client";
import React, { useEffect, useState } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  source: string;
  event_type: string;
  message: string;
  ip_address: string | null;
}

type LevelFilter = 'all' | 'ERROR' | 'INFO' | 'WARN';

export default function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  const fetchLogs = () => {
    const params = new URLSearchParams();
    if (levelFilter !== 'all') params.set('level', levelFilter);
    if (search.trim()) params.set('search', search.trim());
    fetch(`/api/backend/v1/dashboard/logs?${params.toString()}`, { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 403) throw new Error("This screen is Administrator-only.");
        if (!res.ok) throw new Error(`Request failed (${res.status}).`);
        return res.json();
      })
      .then((json) => { if (json.status === 'success') { setLogs(json.data || []); setError(null); } })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this IS the loading indicator for the debounced fetch below, there's no way to signal "a fetch is about to start" without a synchronous setState first, and it's bounded (false is always set in fetchLogs' .finally())
    setLoading(true);
    const timeout = setTimeout(fetchLogs, 300); // debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, levelFilter]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (levelFilter !== 'all') params.set('level', levelFilter);
    if (search.trim()) params.set('search', search.trim());
    window.open(`/api/backend/v1/dashboard/logs?${params.toString()}`, '_blank');
  };

  const levelStyle = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'WARN': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-200">System Activity Logs</h3>
            <p className="text-slate-400 text-sm mt-1">Real audit trail — authentication events, layout publishes, settings changes, backups.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">🔍</span>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 w-full md:w-64"
              />
            </div>
            <button onClick={handleExportCsv} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 transition">
              Export CSV
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4 text-xs text-rose-300">{error}</div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4 text-xs text-emerald-300 flex items-start gap-2">
            <span>✅</span>
            <span>Real, persisted events — not sample rows. Showing the most recent 500 matching entries.</span>
          </div>
        )}

        <div className="flex space-x-2 mb-4">
          <button onClick={() => setLevelFilter('all')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${levelFilter === 'all' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>All Events</button>
          <button onClick={() => setLevelFilter('ERROR')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${levelFilter === 'ERROR' ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'}`}>Errors Only</button>
          <button onClick={() => setLevelFilter('WARN')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${levelFilter === 'WARN' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'}`}>Warnings</button>
          <button onClick={() => setLevelFilter('INFO')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${levelFilter === 'INFO' ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400' : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'}`}>Auth / Info Events</button>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300 font-mono">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Level</th>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Event Description</th>
                <th className="p-4 font-semibold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/50 text-xs">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-cyan-400 animate-pulse">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No matching log entries.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded border ${levelStyle(log.level)}`}>{log.level}</span></td>
                    <td className="p-4 text-cyan-400">{log.source}</td>
                    <td className="p-4 text-slate-300">{log.message}</td>
                    <td className="p-4 text-slate-500 text-right">{log.ip_address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
