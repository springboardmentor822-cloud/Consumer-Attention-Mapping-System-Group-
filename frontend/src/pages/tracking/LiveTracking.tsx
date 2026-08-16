import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/AppShell";
import { Badge, Button, Input, Select, StatusPill } from "../../components/ui";
import { WS_BASE_URL } from "../../api/client";
import { camerasApi, liveTrackingApi, storesApi, zonesApi } from "../../api/resources";
import type { Camera, LiveTrackingPoint, OccupancySnapshot, Store, Zone } from "../../types";

function crowdStatus(count: number): { label: string; tone: "ok" | "warn" | "critical" } {
  if (count <= 3) return { label: "Low", tone: "ok" };
  if (count <= 8) return { label: "Medium", tone: "warn" };
  return { label: "High", tone: "critical" };
}

const ZONE_LABELS = ["Zone A - Entrance / Exit Foyer", "Zone B - Main Product Aisle", "Zone C - Checkout Lanes"];

// Bundled sample footage (public domain / sample-dataset clips) so the
// video-processing pipeline can be tried out with zero setup - no camera
// or personal footage required. Served straight from /public, so these
// are plain static files, not stored per-store data.
const SAMPLE_VIDEOS = [
  {
    key: "people-detection",
    label: "People walking (pedestrian dataset)",
    file: "/sample-videos/people-detection.mp4",
  },
  {
    key: "store-aisle",
    label: "Store aisle foot traffic",
    file: "/sample-videos/store-aisle.mp4",
  },
  {
    key: "bottle-detection",
    label: "Shelf / product close-up",
    file: "/sample-videos/bottle-detection.mp4",
  },
];

const GRID_COLS = 48;
const GRID_ROWS = 27;
const DECAY = 0.985;
const DOT_STALE_MS = 3500;
const TRAIL_LENGTH = 14; // recent positions kept per track, for the path line behind each dot

type LiveDot = {
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
  zoneIndex: number;
  lastSeen: number;
  trail: { x: number; y: number }[]; // recent positions, oldest first - draws the path line behind each dot
};
type ProductBox = { x: number; y: number; w: number; h: number; confidence: number; lastSeen: number };

