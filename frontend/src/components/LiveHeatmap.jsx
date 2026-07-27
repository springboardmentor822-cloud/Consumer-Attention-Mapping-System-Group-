import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import simpleheat from 'simpleheat';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const MAX_LIVE_POINTS = 500;
const TRACKER_TTL_MS = 30_000;

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePoint(point) {
  if (!point || typeof point !== 'object') return null;

  const x = asNumber(point.x ?? point.x_position);
  const y = asNumber(point.y ?? point.y_position);
  if (x === null || y === null || x < 0 || x > 100 || y < 0 || y > 100) return null;

  const rawValue = asNumber(
    point.value ?? point.intensity ?? point.weight ?? point.attention_probability ?? point.confidence ?? 1,
  );

  return {
    x,
    y,
    value: Math.max(0, rawValue ?? 1),
    samples: Math.max(1, asNumber(point.samples) ?? 1),
    trackerId: point.tracker_id ?? point.trackerId ?? null,
    observedAt: point.observed_at ?? point.timestamp ?? new Date().toISOString(),
  };
}

function pointsFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload)) return payload.map(normalizePoint).filter(Boolean);

  const candidates = [
    payload.points,
    payload.heatmap?.points,
    payload.data?.points,
    payload.observations,
    payload.data?.observations,
    payload.tracking_observations,
  ];
  const collection = candidates.find(Array.isArray);
  if (collection) return collection.map(normalizePoint).filter(Boolean);

  const single = payload.observation ?? payload.data?.observation ?? payload.data;
  const normalized = normalizePoint(single);
  return normalized ? [normalized] : [];
}

function occupancyFromPayload(payload) {
  return asNumber(
    payload?.occupancy ??
      payload?.current_occupancy ??
      payload?.status?.occupancy ??
      payload?.stream_status?.occupancy ??
      payload?.data?.occupancy,
  );
}

function overcrowdingFromPayload(payload) {
  const explicit =
    payload?.overcrowded ??
    payload?.is_overcrowded ??
    payload?.status?.overcrowded ??
    payload?.stream_status?.overcrowded ??
    payload?.data?.overcrowded;
  if (typeof explicit === 'boolean') return explicit;

  const eventType = String(payload?.type ?? payload?.event ?? '').toLowerCase();
  if (eventType.includes('overcrowding_cleared') || eventType.includes('occupancy_normal')) return false;
  if (eventType.includes('overcrowd')) return true;
  return null;
}

