"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, Store, Zone, Camera, DwellTimeEntry, TrafficPoint, ZoneTraffic, AttractivenessEntry, RecommendationEntry, getApiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// simpleheat has no official types â€” minimal shape for what we use here.
// npm install simpleheat
type SimpleHeatInstance = {
  data: (points: [number, number, number][]) => SimpleHeatInstance;
  max: (v: number) => SimpleHeatInstance;
  radius: (r: number, blur?: number) => SimpleHeatInstance;
  draw: (minOpacity?: number) => SimpleHeatInstance;
  resize: () => void;
};

// Confirmed against the actual broadcast_batch() payload in
// app/workers/timescale_writer.py.
type LiveTrackingMessage = {
  camera_id: string;
  track_id?: number;
  class_name?: string | null;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  frame_index?: number;
  event_time?: string;
};

const WINDOW_MS = 60_000; // keep a rolling 60s of activity, matches a "live" heatmap rather than an all-time accumulation

type PointEvent = { x: number; y: number; t: number };

function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<SimpleHeatInstance | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pointsRef = useRef<PointEvent[]>([]);
  const maxSeenRef = useRef({ x: 1, y: 1 }); // dynamic scale â€” see note in render
  const activityBucketsRef = useRef<Map<number, number>>(new Map()); // bucketStartMs -> event count, for the live activity chart

  const [store, setStore] = useState<Store | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed" | "error">("connecting");
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- auth + initial data load (same pattern as app/stores/page.tsx) ----
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
        setError("No stores yet â€” add one from the Stores page before viewing the dashboard.");
        setLoading(false);
        return;
      }
      // Single global dashboard for now â€” first store, per current scope.
      // When multi-store views are needed, this becomes a route param
      // (/stores/[storeId]/dashboard) instead of a rewrite.
      const activeStore = stores[0];
      setStore(activeStore);

      const zoneList = await api.listZones(activeStore.id);
      setZones(zoneList);
      if (zoneList.length > 0) setSelectedZoneId(zoneList[0].id);

      const cameraList = await api.listCameras(activeStore.id);
      setCameras(cameraList);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  // pick a default camera whenever the zone changes
  useEffect(() => {
    if (!selectedZoneId) return;
    const zoneCameras = cameras.filter((c) => c.zone_id === selectedZoneId);
    setSelectedCameraId(zoneCameras[0]?.id ?? null);
    // reset heatmap state on zone/camera switch â€” old points belong to a different feed
    pointsRef.current = [];
    maxSeenRef.current = { x: 1, y: 1 };
  }, [selectedZoneId, cameras]);

  // ---- WebSocket ----
  useEffect(() => {
    const base = getApiBaseUrl().replace(/^http/, "ws");
    const ws = new WebSocket(`${base}/ws/live-tracking`);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => setWsStatus("open");
    ws.onclose = () => setWsStatus("closed");
    ws.onerror = () => setWsStatus("error");

    ws.onmessage = (event) => {
      let msg: LiveTrackingMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return; // not JSON â€” ignore rather than crash the socket handler
      }
      if (msg.camera_id !== selectedCameraId) return;

      const cx = (msg.x1 + msg.x2) / 2;
      const cy = (msg.y1 + msg.y2) / 2;

      // Dynamic scale: we don't have each camera's real frame resolution
      // on the frontend yet, so track the largest coordinate seen and
      // normalize against it. Good enough for a relative "hot vs cold"
      // read; will drift if the feed's extremes haven't been seen yet.
      // Proper fix: expose frame_width/frame_height on Camera and use that.
      maxSeenRef.current.x = Math.max(maxSeenRef.current.x, cx);
      maxSeenRef.current.y = Math.max(maxSeenRef.current.y, cy);

      pointsRef.current.push({ x: cx, y: cy, t: Date.now() });
      setEventCount((n) => n + 1);

      const bucketMs = 2000; // 2-second buckets, matches the heatmap's own redraw cadence roughly
      const bucketKey = Math.floor(Date.now() / bucketMs) * bucketMs;
      activityBucketsRef.current.set(bucketKey, (activityBucketsRef.current.get(bucketKey) ?? 0) + 1);
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId]);

  // ---- heatmap render loop ----
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
    const interval = setInterval(draw, 300); // redraw a few times a second, not on every single event
    return () => clearInterval(interval);
  }, [draw]);

  const [activityData, setActivityData] = useState<{ time: string; count: number }[]>([]);

  // ---- recommendations feed (store-wide, not scoped to the selected camera â€”
  // the rule engine evaluates every shelf/zone in the store at once) ----
  const [recommendations, setRecommendations] = useState<RecommendationEntry[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  useEffect(() => {
    if (!store) {
      setRecommendations([]);
      return;
    }
    let cancelled = false;
    setRecommendationsLoading(true);
    setRecommendationsError(null);
    api
      .getRecommendations(store.id)
      .then((data) => {
        if (!cancelled) setRecommendations(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setRecommendationsError(err instanceof ApiError ? err.message : "Failed to load recommendations");
      })
      .finally(() => {
        if (!cancelled) setRecommendationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  // ---- dwell time by shelf (this recorded run, per compute_dwell_time.py) ----
  const [dwellTimeData, setDwellTimeData] = useState<DwellTimeEntry[]>([]);
  const [dwellTimeLoading, setDwellTimeLoading] = useState(false);
  const [dwellTimeError, setDwellTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (!store || !selectedCameraId) {
      setDwellTimeData([]);
      return;
    }
    let cancelled = false;
    setDwellTimeLoading(true);
    setDwellTimeError(null);
    api
      .getDwellTime(store.id, selectedCameraId)
      .then((data) => {
        if (!cancelled) setDwellTimeData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        // Not run through the same 401-redirect handling as loadInitialData -
        // a dwell-time fetch failing shouldn't kick the user to /login,
        // it's a much lower-stakes failure than the initial store/zone load.
        setDwellTimeError(err instanceof ApiError ? err.message : "Failed to load dwell time data");
      })
      .finally(() => {
        if (!cancelled) setDwellTimeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store, selectedCameraId]);

  // ---- traffic over time (this recorded run, bucketed by elapsed video time) ----
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficError, setTrafficError] = useState<string | null>(null);

  useEffect(() => {
    if (!store || !selectedCameraId) {
      setTrafficData([]);
      return;
    }
    let cancelled = false;
    setTrafficLoading(true);
    setTrafficError(null);
    api
      .getTrafficOverTime(store.id, selectedCameraId)
      .then((data) => {
        if (!cancelled) setTrafficData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setTrafficError(err instanceof ApiError ? err.message : "Failed to load traffic data");
      })
      .finally(() => {
        if (!cancelled) setTrafficLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store, selectedCameraId]);

  // ---- zone comparison (store-wide, not scoped to the selected camera) ----
  const [zoneTrafficData, setZoneTrafficData] = useState<ZoneTraffic[]>([]);
  const [zoneTrafficLoading, setZoneTrafficLoading] = useState(false);
  const [zoneTrafficError, setZoneTrafficError] = useState<string | null>(null);

  useEffect(() => {
    if (!store) {
      setZoneTrafficData([]);
      return;
    }
    let cancelled = false;
    setZoneTrafficLoading(true);
    setZoneTrafficError(null);
    api
      .getZoneTraffic(store.id)
      .then((data) => {
        if (!cancelled) setZoneTrafficData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setZoneTrafficError(err instanceof ApiError ? err.message : "Failed to load zone traffic data");
      })
      .finally(() => {
        if (!cancelled) setZoneTrafficLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  // ---- product attractiveness score (per shelf, this camera â€” real attention
  // + mocked interaction/pickup/purchase/repeat, see attractiveness_score.py) ----
  const [attractivenessData, setAttractivenessData] = useState<AttractivenessEntry[]>([]);
  const [attractivenessLoading, setAttractivenessLoading] = useState(false);
  const [attractivenessError, setAttractivenessError] = useState<string | null>(null);

  useEffect(() => {
    if (!store || !selectedCameraId) {
      setAttractivenessData([]);
      return;
    }
    let cancelled = false;
    setAttractivenessLoading(true);
    setAttractivenessError(null);
    api
      .getAttractiveness(store.id, selectedCameraId)
      .then((data) => {
        if (!cancelled) setAttractivenessData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setAttractivenessError(err instanceof ApiError ? err.message : "Failed to load attractiveness data");
      })
      .finally(() => {
        if (!cancelled) setAttractivenessLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store, selectedCameraId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cutoff = now - 60_000; // keep last 60s, matches the heatmap's own window
      const buckets = activityBucketsRef.current;
      for (const key of buckets.keys()) {
        if (key < cutoff) buckets.delete(key);
      }
      const sorted = Array.from(buckets.entries())
        .sort(([a], [b]) => a - b)
        .map(([key, count]) => ({
          time: new Date(key).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
          count,
        }));
      setActivityData(sorted);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/login");
  }

  const zoneCameras = cameras.filter((c) => c.zone_id === selectedZoneId);

  return (
    <div className="min-h-screen bg-muted p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Live Attention Heatmap</h1>
            {store && <p className="text-sm text-muted-foreground">{store.name}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/stores")}>
              Stores
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading dashboard...</p>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendationsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading recommendationsâ€¦</p>
                ) : recommendationsError ? (
                  <p className="text-sm text-destructive">{recommendationsError}</p>
                ) : recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recommendations triggered right now â€” needs attractiveness scores computed for this
                    store first (run attractiveness_score.py, or wait for the scheduler's next cycle).
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex flex-col gap-1 rounded-md border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{rec.target_description}</span>
                          <span
                            className={
                              "text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap " +
                              priorityBadgeClass(rec.priority)
                            }
                          >
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.action_item}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>~{rec.expected_conversion_uplift_pct}% est. uplift</span>
                          {rec.based_on_mock.length > 0 && (
                            <span className="text-amber-600">
                              (based on mock: {rec.based_on_mock.join(", ")})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Rule-based alerts from attractiveness scores + zone traffic. expected_conversion_uplift_pct is
                  an illustrative estimate, not a fitted prediction â€” see recommendation_engine.py.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zone &amp; camera</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex gap-2">
                  {zones.map((zone) => (
                    <Button
                      key={zone.id}
                      variant={selectedZoneId === zone.id ? "default" : "outline"}
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      {zone.name}
                    </Button>
                  ))}
                  {zones.length === 0 && (
                    <p className="text-sm text-muted-foreground">No zones configured for this store yet.</p>
                  )}
                </div>

                {zoneCameras.length > 1 && (
                  <div className="flex gap-2">
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {zoneCameras.find((c) => c.id === selectedCameraId)?.name ?? "No camera selected"}
                </CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{eventCount} events</span>
                  <span
                    className={
                      wsStatus === "open"
                        ? "text-green-600"
                        : wsStatus === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    â— {wsStatus}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={450}
                  className="w-full h-auto rounded-md bg-black/90"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Rolling last 60s of tracked activity. Red = busy, blue = sparse.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cameras</CardTitle>
              </CardHeader>
              <CardContent>
                {cameras.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No cameras configured for this store yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cameras.map((cam) => {
                      const zoneName = zones.find((z) => z.id === cam.zone_id)?.name ?? "Unassigned zone";
                      return (
                        <div
                          key={cam.id}
                          className="flex items-center justify-between rounded-md border border-border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{cam.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {zoneName} &middot; {cam.source_path}
                            </p>
                          </div>
                          <span
                            className={
                              "text-xs font-medium px-2 py-1 rounded-full " +
                              (cam.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-muted text-muted-foreground")
                            }
                          >
                            {cam.is_active ? "Online" : "Offline"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live activity (last 60s)</CardTitle>
              </CardHeader>
              <CardContent>
                {activityData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet â€” run tracking_runner against a camera to see this fill in.</p>
                ) : (
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <AreaChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="currentColor" fill="currentColor" fillOpacity={0.15} className="text-primary" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Tracked events per 2-second window, this camera only. Resets when you switch cameras.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dwell time by shelf</CardTitle>
              </CardHeader>
              <CardContent>
                {dwellTimeLoading ? (
                  <p className="text-sm text-muted-foreground">Loading dwell timeâ€¦</p>
                ) : dwellTimeError ? (
                  <p className="text-sm text-destructive">{dwellTimeError}</p>
                ) : dwellTimeData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No dwell time data yet â€” needs ShelfCameraView zones configured for this camera and at
                    least one tracking_runner run against it.
                  </p>
                ) : (
                  <div style={{ width: "100%", height: Math.max(200, dwellTimeData.length * 50) }}>
                    <ResponsiveContainer>
                      <BarChart data={dwellTimeData} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" fontSize={12} unit="s" />
                        <YAxis dataKey="shelf_name" type="category" fontSize={12} width={100} />
                        <Tooltip
                          formatter={(value, name) =>
                            name === "total_seconds" ? [`${value}s`, "Dwell time"] : [value, "Distinct visitors"]
                          }
                        />
                        <Bar dataKey="total_seconds" fill="currentColor" className="text-primary" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Total time tracked people spent in each shelf&apos;s aisle lane, most recent tracking run only â€”
                  see compute_dwell_time.py for the x-range-proxy method behind this number.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product attractiveness score</CardTitle>
              </CardHeader>
              <CardContent>
                {attractivenessLoading ? (
                  <p className="text-sm text-muted-foreground">Loading attractiveness scoresâ€¦</p>
                ) : attractivenessError ? (
                  <p className="text-sm text-destructive">{attractivenessError}</p>
                ) : attractivenessData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No attractiveness data yet â€” needs ShelfCameraView zones configured for this camera and at
                    least one tracking_runner run against it.
                  </p>
                ) : (
                  <div style={{ width: "100%", height: Math.max(200, attractivenessData.length * 50) }}>
                    <ResponsiveContainer>
                      <BarChart data={attractivenessData} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 1]} fontSize={12} />
                        <YAxis dataKey="shelf_name" type="category" fontSize={12} width={100} />
                        <Tooltip
                          formatter={(value) => [Number(value ?? 0).toFixed(3), "Score"]}
                        />
                        <Bar dataKey="final_score" fill="currentColor" className="text-primary" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  0.35Ã—Attention (real, dwell-time) + 0.25Ã—Interaction + 0.20Ã—Pickup + 0.15Ã—Purchase +
                  0.05Ã—Repeat. Interaction, Pickup, Purchase, and Repeat are placeholder values pending real
                  detection â€” see attractiveness_score.py.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic over time</CardTitle>
              </CardHeader>
              <CardContent>
                {trafficLoading ? (
                  <p className="text-sm text-muted-foreground">Loading traffic dataâ€¦</p>
                ) : trafficError ? (
                  <p className="text-sm text-destructive">{trafficError}</p>
                ) : trafficData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No traffic data yet â€” run tracking_runner against this camera first.
                  </p>
                ) : (
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={trafficData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="bucket_start_seconds"
                          fontSize={12}
                          tickFormatter={(v: number) => `${v}s`}
                        />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip
                          labelFormatter={(v) => `${String(v ?? "")}s into the run`}
                          formatter={(value) => [value ?? 0, "Events"]}
                        />
                        <Line type="monotone" dataKey="event_count" stroke="currentColor" className="text-primary" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Tracked-person events per 2s window of the video&apos;s own timeline, most recent run only â€” not
                  wall-clock/processing time, see traffic_analytics_service.py.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zone comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {zoneTrafficLoading ? (
                  <p className="text-sm text-muted-foreground">Loading zone dataâ€¦</p>
                ) : zoneTrafficError ? (
                  <p className="text-sm text-destructive">{zoneTrafficError}</p>
                ) : zoneTrafficData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No zones configured for this store yet.</p>
                ) : (
                  <div style={{ width: "100%", height: Math.max(200, zoneTrafficData.length * 50) }}>
                    <ResponsiveContainer>
                      <BarChart data={zoneTrafficData} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" fontSize={12} allowDecimals={false} />
                        <YAxis dataKey="zone_name" type="category" fontSize={12} width={100} />
                        <Tooltip
                          formatter={(value, name) =>
                            name === "event_count" ? [value, "Tracked events"] : [value, "Distinct visitors"]
                          }
                        />
                        <Bar dataKey="event_count" fill="currentColor" className="text-primary" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Store-wide, across all cameras â€” each camera&apos;s most recent run, summed per zone. Not the
                  selected camera above.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

