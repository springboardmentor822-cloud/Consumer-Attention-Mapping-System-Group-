"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  Store,
  Zone,
  Camera,
  DwellTimeEntry,
  TrafficPoint,
  ZoneTraffic,
  AttractivenessEntry,
  ProductInteractionResponse,
  getApiBaseUrl,
} from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import DashboardSidebar from "../_components/DashboardSidebar";
import KpiCard from "../_components/KpiCard";
import CompletionAnalyticsPanel from "../_components/CompletionAnalyticsPanel";

declare module "simpleheat";
type SimpleHeatInstance = {
  data: (points: [number, number, number][]) => SimpleHeatInstance;
  max: (v: number) => SimpleHeatInstance;
  radius: (r: number, blur?: number) => SimpleHeatInstance;
  draw: (minOpacity?: number) => SimpleHeatInstance;
};

type LiveTrackingMessage = {
  camera_id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const WINDOW_MS = 60_000;
// How far back we look to count "recent detections" per camera for the
// live grid. This is a proxy for people-count, not an exact headcount —
// the backend stream has no frame boundaries or track IDs, so we can't
// tell how many boxes belong to the same instant vs. the same person
// re-detected. See the caption under the Live Camera Grid card.
const ACTIVITY_WINDOW_MS = 1_500;

type PointEvent = { x: number; y: number; t: number };

// Custom Treemap cell — recharts renders unlabeled bare rects by default.
// Opacity scales by rank instead of introducing a new color palette, to
// stay inside the theme's single text-primary hue used everywhere else
// on this dashboard.
function ZoneTreemapCell(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, value, index = 0 } = props;
  const opacity = 0.35 + Math.min(index, 4) * 0.12;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        className="text-primary"
        fill="currentColor"
        fillOpacity={opacity}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
      {width > 60 && height > 30 && (
        <text x={x + 8} y={y + 20} fontSize={12} fill="hsl(var(--background))">
          {name}
        </text>
      )}
      {width > 60 && height > 44 && (
        <text x={x + 8} y={y + 36} fontSize={11} fill="hsl(var(--background))" fillOpacity={0.85}>
          {value} events
        </text>
      )}
    </g>
  );
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "cameras", label: "Live Cameras" },
  { id: "traffic", label: "Store Traffic" },
  { id: "shelves", label: "Shelf Performance" },
  { id: "heatmap", label: "Store Heatmap" },
  { id: "products", label: "Product Interaction" },
  { id: "conversion", label: "Store Conversion" },
  { id: "alerts", label: "Store Alerts" },
  { id: "reports", label: "Reports" },
];

