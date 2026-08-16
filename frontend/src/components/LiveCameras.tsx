import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "../api/client";
import { liveCamerasApi } from "../api/resources";
import type { LiveCamera } from "../types";

// Reconnect delay for the status WebSocket itself (separate from each
// camera's own video-stream reconnect, which the backend handles).
const WS_RECONNECT_MS = 3000;

function StatusDot({ status }: { status: LiveCamera["status"] }) {
  const color =
    status === "online" ? "bg-ok" : status === "connecting" ? "bg-warn animate-pulse" : "bg-critical";
  return <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />;
}

function CameraCard({ camera, onExpand }: { camera: LiveCamera; onExpand: (camera: LiveCamera) => void }) {
  const [imgKey, setImgKey] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const streamUrl = liveCamerasApi.streamUrl(camera.id);

  // If the <img> itself drops the connection (e.g. backend restarted),
  // retry loading the MJPEG stream every few seconds rather than leaving a
  // permanently broken frame on screen.
  useEffect(() => {
    if (!imgFailed) return;
    const t = setTimeout(() => {
      setImgFailed(false);
      setImgKey((k) => k + 1);
    }, 4000);
    return () => clearTimeout(t);
  }, [imgFailed]);

  const isOnline = camera.status === "online";

  return (
    <button
      type="button"
      onClick={() => onExpand(camera)}
      className="group bg-panel-raised border border-hairline rounded-md overflow-hidden flex flex-col text-left focus:outline-none focus:border-signal/60 hover:border-signal/50 transition-colors"
    >
      <div className="relative aspect-video bg-black">
        {!imgFailed ? (
          <img
            key={imgKey}
            src={`${streamUrl}?k=${imgKey}`}
            alt={`${camera.name} live feed`}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wide">No signal</span>
            <span className="text-[10px]">Reconnecting…</span>
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-mono text-white">
            <StatusDot status={camera.status} />
            {camera.status === "online" ? "LIVE" : camera.status === "connecting" ? "CONNECTING" : "OFFLINE"}
          </span>
          <span className="bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-mono text-signal">
            {isOnline ? `${camera.person_count} ${camera.person_count === 1 ? "person" : "people"}` : "—"}
          </span>
        </div>

        {/* Expand hint, only visible on hover/focus so the feed stays clean otherwise */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 group-focus-visible:bg-black/25 transition-colors pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-white">
            Expand
          </span>
        </div>
      </div>
      <div className="px-2.5 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-text-primary truncate">{camera.name}</span>
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wide">
          {isOnline ? "Online" : camera.status === "connecting" ? "Connecting" : "Offline"}
        </span>
      </div>
    </button>
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

  // Close on Escape.
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
      aria-label={`${camera.name} expanded live feed`}
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
              alt={`${camera.name} live feed`}
              className="w-full h-full object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-muted">
              <span className="text-xs font-mono uppercase tracking-wide">No signal</span>
              <span className="text-[10px]">Reconnecting…</span>
            </div>
          )}

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white">
              <StatusDot status={camera.status} />
              {camera.status === "online" ? "LIVE" : camera.status === "connecting" ? "CONNECTING" : "OFFLINE"}
            </span>
            <span className="bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-signal">
              {isOnline ? `${camera.person_count} ${camera.person_count === 1 ? "person" : "people"}` : "—"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-12 right-3 pointer-events-auto bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-white transition-colors"
          >
            ✕ Close
          </button>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">{camera.name}</span>
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">
            {isOnline ? "Online" : camera.status === "connecting" ? "Connecting" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveCameras() {
  const [cameras, setCameras] = useState<LiveCamera[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initial snapshot over REST so the grid renders immediately, before
    // the WebSocket (which then takes over for live updates) connects.
    liveCamerasApi
      .list()
      .then(setCameras)
      .catch(() => setCameras([]))
      .finally(() => setLoaded(true));

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

  const onlineCount = cameras.filter((c) => c.status === "online").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-muted">
          Real-time person detection via YOLOv8 across every store camera.
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted shrink-0">
          <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-ok" : "bg-text-muted"}`} />
          Online cameras: <span className="text-text-primary">{onlineCount}/{cameras.length || 8}</span>
        </span>
      </div>

      {!loaded ? (
        <p className="text-sm text-text-muted font-mono">Connecting to camera feeds…</p>
      ) : cameras.length === 0 ? (
        <p className="text-sm text-text-muted">No cameras configured yet.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cameras.map((cam) => (
            <CameraCard key={cam.id} camera={cam} onExpand={(c) => setExpandedId(c.id)} />
          ))}
        </div>
      )}

      {expandedId &&
        (() => {
          // Look up the live-updating camera by id (rather than freezing the
          // clicked snapshot) so status/person-count keep refreshing via the
          // WebSocket while the modal is open.
          const current = cameras.find((c) => c.id === expandedId);
          if (!current) return null;
          return <CameraExpandedModal camera={current} onClose={() => setExpandedId(null)} />;
        })()}
    </div>
  );
}
