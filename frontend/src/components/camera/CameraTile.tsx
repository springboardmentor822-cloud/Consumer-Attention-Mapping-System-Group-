import { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CameraOff, Maximize2, Users } from "lucide-react";
import type { CameraStatusItem } from "../../api/storeManager";
import { cn } from "../../lib/utils";

// Browsers cap concurrent connections to one origin at ~6 (Chrome).
// An MJPEG live stream (multipart/x-mixed-replace) holds its connection
// open forever, so opening one per tile in a grid of many cameras starves
// that budget - the 7th+ tile's <img> just queues indefinitely and never
// paints a frame, showing as a stuck black tile with a "LIVE" badge that
// lied about what's actually on screen. Capping how many tiles are
// allowed to open a live connection at once (see CameraTileProps.liveEnabled,
// set by the grid pages below) keeps every tile showing *something* real -
// the ones over the cap fall back to their already-reliable snapshot/replay
// path instead of a connection that will never complete.
export const MAX_CONCURRENT_LIVE_STREAMS = 4;

interface CameraTileProps {
  index: number;
  camera: CameraStatusItem;
  snapshotBaseUrl: string;
  /** Defaults to true so any caller that hasn't been updated keeps its
   * current (pre-cap) behavior. Grids showing many cameras at once should
   * pass this based on the tile's position - see MAX_CONCURRENT_LIVE_STREAMS. */
  liveEnabled?: boolean;
}

function statusDotColor(status: string) {
  if (status === "Online") return "bg-emerald-400";
  if (status === "Maintenance") return "bg-amber-400";
  return "bg-rose-400";
}

function CameraTile({ index, camera, snapshotBaseUrl, liveEnabled = true }: CameraTileProps) {
  const label = camera.zone_name ?? camera.camera_name;
  const imageUrl = camera.snapshot_url ? `${snapshotBaseUrl}${camera.snapshot_url}` : null;
  const videoUrl = camera.video_url ? `${snapshotBaseUrl}${camera.video_url}` : null;
  const liveStreamUrl = liveEnabled && camera.live_stream_url ? `${snapshotBaseUrl}${camera.live_stream_url}` : null;
  const [liveErrored, setLiveErrored] = useState(false);
  const [liveLoaded, setLiveLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayableMedia = (liveStreamUrl && !liveErrored) || !!videoUrl;

  useEffect(() => {
    setLiveErrored(false);
    setLiveLoaded(false);
    if (!liveStreamUrl) return;

    // A live connection that's queued behind the browser's per-origin
    // connection limit, or just slow to produce its first frame (a 4K
    // source takes noticeably longer than a 720p one), never fires
    // onError - it just sits pending, and the tile shows nothing on top
    // of the container's black background indefinitely. Falling back to
    // the reliable REPLAY/snapshot path after a generous wait beats an
    // indefinite black tile with a "LIVE" badge that isn't showing
    // anything live.
    const STALL_TIMEOUT_MS = 15000;
    const timer = window.setTimeout(() => {
      setLiveLoaded((alreadyLoaded) => {
        if (!alreadyLoaded) setLiveErrored(true);
        return alreadyLoaded;
      });
    }, STALL_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [liveStreamUrl]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (videoRef.current) videoRef.current.controls = document.fullscreenElement === containerRef.current;
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Fullscreens the tile container rather than the specific <video>/<img>
  // element, since which one is rendered depends on whether a live stream
  // is active - a single ref on the container works for either case.
  const enterFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    // Safari
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  };

  return (
    <div ref={containerRef} className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
      {liveStreamUrl && !liveErrored ? (
        <img
          key={liveStreamUrl}
          src={liveStreamUrl}
          alt={label}
          className="h-full w-full cursor-pointer object-cover"
          onLoad={() => setLiveLoaded(true)}
          onError={() => setLiveErrored(true)}
          onClick={enterFullscreen}
        />
      ) : videoUrl ? (
        <video
          key={videoUrl}
          ref={videoRef}
          src={videoUrl}
          poster={imageUrl ?? undefined}
          className="h-full w-full cursor-pointer object-cover"
          autoPlay
          loop
          muted
          playsInline
          onClick={enterFullscreen}
        />
      ) : imageUrl ? (
        <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-900 to-black text-slate-600">
          <CameraOff size={28} />
          <span className="px-4 text-center text-[11px] leading-tight">No processed footage yet</span>
          <Link
            to={`/video?camera_id=${camera.camera_id}`}
            className="pointer-events-auto rounded-md bg-blue-600/20 px-2 py-1 text-[11px] font-medium text-blue-300 hover:bg-blue-600/30"
          >
            Process a video →
          </Link>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        {index}. {label}
      </div>

      {liveStreamUrl && !liveErrored ? (
        <div className="absolute left-2 top-9 flex items-center gap-1 rounded-md bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </div>
      ) : videoUrl ? (
        // Distinguishes "genuinely live" from "just looping the last
        // recorded clip on autoplay" - both animate continuously, so
        // without this label they're visually indistinguishable.
        <div className="absolute left-2 top-9 rounded-md bg-slate-700/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-200">
          REPLAY
        </div>
      ) : null}

      {hasPlayableMedia && (
        <button
          onClick={enterFullscreen}
          title="Play fullscreen"
          className="absolute right-2 top-2 rounded-md bg-black/70 p-1.5 text-slate-200 backdrop-blur-sm transition hover:bg-black/90 hover:text-white"
        >
          <Maximize2 size={13} />
        </button>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
        <Users size={13} />
        {camera.latest_people_count}
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-sm">
        <span className={cn("h-1.5 w-1.5 rounded-full", statusDotColor(camera.status))} />
        {camera.status}
      </div>
    </div>
  );
}

// The parent's 8-second poll (see useStoreManagerCameras) returns a brand
// new `camera` object every tick even when nothing in it actually changed
// - plain object identity would make every tile in the grid re-render on
// every poll regardless. Comparing the fields that actually affect this
// component's output means a tile only re-renders when something about
// it genuinely changed, without touching the live <img>/<video> element
// itself either way (its own key is already stable across re-renders).
function arePropsEqual(prev: CameraTileProps, next: CameraTileProps): boolean {
  return (
    prev.index === next.index &&
    prev.snapshotBaseUrl === next.snapshotBaseUrl &&
    prev.liveEnabled === next.liveEnabled &&
    prev.camera.camera_id === next.camera.camera_id &&
    prev.camera.camera_name === next.camera.camera_name &&
    prev.camera.zone_name === next.camera.zone_name &&
    prev.camera.status === next.camera.status &&
    prev.camera.latest_people_count === next.camera.latest_people_count &&
    prev.camera.snapshot_url === next.camera.snapshot_url &&
    prev.camera.video_url === next.camera.video_url &&
    prev.camera.live_stream_url === next.camera.live_stream_url
  );
}

export default memo(CameraTile, arePropsEqual);
