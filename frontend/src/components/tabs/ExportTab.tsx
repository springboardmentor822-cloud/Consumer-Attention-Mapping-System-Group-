"use client";
import React, { useEffect, useState } from 'react';

interface ExportMetricOption {
  metric: string;
  label: string;
}

// Short, honest description per metric — purely cosmetic (the server does
// not use these), shown so people know what they're about to download.
const METRIC_DESCRIPTIONS: Record<string, string> = {
  all: 'Product categories + raw shopper telemetry combined',
  products: 'Units sold, revenue, avg price & customer rating — from the sales CSV',
  telemetry: 'Completed camera-tracked sessions',
  dwell: 'Per-zone average dwell time + session counts',
  behavior: 'Hourly pause-event counts (engagement proxy)',
  shelves: 'Per-zone engagement scores, normalized 0-100',
  segmentation: 'K-Means clusters from transaction data',
  visitors: 'Gender + membership type breakdown',
  journey: 'Real cross-camera shopper paths (deep_reid re-identification)',
  attractiveness: 'Weighted attention/interaction/pickup/conversion scores per category',
  users: 'Registered accounts — email + role (Administrator only, contains PII)',
};

// Module-scope, not inside the component — react-hooks/purity flags any
// call to an impure function (Date.now, Math.random, etc.) that's lexically
// inside a component's function body, even one that only ever runs from an
// event handler and never during render itself. Pulling it out here is the
// standard fix, not a workaround: the timestamp genuinely has nothing to do
// with rendering, it's just naming a downloaded file.
function buildExportFilename(metric: string, format: 'csv' | 'json'): string {
  return `cams_export_${metric}_${Date.now()}.${format}`;
}

export default function ExportTab() {
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [options, setOptions] = useState<ExportMetricOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Who am I, really? Server-verified from the session cookie — not
  // whatever the login page happened to store, which a refresh can lose.
  //
  // Previously this only checked `data.status === 'success'` and never
  // looked at res.status first — a 401 (not authenticated), a 404 (proxy
  // route missing), or a 500 all landed here with a parseable-but-wrong-
  // shaped body, so the check silently failed and role stayed null forever,
  // with nothing in the console to explain why. Now each failure mode says
  // what actually happened.
  useEffect(() => {
    let isMounted = true;
    fetch('/api/backend/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          throw new Error('Not signed in (401) — the session cookie is missing or the backend rejected it.');
        }
        if (res.status === 404) {
          throw new Error('/api/backend/auth/me returned 404 — check the Next.js rewrite for /api/backend/* is pointing at the FastAPI backend.');
        }
        if (!res.ok) {
          throw new Error(`Auth check failed with HTTP ${res.status}.`);
        }
        const data = await res.json();
        if (data.status !== 'success') {
          throw new Error(`Unexpected response from /api/auth/me: ${JSON.stringify(data)}`);
        }
        if (isMounted) setRole(data.role);
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        if (isMounted) setError(err.message);
      })
      .finally(() => { if (isMounted) setRoleLoading(false); });
    return () => { isMounted = false; };
  }, []);

  // Which exports does THIS role actually have — asked from the server
  // (EXPORT_METRICS_BY_ROLE), not a hardcoded copy here that could drift
  // out of sync with what the backend actually enforces.
  useEffect(() => {
    let isMounted = true;
    fetch('/api/backend/v1/dashboard/export/metrics', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Export metrics check failed with HTTP ${res.status}.`);
        }
        const data = await res.json();
        if (data.status === 'success' && isMounted) setOptions(data.data || []);
      })
      .catch(err => {
        console.error('Export metrics fetch failed:', err);
        if (isMounted) setError(err.message);
      })
      .finally(() => { if (isMounted) setOptionsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const handleExport = async (format: 'csv' | 'json', metric: string) => {
    const key = `${format}-${metric}`;
    setIsExporting(true);
    setPendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/backend/v1/dashboard/export?format=${format}&metric=${metric}`, { credentials: 'include' });
      if (res.status === 403) {
        const body = await res.json().catch(() => null);
        setError(body?.detail || `Your role doesn't have export access to '${metric}'.`);
        return;
      }
      if (!res.ok) throw new Error('Network response was not ok');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildExportFilename(metric, format);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data. Ensure the backend is running.');
    } finally {
      setIsExporting(false);
      setPendingKey(null);
    }
  };

  const loading = roleLoading || optionsLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
          <h3 className="text-lg font-bold text-slate-200">Data Export Engine</h3>
          {!roleLoading && role && (
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
              Signed in as {role}
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm mb-6">
          What you can export here depends on your role — enforced by the backend, not just hidden buttons. A
          Marketing Manager and an Administrator hitting the same URL for the same metric get different real
          answers, not just a different-looking screen.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-rose-300 flex items-start gap-2">
            <span>🚫</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-cyan-400 font-mono text-sm animate-pulse">Checking export permissions...</div>
        ) : options.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Your role ({role || 'unknown'}) doesn&apos;t have export access to anything yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV / Excel Export Card */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <h4 className="font-bold text-slate-100">Spreadsheet Data (CSV)</h4>
                  <p className="text-xs text-slate-500 mt-1">Compatible with Microsoft Excel & Google Sheets</p>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                {options.map((opt) => {
                  const key = `csv-${opt.metric}`;
                  return (
                    <button
                      key={key}
                      onClick={() => handleExport('csv', opt.metric)}
                      disabled={isExporting}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-600/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-left px-4 flex justify-between items-center disabled:opacity-50"
                    >
                      <span>
                        + Export {opt.label}
                        <span className="block text-[9px] font-normal text-slate-500 group-hover:text-slate-400 normal-case mt-0.5">
                          {METRIC_DESCRIPTIONS[opt.metric] || ''}
                        </span>
                      </span>
                      {isExporting && pendingKey === key && <span className="text-[9px] text-emerald-400 animate-pulse ml-2 shrink-0">exporting...</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* JSON Export Card */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl hover:border-cyan-500/30 transition-colors group">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">⚙️</span>
                <div>
                  <h4 className="font-bold text-slate-100">Developer Payload (JSON)</h4>
                  <p className="text-xs text-slate-500 mt-1">Raw nested payloads for API & database testing</p>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                {options.map((opt) => {
                  const key = `json-${opt.metric}`;
                  return (
                    <button
                      key={key}
                      onClick={() => handleExport('json', opt.metric)}
                      disabled={isExporting}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg hover:bg-cyan-600/20 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-left px-4 flex justify-between items-center disabled:opacity-50"
                    >
                      <span>+ Export {opt.label} (JSON)</span>
                      {isExporting && pendingKey === key && <span className="text-[9px] text-cyan-400 animate-pulse ml-2 shrink-0">exporting...</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && role && (
          <div className="mt-6 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-[10px] text-slate-500">
            <span className="font-bold text-slate-400">Why don&apos;t I see everything?</span> Export access is scoped per
            role on the server (EXPORT_METRICS_BY_ROLE in main.py) — e.g. raw camera telemetry and other users&apos;
            account data are Administrator/Store-Manager/Analyst domains, not exposed to Marketing Manager accounts,
            regardless of what this page renders.
          </div>
        )}
      </div>
    </div>
  );
}