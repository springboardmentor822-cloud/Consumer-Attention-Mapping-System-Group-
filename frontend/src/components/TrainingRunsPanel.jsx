import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  FileBox,
  Play,
  RefreshCw,
  ServerCog,
  XCircle,
} from 'lucide-react';

const ACTIVE_STATUSES = new Set(['queued', 'running']);

function statusClasses(status) {
  if (status === 'completed') return 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400';
  if (status === 'running') return 'border-teal-500/30 bg-teal-950/30 text-teal-400';
  if (status === 'queued') return 'border-amber-500/30 bg-amber-950/30 text-amber-400';
  if (status === 'failed') return 'border-red-500/30 bg-red-950/30 text-red-400';
  return 'border-slate-700 bg-slate-900/40 text-slate-400';
}

function StatusIcon({ status, className = 'h-3 w-3' }) {
  if (status === 'completed') return <CheckCircle2 className={className} />;
  if (status === 'failed') return <XCircle className={className} />;
  if (status === 'running') return <RefreshCw className={`${className} animate-spin`} />;
  return <Clock3 className={className} />;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatMetric(value) {
  if (typeof value === 'number') {
    if (Math.abs(value) > 0 && Math.abs(value) < 1) return value.toFixed(4);
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function flattenMetrics(metrics, prefix = '', depth = 0) {
  if (!metrics || typeof metrics !== 'object' || depth > 2) return [];
  return Object.entries(metrics).flatMap(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (['string', 'number', 'boolean'].includes(typeof value)) return [[label, value]];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenMetrics(value, label, depth + 1);
    }
    return [];
  });
}

function normalizeRuns(payload) {
  const runs = Array.isArray(payload) ? payload : payload?.runs ?? payload?.items ?? [];
  return runs
    .filter((run) => run && run.id)
    .sort((left, right) => new Date(right.created_at ?? 0) - new Date(left.created_at ?? 0));
}

async function requestJson(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `Training API request failed (${response.status})`);
  }
  return response.json();
}