function buildWebSocketUrl(apiBase, storeId, token) {
  const url = new URL(apiBase, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `/ws/stores/${storeId}/tracking`;
  url.search = '';
  url.searchParams.set('token', token);
  return url.toString();
}

function connectionClasses(phase) {
  if (phase === 'live') return 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300';
  if (phase === 'connecting' || phase === 'reconnecting') {
    return 'border-amber-500/30 bg-amber-950/40 text-amber-300';
  }
  return 'border-red-500/30 bg-red-950/40 text-red-300';
}

export default function LiveHeatmap({
  apiBase,
  storeId,
  token,
  enabled,
  capacity = 0,
  theme = 'dark',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const trackersRef = useRef(new Map());
  const explicitOccupancyRef = useRef(false);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [snapshot, setSnapshot] = useState({
    points: [],
    maxValue: 0,
    totalSamples: 0,
    generatedAt: null,
    windowMinutes: null,
  });
  const [livePoints, setLivePoints] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [explicitOvercrowding, setExplicitOvercrowding] = useState(null);
  const [streamStatus, setStreamStatus] = useState({
    backend: null,
    workerRunning: null,
    pendingMessages: null,
    persistedObservations: null,
  });
  const [connection, setConnection] = useState({ phase: 'idle', attempt: 0, error: '' });
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState('');
  const [connectionGeneration, setConnectionGeneration] = useState(0);

  useEffect(() => {
    setSnapshot({
      points: [],
      maxValue: 0,
      totalSamples: 0,
      generatedAt: null,
      windowMinutes: null,
    });
    setLivePoints([]);
    setSnapshotError('');
  }, [storeId]);

  const refreshSnapshot = useCallback(async () => {
    if (!enabled || !storeId || !token) return;
    setSnapshotLoading(true);
    setSnapshotError('');
    try {
      const requestOptions = { headers: { Authorization: `Bearer ${token}` } };
      const [response, statusResponse] = await Promise.all([
        fetch(`${apiBase}/stores/${storeId}/heatmap`, requestOptions),
        fetch(`${apiBase}/stores/${storeId}/stream/status`, requestOptions),
      ]);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Heatmap request failed (${response.status})`);
      }
      const payload = await response.json();
      if (statusResponse.ok) {
        const statusPayload = await statusResponse.json();
        setStreamStatus({
          backend: statusPayload.backend ?? null,
          workerRunning:
            typeof statusPayload.worker_running === 'boolean' ? statusPayload.worker_running : null,
          pendingMessages: asNumber(statusPayload.pending_messages),
          persistedObservations: asNumber(statusPayload.persisted_observations),
        });
      }
      const points = pointsFromPayload(payload);
      const derivedMax = points.reduce((max, point) => Math.max(max, point.value), 0);
      setSnapshot({
        points,
        maxValue: asNumber(payload.max_value) ?? derivedMax,
        totalSamples: asNumber(payload.total_samples) ?? points.reduce((sum, point) => sum + point.samples, 0),
        generatedAt: payload.generated_at ?? null,
        windowMinutes: asNumber(payload.window_minutes),
      });
      setLivePoints([]);
    } catch (error) {
      setSnapshotError(error.message || 'Unable to load the heatmap snapshot.');
    } finally {
      setSnapshotLoading(false);
    }
  }, [apiBase, enabled, storeId, token]);

  useEffect(() => {
    if (!enabled) return undefined;
    refreshSnapshot();
    const interval = window.setInterval(refreshSnapshot, 30_000);
    return () => window.clearInterval(interval);
  }, [enabled, refreshSnapshot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return undefined;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) });
    };
    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !storeId || !token) {
      setConnection({
        phase: token ? 'idle' : 'error',
        attempt: 0,
        error: token ? '' : 'Authentication is required for live tracking.',
      });
      return undefined;
    }

    let stopped = false;
    let reconnectTimer = null;
    let attempt = 0;

    const updateStreamStatus = (payload) => {
      const status = payload?.stream_status ?? payload?.status ?? payload?.data?.stream_status ?? payload;
      setStreamStatus((current) => ({
        backend: status?.backend ?? status?.stream_backend ?? current.backend,
        workerRunning:
          typeof status?.worker_running === 'boolean' ? status.worker_running : current.workerRunning,
        pendingMessages: asNumber(status?.pending_messages) ?? current.pendingMessages,
        persistedObservations:
          asNumber(status?.persisted_observations) ?? current.persistedObservations,
      }));
    };

    const handlePayload = (payload) => {
      const incomingPoints = pointsFromPayload(payload);
      if (incomingPoints.length) {
        const now = Date.now();
        incomingPoints.forEach((point) => {
          if (point.trackerId) trackersRef.current.set(String(point.trackerId), now);
        });
        for (const [trackerId, seenAt] of trackersRef.current.entries()) {
          if (now - seenAt > TRACKER_TTL_MS) trackersRef.current.delete(trackerId);
        }
        setLivePoints((current) => [...current, ...incomingPoints].slice(-MAX_LIVE_POINTS));
      }

      const reportedOccupancy = occupancyFromPayload(payload);
      if (reportedOccupancy !== null) {
        explicitOccupancyRef.current = true;
        setOccupancy(Math.max(0, reportedOccupancy));
      } else if (!explicitOccupancyRef.current && incomingPoints.some((point) => point.trackerId)) {
        setOccupancy(trackersRef.current.size);
      }

      const reportedOvercrowding = overcrowdingFromPayload(payload);
      if (reportedOvercrowding !== null) setExplicitOvercrowding(reportedOvercrowding);
      updateStreamStatus(payload);
    };

    const connect = () => {
      if (stopped) return;
      const phase = attempt === 0 ? 'connecting' : 'reconnecting';
      setConnection({ phase, attempt, error: '' });

      let socket;
      try {
        socket = new WebSocket(buildWebSocketUrl(apiBase, storeId, token));
      } catch (error) {
        setConnection({ phase: 'error', attempt, error: error.message });
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
        setConnection({ phase: 'live', attempt: 0, error: '' });
      };

      socket.onmessage = (event) => {
        try {
          handlePayload(JSON.parse(event.data));
        } catch (error) {
          setConnection((current) => ({ ...current, error: `Ignored invalid tracking message: ${error.message}` }));
        }
      };

      socket.onerror = () => {
        setConnection((current) => ({ ...current, error: 'Tracking socket encountered a network error.' }));
      };

      socket.onclose = (event) => {
        if (socketRef.current === socket) socketRef.current = null;
        if (stopped) return;

        if ([1008, 4401, 4403].includes(event.code)) {
          setConnection({ phase: 'error', attempt, error: 'Live tracking authorization was rejected.' });
          return;
        }

        attempt += 1;
        const delay = Math.min(15_000, 1_000 * 2 ** Math.min(attempt - 1, 4));
        setConnection({
          phase: 'reconnecting',
          attempt,
          error: `Live stream closed${event.code ? ` (${event.code})` : ''}; retrying in ${Math.round(delay / 1000)}s.`,
        });
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    trackersRef.current.clear();
    explicitOccupancyRef.current = false;
    setLivePoints([]);
    setOccupancy(null);
    setExplicitOvercrowding(null);
    setStreamStatus({
      backend: null,
      workerRunning: null,
      pendingMessages: null,
      persistedObservations: null,
    });
    connect();

    const trackerCleanup = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [trackerId, seenAt] of trackersRef.current.entries()) {
        if (now - seenAt > TRACKER_TTL_MS) {
          trackersRef.current.delete(trackerId);
          changed = true;
        }
      }
      if (changed && !explicitOccupancyRef.current) setOccupancy(trackersRef.current.size);
    }, 5_000);

    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      window.clearInterval(trackerCleanup);
      const activeSocket = socketRef.current;
      if (activeSocket) {
        try {
          activeSocket.close(1000, 'Heatmap view changed');
        } catch {
          // A socket that has not finished opening can be discarded safely here.
        }
        socketRef.current = null;
      }
    };
  }, [apiBase, connectionGeneration, enabled, storeId, token]);

  const allPoints = useMemo(() => [...snapshot.points, ...livePoints], [livePoints, snapshot.points]);
  const heatMax = useMemo(
    () => Math.max(1, snapshot.maxValue, ...allPoints.map((point) => point.value)),
    [allPoints, snapshot.maxValue],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas || !dimensions.width || !dimensions.height) return;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!allPoints.length) return;

    const heat = simpleheat(canvas);
    heat
      .data(
        allPoints.map((point) => [
          (point.x / 100) * dimensions.width,
          (point.y / 100) * dimensions.height,
          point.value,
        ]),
      )
      .max(heatMax)
      .radius(Math.max(18, Math.min(dimensions.width, dimensions.height) * 0.075), 22)
      .gradient({
        0.05: '#1d4ed8',
        0.3: '#06b6d4',
        0.55: '#facc15',
        0.78: '#f97316',
        1: '#dc2626',
      })
      .draw(0.035);
  }, [allPoints, dimensions, enabled, heatMax, theme]);

  const capacityValue = Math.max(0, asNumber(capacity) ?? 0);
  const overcrowded =
    explicitOvercrowding ?? (occupancy !== null && capacityValue > 0 ? occupancy >= capacityValue : false);
  const utilization =
    occupancy !== null && capacityValue > 0 ? Math.round((occupancy / capacityValue) * 100) : null;
  const statusLabel =
    connection.phase === 'live'
      ? 'Live'
      : connection.phase === 'reconnecting'
        ? `Reconnecting${connection.attempt ? ` · ${connection.attempt}` : ''}`
        : connection.phase === 'connecting'
          ? 'Connecting'
          : 'Offline';

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 z-[6] h-full w-full opacity-90"
        aria-label="Live shopper density heatmap"
      />

      <div
        onClick={(event) => event.stopPropagation()}
        className={`pointer-events-auto absolute left-3 top-3 z-30 max-w-[250px] rounded-xl border p-2.5 shadow-xl backdrop-blur-md ${
          theme === 'dark' ? 'border-slate-700/80 bg-slate-950/90' : 'border-slate-200 bg-white/95'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${connectionClasses(connection.phase)}`}>
            {connection.phase === 'live' ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={() => {
              refreshSnapshot();
              setConnectionGeneration((value) => value + 1);
            }}
            disabled={snapshotLoading}
            className="rounded-md border border-slate-700/70 p-1 text-slate-400 transition hover:border-teal-500/50 hover:text-teal-400 disabled:opacity-50"
            title="Refresh snapshot and reconnect"
          >
            <RefreshCw className={`h-3 w-3 ${snapshotLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span className="block text-slate-500">Occupancy</span>
            <strong className={overcrowded ? 'text-red-400' : theme === 'dark' ? 'text-white' : 'text-slate-900'}>
              {occupancy ?? '—'}{capacityValue > 0 ? ` / ${capacityValue}` : ''}
            </strong>
          </div>
          <div>
            <span className="block text-slate-500">Utilization</span>
            <strong className={overcrowded ? 'text-red-400' : 'text-teal-400'}>{utilization === null ? '—' : `${utilization}%`}</strong>
          </div>
          <div>
            <span className="block text-slate-500">Stream</span>
            <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
              {streamStatus.backend || (connection.phase === 'live' ? 'websocket' : 'unavailable')}
              {streamStatus.workerRunning === false ? ' · worker stopped' : ''}
            </strong>
          </div>
          <div>
            <span className="block text-slate-500">Samples</span>
            <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{snapshot.totalSamples}</strong>
          </div>
        </div>

        {(streamStatus.persistedObservations !== null || streamStatus.pendingMessages !== null) && (
          <div className="mt-2 flex gap-2 border-t border-slate-700/50 pt-1.5 text-[7px] uppercase tracking-wider text-slate-500">
            {streamStatus.persistedObservations !== null && (
              <span>Persisted {streamStatus.persistedObservations}</span>
            )}
            {streamStatus.pendingMessages !== null && <span>Pending {streamStatus.pendingMessages}</span>}
          </div>
        )}

        {(snapshotError || connection.error) && (
          <p className="mt-2 border-t border-slate-700/50 pt-1.5 text-[8px] leading-relaxed text-amber-400">
            {snapshotError || connection.error}
          </p>
        )}
      </div>

      {overcrowded && (
        <div
          role="alert"
          aria-live="assertive"
          className="absolute right-3 top-3 z-30 flex max-w-[250px] items-start gap-2 rounded-xl border border-red-500/50 bg-red-950/90 p-2.5 text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.25)] backdrop-blur-md"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <div>
            <strong className="block text-[9px] uppercase tracking-wider">Overcrowding alert</strong>
            <span className="text-[8px] leading-relaxed">
              {occupancy !== null && capacityValue > 0
                ? `Live occupancy is ${occupancy} against a capacity of ${capacityValue}.`
                : 'The tracking stream reported an overcrowding condition.'}
            </span>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-3 right-3 z-30 rounded-lg border px-2 py-1.5 shadow-lg backdrop-blur-md ${
          theme === 'dark' ? 'border-slate-700/70 bg-slate-950/85' : 'border-slate-200 bg-white/90'
        }`}
      >
        <div
          className="mb-1 h-1.5 w-32 rounded-full"
          style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #06b6d4 30%, #facc15 58%, #f97316 78%, #dc2626 100%)' }}
        />
        <div className="flex justify-between text-[7px] font-bold uppercase tracking-wider text-slate-500">
          <span>Blue · cold</span>
          <span>Red · hot</span>
        </div>
      </div>
    </div>
  );
}
