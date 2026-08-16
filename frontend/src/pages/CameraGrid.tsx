import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { Button, Select } from "../components/ui";
import { WS_BASE_URL } from "../api/client";
import { liveCamerasApi, storesApi } from "../api/resources";
import type { LiveCamera, Store } from "../types";

const WS_RECONNECT_MS = 3000;

function StatusDot({ status }: { status: LiveCamera["status"] }) {
  const color =
    status === "online" ? "bg-ok" : status === "connecting" ? "bg-warn animate-pulse" : "bg-critical";
  return <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${color}`} />;
}

function GridCameraCard({
  camera,
  index,
  onExpand,
}: {
  camera: LiveCamera;
  index: number;
  onExpand: (camera: LiveCamera) => void;
}) {
  const [imgKey, setImgKey] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const streamUrl = liveCamerasApi.streamUrl(camera.id);
  const isOnline = camera.status === "online";

  useEffect(() => {
    if (!imgFailed) return;
    const t = setTimeout(() => {
      setImgFailed(false);
      setImgKey((k) => k + 1);
    }, 4000);
    return () => clearTimeout(t);
  }, [imgFailed]);

  return (
    <div className="bg-panel-raised border border-hairline rounded-lg overflow-hidden flex flex-col">
      <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-hairline">
        <span className="text-xs font-medium text-text-primary truncate">
          {index}. {camera.name}
        </span>
      </div>

      <div className="relative aspect-video bg-black">
        {!imgFailed ? (
          <img
            key={imgKey}
            src={`${streamUrl}?k=${imgKey}`}
            alt={`${camera.name} feed`}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-wide">No signal</span>
            <span className="text-[9px]">Reconnecting…</span>
          </div>
        )}

        <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide text-signal">
          Replay
        </span>

        <button
          type="button"
          onClick={() => onExpand(camera)}
          aria-label={`Expand ${camera.name}`}
          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded p-1 text-white transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isOnline ? camera.person_count : "—"}
          </span>
          <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
            <StatusDot status={camera.status} />
            {isOnline ? "Online" : camera.status === "connecting" ? "Connecting" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

function CameraExpandedModal({ camera, onClose }: { camera: LiveCamera; onClose: () => void }) {
  const [imgKey, setImgKey] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const streamUrl = liveCamerasApi.streamUrl(camera.id);
  const isOnline = camera.status === "online";

  useEffect(() => {
    if (!imgFailed) return;
    const t = setTimeout(() => {
      setImgFailed(false);
      setImgKey((k) => k + 1);
    }, 4000);
    return () => clearTimeout(t);
  }, [imgFailed]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${camera.name} expanded feed`}
    >
      <div
        className="relative w-full max-w-4xl bg-panel-raised border border-hairline rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video bg-black">
          {!imgFailed ? (
            <img
              key={imgKey}
              src={`${streamUrl}?k=${imgKey}`}
              alt={`${camera.name} feed`}
              className="w-full h-full object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-muted">
              <span className="text-xs font-mono uppercase tracking-wide">No signal</span>
              <span className="text-[10px]">Reconnecting…</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white transition-colors"
          >
            ✕ Close
          </button>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">{camera.name}</span>
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">
            {isOnline ? `${camera.person_count} people · Online` : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CameraGridPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [cameras, setCameras] = useState<LiveCamera[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    storesApi.list().then((s) => {
      setStores(s);
      if (s.length > 0) setStoreId(s[0].id);
    });
  }, []);

  function loadOnce() {
    liveCamerasApi
      .list()
      .then(setCameras)
      .catch(() => setCameras([]))
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    loadOnce();
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(`${WS_BASE_URL}/ws/live-cameras`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === "live_camera_status" && Array.isArray(payload.cameras)) {
            setCameras(payload.cameras);
            setLoaded(true);
          }
        } catch {
          // ignore malformed frames
        }
      };
      ws.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, WS_RECONNECT_MS);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  return (
    <AppShell>
      <div className="px-8 py-6 max-w-[1400px]">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Camera Grid</h1>
            <p className="text-sm text-text-muted mt-1">
              Latest processed frame per camera - refreshes automatically, not a continuous live stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-5 mb-5">
          <Link to="/cameras">
            <Button variant="ghost">Manage Cameras</Button>
          </Link>
          <Link to="/tracking">
            <Button variant="ghost">Live Tracking →</Button>
          </Link>
          {stores.length > 0 && (
            <Select
              value={storeId ?? ""}
              onChange={(e) => setStoreId(Number(e.target.value))}
              className="w-auto"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <Button variant="ghost" onClick={loadOnce}>
            ↻ Refresh
          </Button>
        </div>

        {!loaded ? (
          <p className="text-sm text-text-muted font-mono">Connecting to camera feeds…</p>
        ) : cameras.length === 0 ? (
          <p className="text-sm text-text-muted">
            No cameras configured yet. Add cameras from Manage Cameras, or check{" "}
            <code className="text-signal">backend/app/config/live_cameras.json</code>.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cameras.map((cam, i) => (
              <GridCameraCard key={cam.id} camera={cam} index={i + 1} onExpand={(c) => setExpandedId(c.id)} />
            ))}
          </div>
        )}

        {expandedId &&
          (() => {
            const current = cameras.find((c) => c.id === expandedId);
            if (!current) return null;
            return <CameraExpandedModal camera={current} onClose={() => setExpandedId(null)} />;
          })()}
      </div>
    </AppShell>
  );
}