export default function TrainingRunsPanel({ apiBase, token, storeId, theme = 'dark' }) {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    dataset_name: '',
    dataset_yaml: '',
    base_model: 'yolov8n.pt',
    epochs: 1,
    batch_size: 4,
    image_size: 640,
    device: 'cpu',
    seed: 42,
    smoke: false,
  });

  const loadRuns = useCallback(
    async ({ quiet = false } = {}) => {
      if (!storeId || !token) return;
      if (!quiet) setLoading(true);
      try {
        const payload = await requestJson(
          `${apiBase}/training/runs?store_id=${encodeURIComponent(storeId)}`,
          token,
        );
        const nextRuns = normalizeRuns(payload);
        setRuns(nextRuns);
        setSelectedRunId((current) =>
          current && nextRuns.some((run) => run.id === current) ? current : nextRuns[0]?.id ?? null,
        );
        setError('');
      } catch (requestError) {
        setError(requestError.message || 'Unable to load persisted training runs.');
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [apiBase, storeId, token],
  );

  useEffect(() => {
    setRuns([]);
    setSelectedRunId(null);
    setNotice('');
    setError('');
    loadRuns();
  }, [loadRuns]);

  const hasActiveRun = runs.some((run) => ACTIVE_STATUSES.has(String(run.status).toLowerCase()));

  useEffect(() => {
    if (!storeId || !token) return undefined;
    const interval = window.setInterval(
      () => loadRuns({ quiet: true }),
      hasActiveRun ? 2_000 : 10_000,
    );
    return () => window.clearInterval(interval);
  }, [hasActiveRun, loadRuns, storeId, token]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId],
  );

  const scalarMetrics = useMemo(() => {
    return flattenMetrics(selectedRun?.metrics);
  }, [selectedRun]);

  const runCounts = useMemo(
    () =>
      runs.reduce(
        (counts, run) => {
          const status = String(run.status).toLowerCase();
          counts[status] = (counts[status] ?? 0) + 1;
          return counts;
        },
        {},
      ),
    [runs],
  );

  async function createRun(event) {
    event.preventDefault();
    if (!storeId) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const smoke = Boolean(form.smoke);
      const payload = {
        store_id: Number(storeId),
        task: 'detection',
        dataset_name: smoke ? form.dataset_name.trim() || 'Synthetic smoke' : form.dataset_name.trim(),
        dataset_yaml: smoke ? 'synthetic://generated' : form.dataset_yaml.trim(),
        base_model: form.base_model.trim(),
        epochs: smoke ? 1 : Number(form.epochs),
        batch_size: Number(form.batch_size),
        image_size: Number(form.image_size),
        device: form.device.trim(),
        seed: Number(form.seed),
        smoke,
      };
      const response = await requestJson(`${apiBase}/training/runs`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const created = response?.run ?? response;
      if (created?.id) setSelectedRunId(created.id);
      setNotice(`Training run ${created?.id ? created.id.slice(0, 8) : ''} was accepted by the backend.`.trim());
      await loadRuns({ quiet: true });
    } catch (requestError) {
      setError(requestError.message || 'The backend rejected the training run.');
    } finally {
      setSubmitting(false);
    }
  }

  const dark = theme === 'dark';
  const panel = dark ? 'border-slate-900 bg-slate-950/35' : 'border-slate-200 bg-slate-50';
  const input = dark
    ? 'border-slate-800 bg-slate-950 text-white placeholder:text-slate-700'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400';
  const title = dark ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/60 pb-3 dark:border-slate-900">
        <div>
          <h4 className={`flex items-center gap-1.5 text-xs font-bold ${title}`}>
            <ServerCog className="h-4 w-4 text-teal-400" />
            Persisted AI Training Runs
          </h4>
          <p className="mt-1 text-[10px] text-slate-500">
            Every status, metric, and artifact below is returned by the backend training service.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[8px] font-mono uppercase">
          {['queued', 'running', 'completed', 'failed'].map((status) => (
            <span key={status} className={`rounded border px-2 py-1 ${statusClasses(status)}`}>
              {status} {runCounts[status] ?? 0}
            </span>
          ))}
        </div>
      </div>

      {(error || notice) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`flex items-start gap-2 rounded-xl border p-2.5 text-[9px] ${
            error
              ? 'border-red-500/30 bg-red-950/20 text-red-400'
              : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
          }`}
        >
          {error ? <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <form onSubmit={createRun} className={`space-y-3 rounded-xl border p-3 ${panel}`}>
          <div>
            <h5 className={`text-[10px] font-bold uppercase tracking-wider ${title}`}>Queue a real run</h5>
            <p className="mt-1 text-[8px] leading-relaxed text-slate-500">
              {form.smoke
                ? 'Smoke mode asks the backend to generate a synthetic dataset and execute exactly one plumbing epoch.'
                : 'The dataset YAML must already exist and pass backend validation. No demo metrics are generated in the browser.'}
            </p>
          </div>

          <label className="block text-[9px] text-slate-500">
            Task
            <input
              value="Person / product detection"
              disabled
              className={`mt-1 w-full rounded-lg border p-2 opacity-75 ${input}`}
            />
            <span className="mt-1 block text-[8px] leading-relaxed text-slate-500">
              Gaze is implemented as calibrated head-pose geometry. Gaze training is disabled because no labeled gaze dataset is configured.
            </span>
          </label>

          <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 ${dark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'}`}>
            <input
              type="checkbox"
              checked={form.smoke}
              onChange={(event) => {
                const smoke = event.target.checked;
                setForm((current) => ({
                  ...current,
                  smoke,
                  dataset_name: smoke && !current.dataset_name.trim() ? 'Synthetic smoke' : current.dataset_name,
                  epochs: smoke ? 1 : current.epochs,
                }));
              }}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-500/30"
            />
            <span>
              <strong className={`block text-[9px] ${title}`}>One-epoch synthetic plumbing smoke</strong>
              <span className="mt-0.5 block text-[8px] leading-relaxed text-slate-500">
                Exercises the real training API and artifact pipeline with backend-generated synthetic data; it is not a quality benchmark.
              </span>
            </span>
          </label>

          <label className="block text-[9px] text-slate-500">
            Dataset name
            <input
              required={!form.smoke}
              value={form.dataset_name}
              onChange={(event) => setForm((current) => ({ ...current, dataset_name: event.target.value }))}
              placeholder={form.smoke ? 'Synthetic smoke' : 'Annotated retail dataset'}
              className={`mt-1 w-full rounded-lg border p-2 outline-none focus:border-teal-500/60 ${input}`}
            />
          </label>

          <label className="block text-[9px] text-slate-500">
            Dataset YAML path
            <input
              required={!form.smoke}
              value={form.dataset_yaml}
              onChange={(event) => setForm((current) => ({ ...current, dataset_yaml: event.target.value }))}
              placeholder={form.smoke ? 'synthetic://generated' : 'datasets/retail/data.yaml'}
              disabled={form.smoke}
              className={`mt-1 w-full rounded-lg border p-2 font-mono outline-none focus:border-teal-500/60 disabled:cursor-not-allowed disabled:opacity-60 ${input}`}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[9px] text-slate-500">
              Base model
              <input
                required
                value={form.base_model}
                onChange={(event) => setForm((current) => ({ ...current, base_model: event.target.value }))}
                className={`mt-1 w-full rounded-lg border p-2 font-mono outline-none focus:border-teal-500/60 ${input}`}
              />
            </label>
            <label className="block text-[9px] text-slate-500">
              Device
              <input
                required
                value={form.device}
                onChange={(event) => setForm((current) => ({ ...current, device: event.target.value }))}
                className={`mt-1 w-full rounded-lg border p-2 font-mono outline-none focus:border-teal-500/60 ${input}`}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['epochs', 'Epochs', 1, 500],
              ['batch_size', 'Batch', 1, 256],
              ['image_size', 'Image size', 128, 2048],
              ['seed', 'Seed', 0, 2147483647],
            ].map(([key, label, min, max]) => (
              <label key={key} className="block text-[9px] text-slate-500">
                {label}
                <input
                  type="number"
                  required
                  min={min}
                  max={max}
                  value={key === 'epochs' && form.smoke ? 1 : form[key]}
                  disabled={key === 'epochs' && form.smoke}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className={`mt-1 w-full rounded-lg border p-2 font-mono outline-none focus:border-teal-500/60 disabled:cursor-not-allowed disabled:opacity-60 ${input}`}
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || !storeId}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-500 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {submitting ? 'Submitting…' : form.smoke ? 'Run plumbing smoke' : 'Submit training run'}
          </button>
        </form>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_1fr]">
          <div className={`flex min-h-[330px] flex-col rounded-xl border ${panel}`}>
            <div className="flex items-center justify-between border-b border-slate-800/70 p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Backend history</span>
              <button
                type="button"
                onClick={() => loadRuns()}
                disabled={loading}
                className="rounded-md border border-slate-700/70 p-1 text-slate-400 hover:border-teal-500/50 hover:text-teal-400 disabled:opacity-50"
                title="Refresh training runs"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto p-2 custom-scrollbar">
              {runs.map((run) => {
                const status = String(run.status).toLowerCase();
                return (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setSelectedRunId(run.id)}
                    className={`w-full rounded-lg border p-2 text-left transition ${
                      selectedRun?.id === run.id
                        ? 'border-teal-500/50 bg-teal-950/20'
                        : dark
                          ? 'border-slate-900 bg-slate-950/30 hover:border-slate-700'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className={`truncate text-[9px] ${title}`}>{run.dataset_name}</strong>
                      <span className={`inline-flex items-center gap-1 rounded border px-1 py-0.5 text-[7px] uppercase ${statusClasses(status)}`}>
                        <StatusIcon status={status} className="h-2 w-2" /> {status}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-[7px] text-slate-500">
                      <span className="font-mono">{String(run.id).slice(0, 8)}</span>
                      <span>{formatDate(run.created_at)}</span>
                    </div>
                  </button>
                );
              })}
              {!runs.length && !loading && (
                <div className="grid h-full min-h-[220px] place-items-center p-4 text-center text-[9px] text-slate-500">
                  <div>
                    <Database className="mx-auto mb-2 h-5 w-5 text-slate-700" />
                    No persisted training runs were returned for this store.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`min-h-[330px] rounded-xl border p-3 ${panel}`}>
            {selectedRun ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[8px] font-mono text-slate-500">{selectedRun.id}</span>
                    <h5 className={`mt-0.5 text-xs font-bold ${title}`}>{selectedRun.dataset_name}</h5>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {(selectedRun.smoke || selectedRun.smoke_run || selectedRun.config?.smoke) && (
                      <span className="inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-2 py-1 text-[8px] font-bold uppercase text-indigo-300">
                        Synthetic smoke
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[8px] font-bold uppercase ${statusClasses(String(selectedRun.status).toLowerCase())}`}>
                      <StatusIcon status={String(selectedRun.status).toLowerCase()} />
                      {selectedRun.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] md:grid-cols-3">
                  {[
                    ['Task', selectedRun.task],
                    ['Base model', selectedRun.base_model],
                    ['Device', selectedRun.device],
                    ['Seed', selectedRun.seed],
                    ['Batch', selectedRun.batch_size],
                    ['Image size', selectedRun.image_size],
                  ].map(([label, value]) => (
                    <div key={label} className={`rounded-lg border p-2 ${dark ? 'border-slate-900 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
                      <span className="block text-[7px] uppercase tracking-wider text-slate-500">{label}</span>
                      <strong className={`mt-0.5 block truncate font-mono ${title}`}>{value ?? '—'}</strong>
                    </div>
                  ))}
                </div>

                <div className={`rounded-lg border p-2 text-[8px] ${dark ? 'border-slate-900 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
                  <span className="block uppercase tracking-wider text-slate-500">Dataset YAML</span>
                  <span className={`mt-0.5 block break-all font-mono ${title}`}>{selectedRun.dataset_yaml || '—'}</span>
                </div>

                <div>
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>Epoch progress</span>
                    <strong className="font-mono text-teal-400">
                      {selectedRun.current_epoch ?? 0} / {selectedRun.epochs ?? 0}
                    </strong>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, ((selectedRun.current_epoch ?? 0) / Math.max(1, selectedRun.epochs ?? 1)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Reported metrics</span>
                  {scalarMetrics.length ? (
                    <div className="mt-1.5 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {scalarMetrics.map(([key, value]) => (
                        <div key={key} className={`rounded-lg border p-2 ${dark ? 'border-slate-900 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
                          <span className="block truncate text-[7px] uppercase tracking-wider text-slate-500">{key.replaceAll('_', ' ')}</span>
                          <strong className={`mt-0.5 block font-mono text-[10px] ${title}`}>{formatMetric(value)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 rounded-lg border border-dashed border-slate-700/60 p-3 text-center text-[8px] text-slate-500">
                      The backend has not reported scalar metrics for this run.
                    </p>
                  )}
                </div>

                {selectedRun.artifact_path && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-2 text-[8px] text-emerald-400">
                    <FileBox className="mt-0.5 h-3 w-3 shrink-0" />
                    <div className="min-w-0">
                      <strong className="block uppercase tracking-wider">Persisted artifact</strong>
                      <span className="mt-0.5 block break-all font-mono">{selectedRun.artifact_path}</span>
                    </div>
                  </div>
                )}

                {selectedRun.error_message && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-2 text-[8px] text-red-400">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{selectedRun.error_message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1 border-t border-slate-800/60 pt-2 text-[7px] text-slate-500 md:grid-cols-3">
                  <span>Created: {formatDate(selectedRun.created_at)}</span>
                  <span>Started: {formatDate(selectedRun.started_at)}</span>
                  <span>Completed: {formatDate(selectedRun.completed_at)}</span>
                </div>
              </div>
            ) : (
              <div className="grid h-full min-h-[300px] place-items-center text-center text-[9px] text-slate-500">
                <div>
                  <ServerCog className="mx-auto mb-2 h-6 w-6 text-slate-700" />
                  Select a persisted run to inspect backend status and metrics.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