export function LiveTrackingPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [occupancy, setOccupancy] = useState<OccupancySnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [overcrowdingAlert, setOvercrowdingAlert] = useState<{ message: string; total: number; limit: number } | null>(null);
  const [capacityInput, setCapacityInput] = useState("");
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveDetectionCounts, setLiveDetectionCounts] = useState({ people: 0, products: 0 });
  const [sampleVideoKey, setSampleVideoKey] = useState(SAMPLE_VIDEOS[0].key);
  const [loadingSample, setLoadingSample] = useState(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const densityRef = useRef<Float32Array>(new Float32Array(GRID_COLS * GRID_ROWS));
  const dotsRef = useRef<Map<string, LiveDot>>(new Map());
  const productBoxesRef = useRef<ProductBox[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    storesApi.list().then((s) => {
      setStores(s);
      if (s.length > 0) setStoreId(s[0].id);
    });
  }, []);

  // Poll simulation status + occupancy whenever the selected store changes.
  useEffect(() => {
    if (storeId === null) return;
    liveTrackingApi.status(storeId).then((s) => setRunning(s.running));
    liveTrackingApi.occupancy(storeId).then(setOccupancy).catch(() => {});
    liveTrackingApi.detectionStatus(storeId).then((s) => setProcessingVideo(s.processing)).catch(() => {});
    camerasApi.list(storeId).then(setCameras).catch(() => setCameras([]));
    zonesApi.list(storeId).then(setZones).catch(() => setZones([]));
  }, [storeId]);

  // Poll real-video-processing status every few seconds too, so the
  // "Processing..." badge clears itself once the uploaded video finishes.
  useEffect(() => {
    if (storeId === null) return;
    const id = setInterval(() => {
      liveTrackingApi.detectionStatus(storeId).then((s) => setProcessingVideo(s.processing)).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [storeId]);

  // Poll occupancy every few seconds (cheap: it's a single Redis hash read).
  useEffect(() => {
    if (storeId === null) return;
    const id = setInterval(() => {
      liveTrackingApi.occupancy(storeId).then(setOccupancy).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [storeId]);

  // WebSocket connection - live push of tracking batches from the backend consumer.
  useEffect(() => {
    if (storeId === null) return;
    densityRef.current = new Float32Array(GRID_COLS * GRID_ROWS);
    dotsRef.current = new Map();
    productBoxesRef.current = [];
    setOvercrowdingAlert(null);
    setMessagesReceived(0);

    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (!active || storeId === null) return;
      const ws = new WebSocket(`${WS_BASE_URL}/ws/stores/${storeId}`);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect - without this, a backend restart (or any dropped
        // connection) permanently freezes the live view until the person
        // manually refreshes the page, even though the "Live" badge might
        // still show stale state from before the drop.
        if (active) reconnectTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => setConnected(false);
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          setMessagesReceived((n) => n + 1);

          if (msg.type === "overcrowding_alert") {
            setOvercrowdingAlert({ message: msg.message, total: msg.total, limit: msg.limit });
            return;
          }
          if (msg.type === "overcrowding_cleared") {
            setOvercrowdingAlert(null);
            return;
          }
          if (msg.type === "product_detections") {
            const now = performance.now();
            productBoxesRef.current = (msg.products as any[]).map((p) => ({
              x: parseFloat(p.norm_x),
              y: parseFloat(p.norm_y),
              w: parseFloat(p.norm_w),
              h: parseFloat(p.norm_h),
              confidence: parseFloat(p.confidence),
              lastSeen: now,
            }));
            return;
          }
          if (msg.type !== "tracking_batch") return;

          const now = performance.now();
          for (const p of msg.points as LiveTrackingPoint[]) {
            const nx = parseFloat(p.norm_x);
            const ny = parseFloat(p.norm_y);
            if (Number.isNaN(nx) || Number.isNaN(ny)) continue;
            const nw = p.norm_w ? parseFloat(p.norm_w) : 0.04;
            const nh = p.norm_h ? parseFloat(p.norm_h) : 0.11;
            const conf = p.detection_confidence ? parseFloat(p.detection_confidence) : 0.9;
            const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor(nx * GRID_COLS)));
            const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor(ny * GRID_ROWS)));
            densityRef.current[row * GRID_COLS + col] += 1;
            const existing = dotsRef.current.get(p.track_id);
            const trail = existing ? [...existing.trail, { x: nx, y: ny }].slice(-TRAIL_LENGTH) : [{ x: nx, y: ny }];
            dotsRef.current.set(p.track_id, { x: nx, y: ny, w: nw, h: nh, confidence: conf, zoneIndex: p.zone_index, lastSeen: now, trail });
          }
        } catch {
          // ignore malformed frames
        }
      };
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [storeId]);

  // Render loop: decay density, drop stale dots, redraw. Depends directly
  // on the canvas DOM node itself (via the setCanvasEl callback ref below),
  // not an indirect proxy like a loading flag - the canvas only exists once
  // stores has loaded (see the stores.length === 0 branch further down), so
  // an effect with an empty [] dependency array ran once on mount, found
  // canvasEl still null, and bailed for good: the interval that paints the
  // dots was never created, so nothing ever appeared even after dots
  // started arriving over the websocket. Depending on canvasEl itself means
  // this is correct no matter what else changes around when the canvas
  // mounts.
  useEffect(() => {
    const canvas = canvasEl;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const interval = setInterval(() => {
      const density = densityRef.current;
      for (let i = 0; i < density.length; i++) density[i] *= DECAY;

      const now = performance.now();
      for (const [id, dot] of dotsRef.current) {
        if (now - dot.lastSeen > DOT_STALE_MS) dotsRef.current.delete(id);
      }
      productBoxesRef.current = productBoxesRef.current.filter((b) => now - b.lastSeen < DOT_STALE_MS);

      ctx.clearRect(0, 0, width, height);

      // Fine dark grid background, matching the reference's "floor plan"
      // look rather than a filled heatmap - the density data still drives
      // the trail/glow intensity below, it's just not painted as cells.
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      const gridStep = 28;
      for (let x = 0; x <= width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // live product detection boxes (from the custom-trained model) - kept
      // subtle (thin, low-key blue) so they don't compete with the shopper
      // dots, which are the main focus of this view.
      ctx.strokeStyle = "rgba(79,157,255,0.5)";
      ctx.lineWidth = 1;
      ctx.font = "9px monospace";
      for (const box of productBoxesRef.current) {
        const x = (box.x - box.w / 2) * width;
        const y = (box.y - box.h / 2) * height;
        const w = box.w * width;
        const h = box.h * height;
        ctx.strokeRect(x, y, w, h);
      }

      // Shopper dots: a thin gold trail line behind each one showing its
      // recent path, then a glowing dot with a small numeric badge - this
      // is the main visualization, styled to read at a glance in a
      // classroom demo (a bounding box per shopper was harder to follow
      // once more than 2-3 people were on screen at once).
      for (const [trackId, dot] of dotsRef.current) {
        if (dot.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(dot.trail[0].x * width, dot.trail[0].y * height);
          for (let i = 1; i < dot.trail.length; i++) {
            ctx.lineTo(dot.trail[i].x * width, dot.trail[i].y * height);
          }
          ctx.strokeStyle = "rgba(240,180,60,0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const cx = dot.x * width;
        const cy = dot.y * height;

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 11);
        glow.addColorStop(0, "rgba(250,200,80,0.85)");
        glow.addColorStop(0.5, "rgba(240,170,40,0.35)");
        glow.addColorStop(1, "rgba(240,170,40,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#f7c948";
        ctx.fill();

        // small numeric badge, offset above-right of the dot
        const label = `#${trackId}`;
        ctx.font = "9px monospace";
        const labelW = ctx.measureText(label).width + 6;
        ctx.fillStyle = "rgba(10,12,16,0.8)";
        ctx.fillRect(cx + 6, cy - 16, labelW, 12);
        ctx.fillStyle = "#f7c948";
        ctx.fillText(label, cx + 9, cy - 7);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [canvasEl]);

  async function handleStart() {
    if (storeId === null) return;
    setBusy(true);
    setError(null);
    try {
      await liveTrackingApi.start(storeId);
      setRunning(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      if (status === 403) {
        setError("Only Admins and Store Managers can start the simulation - your account's role isn't allowed to.");
      } else if (status === 404) {
        setError("That store wasn't found. Try picking it again from the dropdown.");
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Could not start the simulation. Check that the backend and Redis are running.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (storeId === null) return;
    setBusy(true);
    setError(null);
    try {
      await liveTrackingApi.stop(storeId);
      setRunning(false);
      dotsRef.current = new Map();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        setError("Only Admins and Store Managers can stop the simulation - your account's role isn't allowed to.");
      } else {
        setError("Could not stop the simulation.");
      }
    } finally {
      setBusy(false);
    }
  }

  // Keep the capacity input in sync with whichever store is selected.
  useEffect(() => {
    const current = stores.find((s) => s.id === storeId);
    setCapacityInput(current?.max_capacity != null ? String(current.max_capacity) : "");
  }, [storeId, stores]);

  async function handleSaveCapacity() {
    if (storeId === null) return;
    const parsed = Number(capacityInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Capacity limit must be a positive number.");
      return;
    }
    setSavingCapacity(true);
    setError(null);
    try {
      const updated = await storesApi.update(storeId, { max_capacity: parsed });
      setStores((rows) => rows.map((s) => (s.id === storeId ? updated : s)));
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 403
          ? "Only Admins and Store Managers can change the capacity limit."
          : "Could not save the capacity limit."
      );
    } finally {
      setSavingCapacity(false);
    }
  }


  async function handleStartCamera() {
    if (storeId === null) return;
    setCameraError(null);
    try {
      // Ask the browser for the person's own webcam. This is the actual
      // "camera module" - a live feed, not a database record about a camera.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Every 1000ms: grab whatever the camera currently sees, send it to
      // the backend for real YOLOv8 detection, then draw whatever boxes
      // come back on top of the live video. No memory between frames -
      // each one is analyzed completely fresh (see the endpoint's docstring
      // for why that's the right call for a live feed).
      captureIntervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;

        const captureCanvas = document.createElement("canvas");
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const captureCtx = captureCanvas.getContext("2d");
        if (!captureCtx) return;
        captureCtx.drawImage(video, 0, 0);

        captureCanvas.toBlob(
          async (blob) => {
            if (!blob || storeId === null) return;
            try {
              const result = await liveTrackingApi.detectFrame(storeId, blob);
              setLiveDetectionCounts({ people: result.people_count, products: result.product_count });
              drawCameraOverlay(result.people, result.products);
            } catch {
              // A single dropped frame isn't worth interrupting the feed for -
              // the next frame a second from now will just try again.
            }
          },
          "image/jpeg",
          0.8
        );
      }, 1000);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setCameraError("Camera access was denied. Check your browser's site permissions and try again.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else {
        setCameraError("Could not access the camera.");
      }
    }
  }

  function handleStopCamera() {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setCameraActive(false);
    setLiveDetectionCounts({ people: 0, products: 0 });
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext("2d");
      ctx?.clearRect(0, 0, overlay.width, overlay.height);
    }
  }

  function drawCameraOverlay(
    people: { norm_x: number; norm_y: number; norm_w: number; norm_h: number; confidence: number }[],
    products: { norm_x: number; norm_y: number; norm_w: number; norm_h: number; confidence: number }[]
  ) {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "11px monospace";

    ctx.strokeStyle = "#3ecf6a";
    for (const p of people) {
      const x = (p.norm_x - p.norm_w / 2) * canvas.width;
      const y = (p.norm_y - p.norm_h / 2) * canvas.height;
      const w = p.norm_w * canvas.width;
      const h = p.norm_h * canvas.height;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#3ecf6a";
      ctx.fillText(`person ${p.confidence.toFixed(2)}`, x, Math.max(11, y - 4));
    }

    ctx.strokeStyle = "#4f9dff";
    for (const p of products) {
      const x = (p.norm_x - p.norm_w / 2) * canvas.width;
      const y = (p.norm_y - p.norm_h / 2) * canvas.height;
      const w = p.norm_w * canvas.width;
      const h = p.norm_h * canvas.height;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#4f9dff";
      ctx.fillText(`product ${p.confidence.toFixed(2)}`, x, Math.max(11, y - 4));
    }
  }

  // Stop the camera automatically if the person navigates away - otherwise
  // the webcam light would stay on in the background forever.
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function handleVideoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || storeId === null) return;

    setError(null);
    setUploadNote(null);
    try {
      const res = await liveTrackingApi.uploadVideo(storeId, file);
      setProcessingVideo(true);
      setUploadNote(
        `Processing "${res.filename}" with real YOLOv8 + ByteTrack - detected people will appear on the map below as it runs.`
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 403) {
        setError("Only Admins and Store Managers can upload video - your account's role isn't allowed to.");
      } else if (status === 409 && typeof detail === "string") {
        setError(detail);
      } else {
        setError("Could not process that video. Make sure it's a valid video file and try again.");
      }
    }
  }

  async function handleUseSampleVideo() {
    if (storeId === null) return;
    const sample = SAMPLE_VIDEOS.find((v) => v.key === sampleVideoKey);
    if (!sample) return;

    setError(null);
    setUploadNote(null);
    setLoadingSample(true);
    try {
      // Fetch the bundled clip from /public and hand it to the exact same
      // upload pipeline "Upload real video" uses - so a person with no
      // camera or footage of their own can still see real YOLOv8 +
      // ByteTrack detections flow onto the live map below.
      const res = await fetch(sample.file);
      if (!res.ok) throw new Error("fetch-failed");
      const blob = await res.blob();
      const file = new File([blob], sample.file.split("/").pop() ?? "sample.mp4", { type: "video/mp4" });

      await liveTrackingApi.uploadVideo(storeId, file);
      setProcessingVideo(true);
      setUploadNote(
        `Processing sample clip "${sample.label}" with real YOLOv8 + ByteTrack - detected people will appear on the map below as it runs.`
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 403) {
        setError("Only Admins and Store Managers can process video - your account's role isn't allowed to.");
      } else if (status === 409 && typeof detail === "string") {
        setError(detail);
      } else {
        setError("Could not load or process the sample video. Check your connection and try again.");
      }
    } finally {
      setLoadingSample(false);
    }
  }


  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Live Store Tracking</h1>
          <p className="text-xs text-text-muted font-mono">
            Real customer positions - live while a camera is actively streaming, or the most recent
            processed activity otherwise
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stores.length > 0 && (
            <Select value={storeId ?? ""} onChange={(e) => setStoreId(Number(e.target.value))} className="w-56">
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              placeholder="15"
              className="w-20"
              title="Overcrowding alert threshold (people)"
            />
            <Button variant="ghost" onClick={handleSaveCapacity} disabled={savingCapacity || storeId === null}>
              {savingCapacity ? "Saving…" : "Set limit"}
            </Button>
          </div>
          <Badge tone={connected ? "ok" : "muted"}>{connected ? "Live" : "Disconnected"}</Badge>
          <span className="text-xs text-text-muted font-mono" title="Total WebSocket messages received since this page loaded">
            msgs: {messagesReceived}
          </span>
          {processingVideo && <Badge tone="signal">Processing real video…</Badge>}
          {running ? (
            <Button variant="ghost" onClick={handleStop} disabled={busy}>
              {busy ? "Stopping…" : "Stop simulation"}
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={busy || storeId === null}>
              {busy ? "Starting…" : "Start simulation"}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelected}
          />
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={running || processingVideo || storeId === null}
          >
            Upload real video
          </Button>
          <Select
            value={sampleVideoKey}
            onChange={(e) => setSampleVideoKey(e.target.value)}
            disabled={running || processingVideo || loadingSample || storeId === null}
            className="w-56"
          >
            {SAMPLE_VIDEOS.map((v) => (
              <option key={v.key} value={v.key}>
                {v.label}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            onClick={handleUseSampleVideo}
            disabled={running || processingVideo || loadingSample || storeId === null}
          >
            {loadingSample ? "Loading sample…" : "Try a sample dataset video"}
          </Button>
          {cameraActive ? (
            <Button variant="ghost" onClick={handleStopCamera}>
              Stop camera
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleStartCamera}
              disabled={running || processingVideo || storeId === null}
            >
              Use live camera
            </Button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-5xl space-y-6">
        {error && (
          <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {overcrowdingAlert && (
          <div className="border border-critical/40 bg-critical/10 rounded-lg px-4 py-3 flex items-start gap-3 animate-pulse">
            <Badge tone="critical">Overcrowding</Badge>
            <div className="flex-1">
              <p className="text-sm text-text-primary font-medium">
                {overcrowdingAlert.total} people in store (limit {overcrowdingAlert.limit})
              </p>
              <p className="text-xs text-text-muted mt-0.5">{overcrowdingAlert.message}</p>
            </div>
            <button
              onClick={() => setOvercrowdingAlert(null)}
              className="text-xs text-text-muted hover:text-text-primary shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
        {uploadNote && (
          <p className="text-sm text-signal border border-signal/30 bg-signal/10 rounded-md px-3 py-2">
            {uploadNote}
          </p>
        )}
        {cameraError && (
          <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2">
            {cameraError}
          </p>
        )}
        <div className={`bg-panel border border-hairline rounded-lg p-4 ${cameraActive ? "" : "hidden"}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm">Live camera feed</h2>
            <p className="text-xs text-text-muted font-mono">
              {liveDetectionCounts.people} people · {liveDetectionCounts.products} products (this frame)
            </p>
          </div>
          <div className="relative inline-block rounded-md overflow-hidden bg-base">
            <video ref={videoRef} muted playsInline className="block w-full max-w-xl h-auto" />
            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>
          <p className="text-xs text-text-muted mt-2">
            A new frame is analyzed roughly once a second by both trained models - green boxes are
            people, blue boxes are products. Nothing here is recorded or tracked between frames.
          </p>
        </div>
        {stores.length === 0 ? (
          <p className="text-sm text-text-muted">No stores registered yet.</p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="font-display text-5xl font-semibold text-signal">{occupancy?.total ?? 0}</p>
                <p className="text-xs text-text-muted font-mono uppercase tracking-wide mt-1">
                  Customers in range
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/camera-grid">
                  <Button variant="ghost">Camera Grid →</Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={running || processingVideo || storeId === null}
                >
                  Process Video →
                </Button>
              </div>
            </div>

            <div className="bg-panel border border-hairline rounded-lg p-4">
              <canvas
                ref={setCanvasEl}
                width={900}
                height={510}
                className="w-full h-auto rounded-md bg-base"
              />
              <p className="text-xs text-text-muted mt-3">
                Each glowing dot is a live tracked shopper, labeled with their track ID, with a
                trail showing their recent path. Blue boxes are shelf products, found by a second
                model custom-trained on the SKU-110K dataset via transfer learning.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-panel border border-hairline rounded-lg p-4">
                <p className="font-display text-2xl font-semibold">{occupancy?.total ?? 0}</p>
                <p className="text-xs text-text-muted font-mono uppercase tracking-wide mt-1">
                  People in store now
                </p>
              </div>
              {[0, 1, 2].map((z) => (
                <div key={z} className="bg-panel border border-hairline rounded-lg p-4">
                  <p className="font-display text-2xl font-semibold">
                    {occupancy?.by_zone_index?.[String(z)] ?? 0}
                  </p>
                  <p className="text-xs text-text-muted mt-1 truncate">{ZONE_LABELS[z]}</p>
                </div>
              ))}
            </div>

            {cameras.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-semibold mb-3 text-text-muted uppercase tracking-wide">
                  Live store cameras
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {cameras.map((cam) => {
                    const zoneIndex = zones.findIndex((z) => z.id === cam.zone_id);
                    const zoneName = zoneIndex >= 0 ? ZONE_LABELS[zoneIndex] ?? zones[zoneIndex].name : "Unassigned";
                    const peopleHere =
                      zoneIndex >= 0 ? occupancy?.by_zone_index?.[String(zoneIndex)] ?? 0 : 0;
                    const crowd = crowdStatus(peopleHere);
                    const isLive = cam.status === "online" && (running || processingVideo);
                    return (
                      <div key={cam.id} className="bg-panel border border-hairline rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{cam.name}</p>
                          <Badge tone={isLive ? "ok" : "muted"}>{isLive ? "LIVE" : "Idle"}</Badge>
                        </div>
                        <p className="text-xs text-text-muted mt-1 truncate">{zoneName}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className="font-display text-xl font-semibold">{peopleHere}</p>
                            <p className="text-[11px] text-text-muted font-mono uppercase tracking-wide">People</p>
                          </div>
                          <Badge tone={crowd.tone}>{crowd.label} crowd</Badge>
                        </div>
                        <div className="mt-3 pt-3 border-t border-hairline">
                          <StatusPill status={cam.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!running && !processingVideo && (
              <p className="text-sm text-text-muted">
                Click <span className="text-text-primary">"Start simulation"</span> for
                simulated shopper traffic, or{" "}
                <span className="text-text-primary">"Upload real video"</span> to run genuine
                YOLOv8 object detection + ByteTrack tracking on an actual video. Colored dots
                are tracked people; blue boxes are shelf products, found by a second model
                custom-trained on the SKU-110K dataset via transfer learning.
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>

  );
}
