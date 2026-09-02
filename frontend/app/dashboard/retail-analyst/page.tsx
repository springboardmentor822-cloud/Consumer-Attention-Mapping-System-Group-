"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, Store, Zone, Camera, DwellTimeEntry, TrafficPoint, ZoneTraffic, AttractivenessEntry, AttractivenessHistoryPoint, SegmentDistribution, ProductInteractionResponse, getApiBaseUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Treemap, ComposedChart, ScatterChart, Scatter, ZAxis } from "recharts";
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

// Quartile stats for a Box Plot, computed from real raw values (not
// pre-binned buckets) - see the callers below for exactly which raw
// values feed this. Linear interpolation between ranks, same method
// Excel/numpy's default use.
function quartileStats(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => {
    const pos = (sorted.length - 1) * p;
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
  };
  return {
    min: sorted[0],
    q1: q(0.25),
    median: q(0.5),
    q3: q(0.75),
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}

// Recharts has no native box-plot element, so this is a custom SVG shape
// drawn onto an invisible Bar - the standard recharts pattern for chart
// types the library doesn't ship. yScale maps a raw value to a pixel y
// position within the chart's plot area; passed in from the caller since
// this shape function only receives its own bar's box, not the axis.
function BoxPlotShape(props: {
  x?: number;
  width?: number;
  payload?: { min: number; q1: number; median: number; q3: number; max: number };
  yScale?: (v: number) => number;
}) {
  const { x = 0, width = 0, payload, yScale } = props;
  if (!payload || !yScale) return null;
  const cx = x + width / 2;
  const boxWidth = Math.min(36, width * 0.6);
  const yMin = yScale(payload.min);
  const yQ1 = yScale(payload.q1);
  const yMedian = yScale(payload.median);
  const yQ3 = yScale(payload.q3);
  const yMax = yScale(payload.max);
  return (
    <g className="text-primary">
      <line x1={cx} x2={cx} y1={yMax} y2={yQ3} stroke="currentColor" strokeWidth={1.5} />
      <line x1={cx} x2={cx} y1={yQ1} y2={yMin} stroke="currentColor" strokeWidth={1.5} />
      <line x1={cx - boxWidth / 4} x2={cx + boxWidth / 4} y1={yMax} y2={yMax} stroke="currentColor" strokeWidth={1.5} />
      <line x1={cx - boxWidth / 4} x2={cx + boxWidth / 4} y1={yMin} y2={yMin} stroke="currentColor" strokeWidth={1.5} />
      <rect
        x={cx - boxWidth / 2}
        y={yQ3}
        width={boxWidth}
        height={Math.max(1, yQ1 - yQ3)}
        fill="currentColor"
        fillOpacity={0.25}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <line x1={cx - boxWidth / 2} x2={cx + boxWidth / 2} y1={yMedian} y2={yMedian} stroke="currentColor" strokeWidth={2} />
    </g>
  );
}

type LiveTrackingMessage = {
  camera_id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

// Zone-wide variants of the shelf-scoped types, tagged with which camera
// each row came from. A shelf visible from more than one camera (e.g.
// Clothing/Accessories, both seen by Camera 2 and Camera 3) previously
// only ever showed whichever single camera happened to be selected, with
// no indication the same shelf existed elsewhere — see Store Manager's
// identical fix for the full reasoning.
type ZoneDwellEntry = DwellTimeEntry & { camera_id: string; camera_name: string };
type ZoneAttractivenessEntry = AttractivenessEntry & { camera_id: string; camera_name: string };

const WINDOW_MS = 60_000;
type PointEvent = { x: number; y: number; t: number };

// Custom Treemap cell — recharts renders unlabeled bare rects by default.
// Opacity scales by rank instead of introducing a new color palette, to
// stay inside the theme's single text-primary hue used everywhere else
// on this dashboard. Same pattern as store-manager/page.tsx's
// ZoneTreemapCell — not shared via a common component file since neither
// page currently imports from the other's directory.
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
  { id: "heatmap", label: "Heatmap" },
  { id: "dwell", label: "Dwell time" },
  { id: "dwell-distribution", label: "Dwell Time Distribution" },
  { id: "attractiveness", label: "Attractiveness scores" },
  { id: "trend", label: "Attractiveness trend" },
  { id: "attention-distribution", label: "Attention Time Distribution" },
  { id: "traffic", label: "Traffic over time" },
  { id: "zones", label: "Zone comparison" },
  { id: "product-analytics", label: "Product Analytics" },
  { id: "segments", label: "Shopper segments" },
  { id: "zone-performance", label: "Zone Performance" },
  { id: "shopping-behaviour", label: "Shopping Behaviour" },
  { id: "behavioral-analytics", label: "Behavioral Analytics" },
  { id: "ai-insights", label: "AI Insights" },
  { id: "reports", label: "Reports & Export" },
  { id: "journey", label: "Customer journey" },
];

export default function RetailAnalystDashboard() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<SimpleHeatInstance | null>(null);
  const pointsRef = useRef<PointEvent[]>([]);
  const maxSeenRef = useRef({ x: 1, y: 1 });

  const [store, setStore] = useState<Store | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Single-camera-scoped: overview KPIs ("this camera"), traffic-over-time,
  // and segment distribution are genuinely per-camera concepts (a live
  // event stream / a per-camera segmentation run) — left as-is, same as
  // Store Manager's overview KPIs and heatmap.
  const [dwellTimeData, setDwellTimeData] = useState<DwellTimeEntry[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [zoneTrafficData, setZoneTrafficData] = useState<ZoneTraffic[]>([]);
  const [attractivenessData, setAttractivenessData] = useState<AttractivenessEntry[]>([]);
  const [historyData, setHistoryData] = useState<AttractivenessHistoryPoint[]>([]);
  const [segmentData, setSegmentData] = useState<SegmentDistribution | null>(null);
  const [productAnalyticsData, setProductAnalyticsData] = useState<ProductInteractionResponse | null>(null);
  const [productAnalyticsLoading, setProductAnalyticsLoading] = useState(false);
  const [productAnalyticsError, setProductAnalyticsError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<import("@/lib/api").RecommendationEntry[]>([]);
  const [zonePerformance, setZonePerformance] = useState<{ zone_id: string; zone_name: string; score: number | null; visitors: number; events: number }[]>([]);

  // Zone-wide: the actual bug fix. Dwell time and attractiveness are
  // shelf-level facts, and a shelf can be seen by more than one camera —
  // these aggregate across every camera in the selected zone instead of
  // just the selected one.
  const [zoneDwellTimeData, setZoneDwellTimeData] = useState<ZoneDwellEntry[]>([]);
  const [zoneAttractivenessData, setZoneAttractivenessData] = useState<ZoneAttractivenessEntry[]>([]);

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
      const zoneTrafficData = await api.getZoneTraffic(activeStore.id);
      setZoneTrafficData(zoneTrafficData);
      api.getRecommendations(activeStore.id).then(setRecommendations).catch(() => setRecommendations([]));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load Retail Analyst dashboard");
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
      if (msg.camera_id !== selectedCameraId) return;
      const cx = (msg.x1 + msg.x2) / 2;
      const cy = (msg.y1 + msg.y2) / 2;
      maxSeenRef.current.x = Math.max(maxSeenRef.current.x, cx);
      maxSeenRef.current.y = Math.max(maxSeenRef.current.y, cy);
      pointsRef.current.push({ x: cx, y: cy, t: Date.now() });
    };
    return () => ws.close();
  }, [selectedCameraId]);

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

  // Single-camera-scoped fetches — unchanged in scope, just what feeds
  // the "this camera" KPI cards, the heatmap, traffic-over-time, and
  // segment distribution.
  useEffect(() => {
    if (!store || !selectedCameraId) {
      setDwellTimeData([]);
      setTrafficData([]);
      setAttractivenessData([]);
      return;
    }
    api.getDwellTime(store.id, selectedCameraId).then(setDwellTimeData).catch(() => setDwellTimeData([]));
    api.getTrafficOverTime(store.id, selectedCameraId).then(setTrafficData).catch(() => setTrafficData([]));
    api.getAttractiveness(store.id, selectedCameraId).then(setAttractivenessData).catch(() => setAttractivenessData([]));
    api.getAttractivenessHistory(store.id, selectedCameraId).then(setHistoryData).catch(() => setHistoryData([]));
    api.getSegmentDistribution(store.id, selectedCameraId).then(setSegmentData).catch(() => setSegmentData(null));
    setProductAnalyticsLoading(true);
    setProductAnalyticsError(null);
    api.getProductInteractions(store.id, selectedCameraId)
      .then(setProductAnalyticsData)
      .catch((err) => {
        setProductAnalyticsData(null);
        setProductAnalyticsError(err instanceof ApiError ? err.message : "Failed to load product analytics.");
      })
      .finally(() => setProductAnalyticsLoading(false));
  }, [store, selectedCameraId]);

  const zoneCameras = cameras.filter((c) => c.zone_id === selectedZoneId);
  const zoneCameraIds = zoneCameras.map((c) => c.id).join(",");

  // Zone-wide fetch — the actual fix. Fires once per zone (not per camera
  // click), pulling dwell time + attractiveness from every camera that
  // covers this zone and tagging each row with its source camera.
  useEffect(() => {
    if (!store || zoneCameras.length === 0) {
      setZoneDwellTimeData([]);
      setZoneAttractivenessData([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      zoneCameras.map((cam) =>
        Promise.all([
          api.getDwellTime(store.id, cam.id).catch(() => [] as DwellTimeEntry[]),
          api.getAttractiveness(store.id, cam.id).catch(() => [] as AttractivenessEntry[]),
        ]).then(([dwell, attr]) => ({
          dwell: dwell.map((d) => ({ ...d, camera_id: cam.id, camera_name: cam.name })),
          attr: attr.map((a) => ({ ...a, camera_id: cam.id, camera_name: cam.name })),
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      setZoneDwellTimeData(results.flatMap((r) => r.dwell));
      setZoneAttractivenessData(results.flatMap((r) => r.attr));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, zoneCameraIds]);

  useEffect(() => {
    if (!store || zones.length === 0) { setZonePerformance([]); return; }
    let cancelled = false;
    Promise.all(zones.map(async (zone) => {
      const cams = cameras.filter((c) => c.zone_id === zone.id);
      const attrs = (await Promise.all(cams.map((cam) => api.getAttractiveness(store.id, cam.id).catch(() => [] as AttractivenessEntry[])))).flat();
      const traffic = zoneTrafficData.find((z) => z.zone_id === zone.id);
      return { zone_id: zone.id, zone_name: zone.name, score: attrs.length ? attrs.reduce((sum, a) => sum + a.final_score, 0) / attrs.length : null, visitors: traffic?.distinct_visitors ?? 0, events: traffic?.event_count ?? 0 };
    })).then((rows) => { if (!cancelled) setZonePerformance(rows); });
    return () => { cancelled = true; };
  }, [store, zones, cameras, zoneTrafficData]);

  const showCameraLabel = zoneCameras.length > 1;

  const zoneDwellChartData = zoneDwellTimeData.map((d) => ({
    ...d,
    display_name: showCameraLabel ? `${d.shelf_name} (${d.camera_name})` : d.shelf_name,
  }));

  const totalDwellSeconds = dwellTimeData.reduce((sum, d) => sum + d.total_seconds, 0);
  const totalVisitors = zoneTrafficData.reduce((sum, z) => sum + z.distinct_visitors, 0);
  const avgAttractiveness =
    attractivenessData.length > 0
      ? attractivenessData.reduce((sum, a) => sum + a.final_score, 0) / attractivenessData.length
      : null;

  // Pivot flat history rows (one per shelf per timestamp) into one row per
  // timestamp with a column per shelf name, for a multi-line trend chart.
  // Only meaningful with 2+ distinct timestamps - a single-run history is
  // a snapshot, not a trend, so the chart section says so explicitly below
  // rather than rendering a flat one-point "line".
  const trendShelfNames = Array.from(new Set(historyData.map((h) => h.shelf_name)));
  const trendTimestamps = Array.from(new Set(historyData.map((h) => h.computed_at))).sort();
  const trendChartData = trendTimestamps.map((ts) => {
    const row: Record<string, string | number> = {
      time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    for (const shelfName of trendShelfNames) {
      const point = historyData.find((h) => h.computed_at === ts && h.shelf_name === shelfName);
      if (point) row[shelfName] = point.final_score;
    }
    return row;
  });
  const trendColors = ["currentColor", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

  function downloadAnalystExport() {
    const rows = productAnalyticsData?.products ?? [];
    const header = ["Product", "Tracks", "Observations", "VisibleSeconds", "Pickup", "Return", "Comparison", "Purchase"];
    const csv = [header, ...rows.map((p) => [p.product_name, p.observed_track_count, p.observation_count, p.estimated_visible_seconds.toFixed(1), p.pickup_count ?? "", p.return_count ?? "", p.comparison_count ?? "", p.purchase_count ?? ""])].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `retail-analyst-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-muted flex">
      <DashboardSidebar roleLabel="Retail Analyst" storeName={store?.name} sections={SECTIONS} />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>}

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div id="overview" className="flex flex-col gap-4 scroll-mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <KpiCard value={totalVisitors} label="Store-wide distinct visitors" accent="blue" />
                  <KpiCard
                    value={avgAttractiveness !== null ? avgAttractiveness.toFixed(2) : "—"}
                    label="Avg. attractiveness (this camera)"
                    accent="green"
                  />
                  <KpiCard value={`${totalDwellSeconds.toFixed(0)}s`} label="Total dwell time (this camera)" accent="amber" />
                </div>

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
                  </CardContent>
                </Card>
              </div>

              <Card id="heatmap" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    Heatmap — {zoneCameras.find((c) => c.id === selectedCameraId)?.name ?? "no camera"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <canvas ref={canvasRef} width={800} height={450} className="w-full h-auto rounded-md bg-black/90" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Foot-traffic layer, rolling last 60s. No separate gaze-vs-foot-traffic toggle — this system
                    only tracks position, not gaze direction, so there's one real layer, not two.
                  </p>
                </CardContent>
              </Card>

              <Card id="dwell" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Dwell time by shelf</CardTitle>
                </CardHeader>
                <CardContent>
                  {zoneDwellChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No dwell time data for this zone yet.</p>
                  ) : (
                    <div style={{ width: "100%", height: Math.max(200, zoneDwellChartData.length * 50) }}>
                      <ResponsiveContainer>
                        <BarChart data={zoneDwellChartData} layout="vertical" margin={{ left: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" fontSize={12} unit="s" />
                          <YAxis dataKey="display_name" type="category" fontSize={12} width={140} />
                          <Tooltip formatter={(value) => [`${String(value ?? "")}s`, "Dwell time"]} />
                          <Bar dataKey="total_seconds" fill="currentColor" className="text-primary" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {showCameraLabel && (
                    <p className="text-xs text-muted-foreground mt-2">
                      This zone has more than one camera — bars are labeled per camera so the same shelf seen
                      from different cameras isn&apos;t mistaken for two shelves.
                    </p>
                  )}
                </CardContent>
              </Card>

              {(() => {
                const shelvesWithVisits = zoneDwellChartData.filter((d) => d.per_visitor_seconds.length >= 2);
                if (!shelvesWithVisits.length) return null;
                const globalMax = Math.max(...shelvesWithVisits.flatMap((d) => d.per_visitor_seconds));
                // Simplified violin: bin each shelf's real per-visitor seconds into
                // 10 buckets and mirror the counts left/right of center - a real
                // distribution shape from real per-visit values, not a KDE curve,
                // but genuinely computed from the raw numbers above, not faked.
                const binCount = 10;
                const violinData = shelvesWithVisits.map((d) => {
                  const binSize = globalMax / binCount || 1;
                  const bins = new Array(binCount).fill(0);
                  for (const v of d.per_visitor_seconds) {
                    const idx = Math.min(binCount - 1, Math.floor(v / binSize));
                    bins[idx] += 1;
                  }
                  const maxBinCount = Math.max(...bins, 1);
                  return { name: d.display_name, bins, maxBinCount, visitors: d.per_visitor_seconds.length };
                });
                return (
                  <Card id="dwell-distribution" className="scroll-mt-6">
                    <CardHeader>
                      <CardTitle className="text-base">Dwell Time Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        {violinData.map((shelf) => (
                          <div key={shelf.name}>
                            <p className="text-sm font-medium mb-1">{shelf.name}</p>
                            <div className="flex items-end gap-px h-28">
                              {shelf.bins.map((count, i) => {
                                const widthPct = Math.max(4, (count / shelf.maxBinCount) * 50);
                                return (
                                  <div key={i} className="flex-1 flex items-center justify-center h-full" title={`${count} visits`}>
                                    <div
                                      className="bg-primary/60 rounded-full"
                                      style={{ width: `${widthPct}%`, height: "100%" }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {shelf.visitors} tracked visits, low → high dwell seconds left to right
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Width per bucket is the real count of tracked visitors whose dwell time fell in that range for this camera&apos;s most recent run. Needs at least 2 tracked visits per shelf to render.
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card id="attractiveness" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Attractiveness scores</CardTitle>
                </CardHeader>
                <CardContent>
                  {zoneAttractivenessData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attractiveness data for this zone yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border">
                          <th className="py-2 font-medium">Shelf</th>
                          {showCameraLabel && <th className="py-2 font-medium">Camera</th>}
                          <th className="py-2 font-medium">Score</th>
                          <th className="py-2 font-medium">Attention</th>
                          <th className="py-2 font-medium">Interaction</th>
                          <th className="py-2 font-medium">Pickup</th>
                          <th className="py-2 font-medium">Purchase</th>
                          <th className="py-2 font-medium">Repeat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zoneAttractivenessData.map((a) => (
                          <tr key={`${a.camera_id}-${a.shelf_id}`} className="border-b border-border last:border-0">
                            <td className="py-2">{a.shelf_name}</td>
                            {showCameraLabel && <td className="py-2 text-muted-foreground">{a.camera_name}</td>}
                            <td className="py-2 font-medium">{a.final_score.toFixed(3)}</td>
                            <td className="py-2">{a.attention_score.toFixed(2)}</td>
                            <td className="py-2 text-muted-foreground">{a.interaction_score.toFixed(2)}</td>
                            <td className="py-2 text-muted-foreground">{a.pickup_score.toFixed(2)}</td>
                            <td className="py-2 text-muted-foreground">{a.purchase_score.toFixed(2)}</td>
                            <td className="py-2 text-muted-foreground">{a.repeat_score.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Grey columns are placeholder/mock values, not real detection yet. No column filtering built.
                  </p>
                </CardContent>
              </Card>

              <Card id="trend" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Attractiveness trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {trendTimestamps.length < 2 ? (
                    <p className="text-sm text-muted-foreground">
                      Not enough history yet — needs the scheduler (recommendation_scheduler.py) to have run at
                      least twice for this camera. One data point is a snapshot, not a trend.
                    </p>
                  ) : (
                    <div style={{ width: "100%", height: 220 }}>
                      <ResponsiveContainer>
                        <LineChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="time" fontSize={12} />
                          <YAxis domain={[0, 1]} fontSize={12} />
                          <Tooltip formatter={(value) => [Number(value ?? 0).toFixed(3), "Score"]} />
                          <Legend />
                          {trendShelfNames.map((name, i) => (
                            <Line
                              key={name}
                              type="monotone"
                              dataKey={name}
                              stroke={trendColors[i % trendColors.length]}
                              dot={false}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Every scored run for this camera, bounded by the scheduler&apos;s retention window (default 7
                    days). See attractiveness_score.py's get_attractiveness_history().
                  </p>
                </CardContent>
              </Card>

              {(() => {
                if (trendTimestamps.length < 2) return null;
                const boxData = trendShelfNames
                  .map((name) => {
                    const values = historyData.filter((h) => h.shelf_name === name).map((h) => h.attention_score);
                    const stats = quartileStats(values);
                    return stats ? { name, ...stats } : null;
                  })
                  .filter((d): d is NonNullable<typeof d> => d !== null && d.count >= 2);
                if (!boxData.length) return null;
                const globalMax = Math.max(...boxData.map((d) => d.max), 0.01);
                const chartHeight = 260;
                const yScale = (v: number) => chartHeight - (v / globalMax) * chartHeight;
                return (
                  <Card id="attention-distribution" className="scroll-mt-6">
                    <CardHeader>
                      <CardTitle className="text-base">Attention Time Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: "100%", height: chartHeight + 40 }}>
                        <ResponsiveContainer>
                          <ComposedChart data={boxData} margin={{ top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={60} />
                            <YAxis domain={[0, globalMax]} tickFormatter={(v) => v.toFixed(2)} fontSize={11} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload as (typeof boxData)[number];
                                return (
                                  <div className="rounded-md border border-border bg-background p-3 text-xs shadow-sm">
                                    <p className="font-medium">{d.name}</p>
                                    <p>Max: {d.max.toFixed(3)}</p>
                                    <p>Q3: {d.q3.toFixed(3)}</p>
                                    <p>Median: {d.median.toFixed(3)}</p>
                                    <p>Q1: {d.q1.toFixed(3)}</p>
                                    <p>Min: {d.min.toFixed(3)}</p>
                                    <p className="text-muted-foreground mt-1">{d.count} snapshots</p>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="max" fill="transparent" shape={<BoxPlotShape yScale={yScale} />} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Real distribution of this camera&apos;s attention-score snapshots per shelf across the retention window — not pre-binned buckets. Needs at least 2 snapshots per shelf.
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card id="traffic" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Traffic over time</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Card id="zones" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Zone comparison</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Card id="product-analytics" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Product Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    SKU-level product visibility for the selected camera, derived from real product tracking
                    observations inside configured shelf-camera views.
                  </p>

                  {productAnalyticsError && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                      {productAnalyticsError}
                    </p>
                  )}

                  {productAnalyticsLoading && !productAnalyticsData ? (
                    <p className="text-sm text-muted-foreground">Loading product analytics...</p>
                  ) : productAnalyticsData?.products?.length ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <KpiCard value={productAnalyticsData.products.length} label="Tracked products" accent="blue" />
                        <KpiCard
                          value={productAnalyticsData.products.reduce((sum, p) => sum + p.observation_count, 0)}
                          label="Observations"
                          accent="green"
                        />
                        <KpiCard
                          value={productAnalyticsData.products.reduce((sum, p) => sum + p.observed_track_count, 0)}
                          label="Observed tracks"
                          accent="amber"
                        />
                        <KpiCard value="Real" label="Visibility signal" accent="blue" />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 my-4">
                        {([
                          { key: "pickup_count" as const, label: "Most Picked Products" },
                          { key: "return_count" as const, label: "Most Returned Products" },
                          { key: "comparison_count" as const, label: "Most Compared Products" },
                        ]).map(({ key, label }) => {
                          const ranked = [...productAnalyticsData.products]
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
                                  Run completion interactions for this camera to compute candidates.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground border-b border-border">
                              <th className="py-2 px-3 font-medium">Rank</th>
                              <th className="py-2 px-3 font-medium">Product</th>
                              <th className="py-2 px-3 font-medium">Shelf</th>
                              <th className="py-2 px-3 font-medium">Tracks</th>
                              <th className="py-2 px-3 font-medium">Observations</th>
                              <th className="py-2 px-3 font-medium">Visible time</th>
                              <th className="py-2 px-3 font-medium">Pickup / Return / Compare</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productAnalyticsData.products.slice(0, 10).map((product, index) => (
                              <tr key={`${product.product_name}-${index}`} className="border-b border-border last:border-0">
                                <td className="py-2 px-3 font-medium">{index + 1}</td>
                                <td className="py-2 px-3">{product.product_name}</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  {product.shelves.map((s) => s.shelf_name).join(", ") || "—"}
                                </td>
                                <td className="py-2 px-3">{product.observed_track_count}</td>
                                <td className="py-2 px-3">{product.observation_count}</td>
                                <td className="py-2 px-3">{product.estimated_visible_seconds.toFixed(1)}s</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  {product.pickup_count === null
                                    ? "Not yet computed"
                                    : `${product.pickup_count} / ${product.return_count} / ${product.comparison_count}`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No product-level tracking observations are available for this camera yet.
                    </p>
                  )}

                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                    Product visibility is a real tracking signal. Pickup and return are shelf-exit/entry-plus-contact
                    candidates, and comparison is cross-SKU contact by the same shopper within 15 seconds — real
                    spatial-temporal heuristics computed from tracking data, not hand-level or barcode-confirmed
                    detection. Purchase still requires a POS transaction source and is not inferred here.
                  </div>
                </CardContent>
              </Card>

              <Card id="segments" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Shopper segment distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {!segmentData || segmentData.total_sessions === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No segments computed for this camera yet — run compute_shopper_segments.py against it
                      first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Segments ({segmentData.total_sessions} sessions, most recent run)
                        </p>
                        <div style={{ width: "100%", height: 220 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={segmentData.segment_counts}
                                dataKey="count"
                                nameKey="segment_label"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={(entry) => String((entry as { segment_label?: string }).segment_label ?? "")}
                              >
                                {segmentData.segment_counts.map((_, i) => (
                                  <Cell key={i} fill={trendColors[i % trendColors.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Dwell time distribution</p>
                        <div style={{ width: "100%", height: 220 }}>
                          <ResponsiveContainer>
                            <BarChart data={segmentData.dwell_time_buckets}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="bucket" fontSize={12} />
                              <YAxis allowDecimals={false} fontSize={12} />
                              <Tooltip formatter={(value) => [value ?? 0, "Sessions"]} />
                              <Bar dataKey="count" fill="currentColor" className="text-primary" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    &quot;Latest run&quot; isolation is a timestamp-proximity heuristic (10s window), not a hard
                    marker — see shopper_segments_read.py.
                  </p>
                </CardContent>
              </Card>

              <Card id="zone-performance" className="scroll-mt-6">
                <CardHeader><CardTitle className="text-base">Zone Performance</CardTitle></CardHeader>
                <CardContent>
                  {zonePerformance.length === 0 ? <p className="text-sm text-muted-foreground">No zone performance data yet.</p> : <div className="overflow-x-auto rounded-md border border-border"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="px-3 py-2">Zone</th><th className="px-3 py-2">Engagement score</th><th className="px-3 py-2">Visitors</th><th className="px-3 py-2">Tracked events</th></tr></thead><tbody>{[...zonePerformance].sort((a,b)=>(b.score ?? -1)-(a.score ?? -1)).map((z) => <tr key={z.zone_id} className="border-b border-border last:border-0"><td className="px-3 py-2 font-medium">{z.zone_name}</td><td className="px-3 py-2">{z.score == null ? "—" : `${(z.score * 100).toFixed(1)}%`}</td><td className="px-3 py-2">{z.visitors}</td><td className="px-3 py-2">{z.events}</td></tr>)}</tbody></table></div>}
                  <p className="text-xs text-muted-foreground mt-2">Engagement score is the mean of available product/shelf attractiveness scores for cameras covering each zone; it is not a separately trained zone model.</p>
                </CardContent>
              </Card>

              <Card id="shopping-behaviour" className="scroll-mt-6">
                <CardHeader><CardTitle className="text-base">Shopping Behaviour</CardTitle></CardHeader>
                <CardContent>
                  {productAnalyticsData?.products?.length ? <div style={{ width: "100%", height: 300 }}><ResponsiveContainer><BarChart data={productAnalyticsData.products.slice(0, 10).map((p) => ({ name: p.product_name, Viewed: p.observation_count, Tracks: p.observed_track_count }))}><CartesianGrid strokeDasharray="3 3" className="stroke-border"/><XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" height={70}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="Viewed" fill="currentColor" className="text-primary"/><Bar dataKey="Tracks" fill="currentColor" className="text-muted-foreground"/></BarChart></ResponsiveContainer></div> : <p className="text-sm text-muted-foreground">No product observation data for the selected camera.</p>}
                  <p className="text-xs text-muted-foreground">This chart uses real product visibility observations. It does not claim pickup or purchase behaviour where those signals are unavailable.</p>
                </CardContent>
              </Card>

              {(() => {
                const bubbleData = zoneAttractivenessData
                  .map((a) => {
                    const dwell = zoneDwellTimeData.find((d) => d.shelf_id === a.shelf_id);
                    return dwell
                      ? {
                          name: a.shelf_name,
                          attention: a.attention_score,
                          purchase: a.purchase_score,
                          dwell: dwell.total_seconds,
                        }
                      : null;
                  })
                  .filter((d): d is NonNullable<typeof d> => d !== null);
                if (!bubbleData.length) return null;
                return (
                  <Card id="behavioral-analytics" className="scroll-mt-6">
                    <CardHeader><CardTitle className="text-base">Behavioral Analytics</CardTitle></CardHeader>
                    <CardContent>
                      <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis type="number" dataKey="attention" name="Attention" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} fontSize={11} />
                            <YAxis type="number" dataKey="purchase" name="Purchase" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} fontSize={11} />
                            <ZAxis type="number" dataKey="dwell" range={[60, 400]} name="Dwell seconds" />
                            <Tooltip
                              cursor={{ strokeDasharray: "3 3" }}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload as (typeof bubbleData)[number];
                                return (
                                  <div className="rounded-md border border-border bg-background p-3 text-xs shadow-sm">
                                    <p className="font-medium">{d.name}</p>
                                    <p>Attention: {(d.attention * 100).toFixed(1)}%</p>
                                    <p>Purchase: {(d.purchase * 100).toFixed(1)}%</p>
                                    <p>Dwell: {d.dwell.toFixed(1)}s</p>
                                  </div>
                                );
                              }}
                            />
                            <Scatter name="Shelves" data={bubbleData} fill="currentColor" className="text-primary" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Bubble size is real dwell time (seconds). Attention is real; Purchase is a provider-backed proxy until real purchase detection replaces it.
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card id="ai-insights" className="scroll-mt-6">
                <CardHeader><CardTitle className="text-base">AI Insights</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.length ? recommendations.map((r, i) => <div key={`${r.rule_type}-${i}`} className="rounded-md border border-border p-3"><div className="flex items-center justify-between gap-3"><span className="font-medium text-sm">{r.action_item}</span><span className="text-xs uppercase text-muted-foreground">{r.priority}</span></div><p className="text-sm text-muted-foreground mt-1">{r.target_description}</p><p className="text-xs text-muted-foreground mt-2">Expected uplift: {r.expected_conversion_uplift_pct.toFixed(1)}%{r.is_estimate ? " (estimate)" : ""}{r.based_on_mock?.length ? ` · Mock inputs: ${r.based_on_mock.join(", ")}` : ""}</p></div>) : <p className="text-sm text-muted-foreground">No recommendation rules have fired for this store yet.</p>}
                </CardContent>
              </Card>

              <Card id="reports" className="scroll-mt-6">
                <CardHeader><CardTitle className="text-base">Reports & Export</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Export the currently loaded product analytics as CSV. This is a local snapshot of available backend data.</p>
                  <Button variant="outline" onClick={downloadAnalystExport} disabled={!productAnalyticsData?.products?.length}>Export Product Analytics CSV</Button>
                  <p className="text-xs text-muted-foreground">The existing PDF/Excel store report endpoint is restricted to Store Manager/SuperAdmin, so this Analyst export does not bypass that access rule.</p>
                </CardContent>
              </Card>

              <Card id="journey" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Customer journey path diagram</CardTitle>
                </CardHeader>
                <CardContent>
                  {store && selectedCameraId ? (
                    <CompletionAnalyticsPanel storeId={store.id} cameraId={selectedCameraId} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a store/camera to load journey analytics.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