export default function StoreManagerDashboard() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<SimpleHeatInstance | null>(null);
  const pointsRef = useRef<PointEvent[]>([]);
  const maxSeenRef = useRef({ x: 1, y: 1 });
  // camera_id -> array of detection timestamps (ms), used for the live
  // camera grid's activity proxy. Not filtered to one camera like the
  // heatmap's pointsRef — this tracks every camera at once.
  const activityRef = useRef<Record<string, number[]>>({});

  const [store, setStore] = useState<Store | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dwellTimeData, setDwellTimeData] = useState<DwellTimeEntry[]>([]);
  const [productInteractions, setProductInteractions] = useState<ProductInteractionResponse | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [zoneTrafficData, setZoneTrafficData] = useState<ZoneTraffic[]>([]);
  const [cameraActivity, setCameraActivity] = useState<Record<string, number>>({});

  // NEW — report export. exportingFormat tracks which button is mid-
  // request so only that one shows a loading state, not both.
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "excel" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Zone-wide (all cameras in the zone, not just selectedCameraId) shelf
  // data. A shelf can be seen by more than one camera from a different
  // angle (e.g. Main Product Aisle's Accessories/Clothing shelves, seen
  // by both Camera 2 and Camera 3) — scoping these to selectedCameraId
  // meant one camera's reading silently replaced the other's when you
  // switched the camera picker, with no indication they were the same
  // shelf. Fetching across every camera in the zone and labeling each
  // reading by camera name fixes that: both readings show, honestly.
  const [zoneAttractivenessData, setZoneAttractivenessData] = useState<
    (AttractivenessEntry & { camera_name: string })[]
  >([]);
  const [zoneDwellTimeData, setZoneDwellTimeData] = useState<
    (DwellTimeEntry & { camera_name: string })[]
  >([]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const stores = await api.listStores();
      if (stores.length === 0) {
        setError("No stores yet.");
        setLoading(false);
        return;
      }
      const activeStore = stores[0];
      setStore(activeStore);
      const zoneList = await api.listZones(activeStore.id);
      setZones(zoneList);
      if (zoneList.length > 0) setSelectedZoneId(zoneList[0].id);
      const cameraList = await api.listCameras(activeStore.id);
      setCameras(cameraList);
      const zoneTraffic = await api.getZoneTraffic(activeStore.id);
      setZoneTrafficData(zoneTraffic);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load Store Manager dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedZoneId) return;
    const zoneCameras = cameras.filter((c) => c.zone_id === selectedZoneId);
    setSelectedCameraId(zoneCameras[0]?.id ?? null);
    pointsRef.current = [];
    maxSeenRef.current = { x: 1, y: 1 };
  }, [selectedZoneId, cameras]);

  // Single WebSocket, shared by two consumers: the heatmap (filtered to
  // selectedCameraId, same as Retail Analyst) and the live camera grid
  // (unfiltered — every camera's detections land in activityRef).
  useEffect(() => {
    const base = getApiBaseUrl().replace(/^http/, "ws");
    const ws = new WebSocket(`${base}/ws/live-tracking`);
    ws.onmessage = (event) => {
      let msg: LiveTrackingMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      const now = Date.now();
      const bucket = activityRef.current[msg.camera_id] ?? [];
      bucket.push(now);
      activityRef.current[msg.camera_id] = bucket.filter((t) => now - t < ACTIVITY_WINDOW_MS);

      if (msg.camera_id !== selectedCameraId) return;
      const cx = (msg.x1 + msg.x2) / 2;
      const cy = (msg.y1 + msg.y2) / 2;
      maxSeenRef.current.x = Math.max(maxSeenRef.current.x, cx);
      maxSeenRef.current.y = Math.max(maxSeenRef.current.y, cy);
      pointsRef.current.push({ x: cx, y: cy, t: now });
    };
    return () => ws.close();
  }, [selectedCameraId]);

  // Recompute the live grid's per-camera counts on a fixed tick, same
  // pattern as the heatmap's draw loop below.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const next: Record<string, number> = {};
      for (const [camId, timestamps] of Object.entries(activityRef.current)) {
        const recent = timestamps.filter((t) => now - t < ACTIVITY_WINDOW_MS);
        activityRef.current[camId] = recent;
        next[camId] = recent.length;
      }
      setCameraActivity(next);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!heatRef.current) {
      const simpleheat = require("simpleheat");
      heatRef.current = simpleheat(canvas) as SimpleHeatInstance;
      heatRef.current.radius(18, 25);
      heatRef.current.max(6);
    }
    const now = Date.now();
    pointsRef.current = pointsRef.current.filter((p) => now - p.t < WINDOW_MS);
    const { x: maxX, y: maxY } = maxSeenRef.current;
    const data: [number, number, number][] = pointsRef.current.map((p) => [
      (p.x / maxX) * canvas.width,
      (p.y / maxY) * canvas.height,
      1,
    ]);
    heatRef.current.data(data).draw(0.25);
  }, []);

  useEffect(() => {
    const interval = setInterval(draw, 300);
    return () => clearInterval(interval);
  }, [draw]);

  // Per-camera fetches — these stay scoped to selectedCameraId on purpose.
  // Dwell KPI (overview), traffic-over-time, and the heatmap are all
  // genuinely single-camera views (they say "this camera" in their
  // labels), unlike shelf-level scores below which need to combine
  // every camera that can see a given shelf.
  useEffect(() => {
    if (!store || !selectedCameraId) {
      setDwellTimeData([]);
      setTrafficData([]);
      setProductInteractions(null);
      return;
    }
    api.getDwellTime(store.id, selectedCameraId).then(setDwellTimeData).catch(() => setDwellTimeData([]));
    api.getTrafficOverTime(store.id, selectedCameraId).then(setTrafficData).catch(() => setTrafficData([]));
    api.getProductInteractions(store.id, selectedCameraId).then(setProductInteractions).catch(() => setProductInteractions(null));
  }, [store, selectedCameraId]);

  const zoneCameras = cameras.filter((c) => c.zone_id === selectedZoneId);

  // Zone-wide shelf fetches — every camera in the current zone, not just
  // the selected one. A shelf visible from two cameras (different angle,
  // e.g. Main Product Aisle) gets one entry per camera here; the chart
  // below labels each by camera name instead of one silently overwriting
  // the other when the camera picker changes.
  useEffect(() => {
    if (!store || zoneCameras.length === 0) {
      setZoneAttractivenessData([]);
      setZoneDwellTimeData([]);
      return;
    }
    Promise.all(
      zoneCameras.map((cam) =>
        api
          .getAttractiveness(store.id, cam.id)
          .then((entries) => entries.map((e) => ({ ...e, camera_name: cam.name })))
          .catch(() => [])
      )
    ).then((results) => setZoneAttractivenessData(results.flat()));

    Promise.all(
      zoneCameras.map((cam) =>
        api
          .getDwellTime(store.id, cam.id)
          .then((entries) => entries.map((e) => ({ ...e, camera_name: cam.name })))
          .catch(() => [])
      )
    ).then((results) => setZoneDwellTimeData(results.flat()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, zoneCameras.map((c) => c.id).join(",")]);

  const totalDwellSeconds = dwellTimeData.reduce((sum, d) => sum + d.total_seconds, 0);
  const totalDistinctForDwell = dwellTimeData.reduce((sum, d) => sum + d.distinct_visitors, 0);
  // Fall back to total time when the distinct-visitor denominator is
  // zero/missing, instead of dividing by zero and silently blanking a
  // real number — this is what happened with Camera 2's 8s entry.
  const avgDwellSeconds =
    dwellTimeData.length === 0
      ? null
      : totalDistinctForDwell > 0
      ? totalDwellSeconds / totalDistinctForDwell
      : totalDwellSeconds;
  const avgDwellIsTrueAverage = totalDistinctForDwell > 0;
  const totalVisitors = zoneTrafficData.reduce((sum, z) => sum + z.distinct_visitors, 0);
  const camerasOnline = cameras.filter((c) => c.is_active).length;
  // "Current customers" proxy — sum of each camera's live activity count.
  // Not a real headcount (see ACTIVITY_WINDOW_MS note above), just the
  // most honest thing derivable from the live stream right now.
  const currentCustomersProxy = Object.values(cameraActivity).reduce((sum, n) => sum + n, 0);

  function crowdLabel(count: number): { text: string; className: string } {
    if (count === 0) return { text: "Empty", className: "text-muted-foreground" };
    if (count <= 2) return { text: "Low", className: "text-emerald-500" };
    if (count <= 5) return { text: "Medium", className: "text-amber-500" };
    return { text: "High", className: "text-destructive" };
  }

  async function handleExport(format: "pdf" | "excel") {
    if (!store) return;
    setExportError(null);
    setExportingFormat(format);
    try {
      await api.exportStoreReport(store.id, format);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Failed to export report.");
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex">
      <DashboardSidebar roleLabel="Store Manager" storeName={store?.name} sections={SECTIONS} />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>}

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div id="overview" className="flex flex-col gap-4 scroll-mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <KpiCard value={totalVisitors} label="Today's visitors (store-wide)" accent="blue" />
                  <KpiCard value={currentCustomersProxy} label="Current activity (live proxy)" accent="blue" />
                  <KpiCard
                    value={avgDwellSeconds !== null ? `${avgDwellSeconds.toFixed(0)}s` : "—"}
                    label={
                      avgDwellIsTrueAverage
                        ? "Avg. dwell time (this camera)"
                        : "Total dwell time (this camera)"
                    }
                    accent="amber"
                  />
                  <KpiCard value="—" label="Products picked today (not yet real)" accent="green" />
                  <KpiCard value="—" label="Conversion rate (not yet real)" accent="green" />
                  <KpiCard value={`${camerasOnline} / ${cameras.length}`} label="Cameras online" accent="blue" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Products picked and conversion rate need real pickup/purchase tracking, which doesn&apos;t
                  exist yet — shown as placeholders rather than invented numbers. &quot;Current activity&quot; is
                  a live-detection proxy, not a verified headcount. Dwell time shows a true average only when
                  distinct-visitor counts exist for this camera&apos;s shelves; otherwise it falls back to total
                  time and labels itself accordingly.
                </p>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Zone &amp; camera</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex gap-2 flex-wrap">
                      {zones.map((zone) => (
                        <Button
                          key={zone.id}
                          variant={selectedZoneId === zone.id ? "default" : "outline"}
                          onClick={() => setSelectedZoneId(zone.id)}
                        >
                          {zone.name}
                        </Button>
                      ))}
                    </div>
                    {zoneCameras.length > 1 && (
                      <div className="flex gap-2 flex-wrap">
                        {zoneCameras.map((cam) => (
                          <Button
                            key={cam.id}
                              variant={selectedCameraId === cam.id ? "default" : "outline"}
                            onClick={() => setSelectedCameraId(cam.id)}
                          >
                            {cam.name}
                          </Button>
                        ))}
                      </div>
                    )}
                    {zoneCameras.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        The camera picker above only changes Traffic, Dwell KPI, and the Heatmap below —
                        Shelf Performance shows every camera in this zone at once, since a shelf can be
                        visible from more than one angle.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card id="cameras" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Live Cameras</CardTitle>
                </CardHeader>
                <CardContent>
                  {cameras.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No cameras configured for this store.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {cameras.map((cam) => {
                        const count = cameraActivity[cam.id] ?? 0;
                        const crowd = crowdLabel(count);
                        return (
                          <div key={cam.id} className="rounded-md border border-border p-3 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{cam.name}</span>
                              <span
                                className={`text-xs ${
                                  cam.is_active ? "text-emerald-500" : "text-destructive"
                                }`}
                              >
                                {cam.is_active ? "Online" : "Offline"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Activity: {count} · Crowd: <span className={crowd.className}>{crowd.text}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Activity is a count of recent live detections per camera (last {ACTIVITY_WINDOW_MS / 1000}s),
                    not a verified people count — the tracking stream has no frame boundaries or person IDs, so
                    this is the most honest proxy available today. Crowd labels are simple thresholds on that
                    proxy, not a trained classifier.
                  </p>
                </CardContent>
              </Card>

              <Card id="traffic" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Store Traffic</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div>
                    <p className="text-sm font-medium mb-2">Traffic over time — {zoneCameras.find((c) => c.id === selectedCameraId)?.name ?? "no camera"}</p>
                    {trafficData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No traffic data for this camera yet.</p>
                    ) : (
                      <div style={{ width: "100%", height: 200 }}>
                        <ResponsiveContainer>
                          <LineChart data={trafficData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="bucket_start_seconds" fontSize={12} tickFormatter={(v: number) => `${v}s`} />
                            <YAxis allowDecimals={false} fontSize={12} />
                            <Tooltip formatter={(value) => [value ?? 0, "Events"]} />
                            <Line type="monotone" dataKey="event_count" stroke="currentColor" className="text-primary" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Customers by zone (store-wide)</p>
                    {zoneTrafficData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No zone data yet.</p>
                    ) : (
                      <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer>
                          <Treemap
                            data={zoneTrafficData.map((z) => ({
                              name: z.zone_name,
                              value: z.event_count,
                            }))}
                            dataKey="value"
                            stroke="hsl(var(--background))"
                            content={<ZoneTreemapCell />}
                          >
                            <Tooltip formatter={(value) => [value ?? 0, "Tracked events"]} />
                          </Treemap>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      distinct_visitors is a rough cross-camera proxy, not an exact headcount — a shopper
                      seen by two cameras covering the same zone (e.g. Main Product Aisle&apos;s Camera 2
                      and Camera 3) is counted once per camera, not deduplicated into one person.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card id="shelves" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Shelf Performance</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div>
                    <p className="text-sm font-medium mb-2">Shelf engagement score</p>
                    {zoneAttractivenessData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attractiveness data for this zone yet.</p>
                    ) : (
                      <div style={{ width: "100%", height: Math.max(200, zoneAttractivenessData.length * 50) }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={zoneAttractivenessData.map((d) => ({
                              ...d,
                              label: zoneCameras.length > 1 ? `${d.shelf_name} (${d.camera_name})` : d.shelf_name,
                            }))}
                            layout="vertical"
                            margin={{ left: 24 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis type="number" fontSize={12} domain={[0, 1]} />
                            <YAxis dataKey="label" type="category" fontSize={12} width={140} />
                            <Tooltip formatter={(value) => [Number(value ?? 0).toFixed(2), "Score"]} />
                            <Bar dataKey="final_score" fill="currentColor" className="text-primary" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Only the Attention component is real (dwell-time derived); Interaction, Pickup, Purchase,
                      and Repeat are placeholders folded into this score for now. When a shelf is visible from
                      more than one camera, each camera&apos;s reading is shown separately — they&apos;re two
                      real observations of the same shelf from different angles, not duplicate data.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Dwell time by shelf</p>
                    {zoneDwellTimeData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No dwell time data for this zone yet.</p>
                    ) : (
                      <div style={{ width: "100%", height: Math.max(200, zoneDwellTimeData.length * 50) }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={zoneDwellTimeData.map((d) => ({
                              ...d,
                              label: zoneCameras.length > 1 ? `${d.shelf_name} (${d.camera_name})` : d.shelf_name,
                            }))}
                            layout="vertical"
                            margin={{ left: 24 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis type="number" fontSize={12} unit="s" />
                            <YAxis dataKey="label" type="category" fontSize={12} width={140} />
                            <Tooltip formatter={(value) => [`${String(value ?? "")}s`, "Dwell time"]} />
                            <Bar dataKey="total_seconds" fill="currentColor" className="text-primary" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card id="heatmap" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    Store Heatmap — {zoneCameras.find((c) => c.id === selectedCameraId)?.name ?? "no camera"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <canvas ref={canvasRef} width={800} height={450} className="w-full h-auto rounded-md bg-black/90" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Foot-traffic layer, rolling last 60s, one camera at a time — this system only tracks
                    position, not gaze direction, so there&apos;s no separate attention layer.
                  </p>
                </CardContent>
              </Card>

              <Card id="products" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Product Interaction</CardTitle>
                </CardHeader>
                <CardContent>
                  {productInteractions?.products?.length ? (
                    <div className="grid md:grid-cols-3 gap-4 mb-5">
                      {([
                        { key: "pickup_count" as const, label: "Most Picked Products" },
                        { key: "return_count" as const, label: "Most Returned Products" },
                        { key: "comparison_count" as const, label: "Most Compared Products" },
                      ]).map(({ key, label }) => {
                        const ranked = [...productInteractions.products]
                          .filter((p) => (p[key] ?? 0) > 0)
                          .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
                          .slice(0, 5);
                        return (
                          <div key={key}>
                            <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
                            {ranked.length ? (
                              <div className="space-y-1.5">
                                {ranked.map((p) => (
                                  <div key={p.product_name} className="flex items-center justify-between text-sm">
                                    <span className="truncate">{p.product_name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{p[key]}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                {productInteractions.data_quality[key === "pickup_count" ? "pickup" : key === "return_count" ? "return" : "comparison"].startsWith("placeholder")
                                  ? "Run completion interactions for this camera first."
                                  : "No candidates yet."}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  <p className="text-xs text-amber-700 mb-4">
                    Pickup/return are shelf-exit-plus-contact candidates, and comparison is cross-SKU contact within 15s by the same shopper — spatial-temporal heuristics, not hand-level or barcode-confirmed detection.
                  </p>
                  {store && selectedCameraId ? (
                    <CompletionAnalyticsPanel storeId={store.id} cameraId={selectedCameraId} compact />
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a store/camera to load product interaction analytics.</p>
                  )}
                </CardContent>
              </Card>

              <Card id="conversion" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Store Conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const entranceZone = zoneTrafficData.find((z) => z.zone_type === "entrance");
                    const aisleZone = zoneTrafficData.find((z) => z.zone_type === "aisle");
                    const checkoutZone = zoneTrafficData.find((z) => z.zone_type === "checkout");
                    const funnelStages = [
                      { stage: "Entrance", count: entranceZone?.distinct_visitors ?? 0 },
                      { stage: "Product Aisle", count: aisleZone?.distinct_visitors ?? 0 },
                      { stage: "Checkout", count: checkoutZone?.distinct_visitors ?? 0 },
                    ].filter((s) => s.count > 0);
                    const funnelColors = ["currentColor", "#f59e0b", "#10b981"];
                    const entranceCount = entranceZone?.distinct_visitors ?? 0;
                    const checkoutCount = checkoutZone?.distinct_visitors ?? 0;
                    const reachRate = entranceCount > 0
                      ? Math.min(100, Math.round((checkoutCount / entranceCount) * 100))
                      : 0;

                    if (!funnelStages.length) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          No zone traffic data yet — this section needs tracked events in at least the entrance zone.
                        </p>
                      );
                    }

                    return (
                      <div className="grid lg:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Entrance → Aisle → Checkout</h3>
                          <div style={{ width: "100%", height: 260 }}>
                            <ResponsiveContainer>
                              <FunnelChart>
                                <Tooltip formatter={(value, name) => [Number(value ?? 0).toLocaleString(), name]} />
                                <Funnel dataKey="count" data={funnelStages} isAnimationActive>
                                  {funnelStages.map((stage, index) => (
                                    <Cell key={stage.stage} fill={funnelColors[index % funnelColors.length]} className={index === 0 ? "text-primary" : undefined} />
                                  ))}
                                  <LabelList dataKey="stage" position="right" fill="currentColor" fontSize={12} />
                                </Funnel>
                              </FunnelChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Real distinct-visitor counts per zone (see Store Traffic), not a sales funnel — this system
                            doesn&apos;t yet detect individual product pickups or confirmed purchases.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">Checkout Reach Rate</h3>
                          <div style={{ width: "100%", height: 260 }}>
                            <ResponsiveContainer>
                              <RadialBarChart
                                innerRadius="70%"
                                outerRadius="100%"
                                startAngle={180}
                                endAngle={0}
                                barSize={22}
                                data={[{ name: "Checkout reach", value: reachRate, fill: "currentColor" }]}
                              >
                                <RadialBar dataKey="value" cornerRadius={8} className="text-primary" background={{ fill: "hsl(var(--muted))" }} />
                                <text
                                  x="50%"
                                  y="80%"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="fill-current text-2xl font-semibold"
                                >
                                  {reachRate}%
                                </text>
                              </RadialBarChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Share of entrance visitors whose track also appeared in the checkout zone — a real footfall
                            ratio, not a confirmed-sale conversion rate (no purchase detection exists yet).
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card id="alerts" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Store Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {store && selectedCameraId ? (
                    <CompletionAnalyticsPanel storeId={store.id} cameraId={selectedCameraId} compact />
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a camera to load operational alert context.</p>
                  )}
                </CardContent>
              </Card>

              <Card id="reports" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Reports</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {exportError && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{exportError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={exportingFormat !== null}
                      onClick={() => handleExport("pdf")}
                    >
                      {exportingFormat === "pdf" ? "Generating…" : "Export as PDF"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={exportingFormat !== null}
                      onClick={() => handleExport("excel")}
                    >
                      {exportingFormat === "excel" ? "Generating…" : "Export as Excel"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    One export, current snapshot — not separate Daily/Weekly/Monthly/Custom reports. Dwell
                    time and shelf scores here reflect each camera&apos;s most recent tracking run only; the
                    system doesn&apos;t yet support querying them by date range, so a real Daily vs. Weekly
                    report isn&apos;t possible without that backend work first.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
