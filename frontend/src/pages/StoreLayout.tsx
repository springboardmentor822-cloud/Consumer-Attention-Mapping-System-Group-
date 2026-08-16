import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Select } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { heatmapsApi, shelvesApi, storesApi, zonesApi, attentionApi } from "../api/resources";
import type { Heatmap, Shelf, ShelfDwell, Store, Zone } from "../types";

// Same palette Live Tracking uses for its 3 zone bands, so a zone reads as
// the same color everywhere in the product rather than being re-randomized
// per page.
const ZONE_COLORS = ["#4fd1c5", "#f2a93b", "#f2495c", "#8b8fe0", "#4f9dff", "#e0a84f"];

type Point = [number, number];

type HeatmapPayload = {
  grid_size: number;
  kde_sigma: number;
  points: { x: number; y: number; intensity: number; normalized: number }[];
};

type PeriodPreset = "today" | "7d" | "30d";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function periodRange(preset: PeriodPreset): { start: string; end: string } {
  const end = new Date().toISOString();
  if (preset === "today") return { start: daysAgoIso(1), end };
  if (preset === "7d") return { start: daysAgoIso(7), end };
  return { start: daysAgoIso(30), end };
}

function parsePolygon(raw: string | null | undefined): Point[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((p) => Array.isArray(p) && p.length === 2)) {
      return parsed as Point[];
    }
    return null;
  } catch {
    return null;
  }
}

function centroid(points: Point[]): Point {
  const n = points.length || 1;
  const sum = points.reduce<Point>((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}

// Standard ray-casting point-in-polygon test, used to attribute each
// heatmap grid cell to whichever store zone it physically falls inside -
// this is what powers the "quietest zone" insight below.
function pointInPolygon([px, py]: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function rectPolygon(cx: number, cy: number, w: number, h: number): Point[] {
  return [
    [cx - w / 2, cy - h / 2],
    [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2],
    [cx - w / 2, cy + h / 2],
  ];
}

function formatDwell(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const CAN_EDIT_ROLES = new Set(["administrator", "store_manager"]);
const DEFAULT_SHELF_W = 1.5;
const DEFAULT_SHELF_H = 0.6;

export function StoreLayoutPage() {
  const { user } = useAuth();
  const canEdit = !!user && CAN_EDIT_ROLES.has(user.role);

  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [shelfDwell, setShelfDwell] = useState<Map<number, ShelfDwell>>(new Map());
  const [heatmap, setHeatmap] = useState<Heatmap | null>(null);
  const [period, setPeriod] = useState<PeriodPreset>("today");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [placingShelfId, setPlacingShelfId] = useState<number | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    storesApi.list().then((s) => {
      setStores(s);
      if (s.length > 0) setStoreId(s[0].id);
      else setLoading(false);
    });
  }, []);

  async function loadStoreData(id: number, presetOverride?: PeriodPreset) {
    setLoading(true);
    setError(null);
    const { start, end } = periodRange(presetOverride ?? period);
    try {
      const [storeRes, zonesRes, shelvesRes] = await Promise.all([
        storesApi.get(id),
        zonesApi.list(id).catch(() => []),
        shelvesApi.list(id).catch(() => []),
      ]);
      setStore(storeRes);
      setZones(zonesRes);
      setShelves(shelvesRes);
      const hm = await heatmapsApi
        .generate({ store_id: id, heatmap_type: "traffic", period_start: start, period_end: end })
        .catch(() => null);
      setHeatmap(hm);
      // Per-shelf dwell time: how long shoppers actually lingered near
      // each *placed* shelf in this period (see attentionApi.shelfDwell /
      // tracking_simulator.py's shelf-proximity tracking for where this
      // data comes from). Best-effort - an empty result just means no
      // dwell has been recorded yet for this period, not an error.
      const dwellRows = await attentionApi.shelfDwell(id, start, end).catch(() => []);
      setShelfDwell(new Map(dwellRows.map((d) => [d.shelf_id, d])));
    } catch {
      setError("Could not load the store layout. Check that the backend is reachable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (storeId === null) return;
    loadStoreData(storeId);
    setPlacingShelfId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function handleRegenerate(preset: PeriodPreset) {
    if (storeId === null) return;
    setPeriod(preset);
    setGenerating(true);
    await loadStoreData(storeId, preset);
    setGenerating(false);
  }

  const floorW = store?.floor_width_m ?? 24;
  const floorH = store?.floor_height_m ?? 14;

  const zonePolys = useMemo(
    () =>
      zones
        .map((z) => ({ zone: z, polygon: parsePolygon(z.polygon_coordinates) }))
        .filter((z): z is { zone: Zone; polygon: Point[] } => z.polygon !== null && z.polygon.length >= 3),
    [zones]
  );

  const heatData = useMemo<HeatmapPayload | null>(() => {
    if (!heatmap) return null;
    try {
      return JSON.parse(heatmap.data) as HeatmapPayload;
    } catch {
      return null;
    }
  }, [heatmap]);

  const heatCells = useMemo(() => {
    if (!heatData) return [];
    const cellW = floorW / heatData.grid_size;
    const cellH = floorH / heatData.grid_size;
    return heatData.points
      .filter((p) => p.normalized > 0.06)
      .map((p) => ({
        cx: (p.x + 0.5) * cellW,
        cy: (p.y + 0.5) * cellH,
        r: (Math.min(cellW, cellH) / 2) * (0.7 + 0.9 * p.normalized),
        opacity: 0.12 + 0.6 * p.normalized,
        normalized: p.normalized,
      }));
  }, [heatData, floorW, floorH]);

  // Auto-generated insights: the busiest single spot, and whichever
  // defined zone has the least accumulated heat relative to the others -
  // real signals derived from the same tracking data everything else on
  // this page uses, not manually-placed decoration.
  const insights = useMemo(() => {
    if (!heatData || heatData.points.length === 0) return { busiest: null, quietest: null };

    const cellW = floorW / heatData.grid_size;
    const cellH = floorH / heatData.grid_size;

    let busiest = heatData.points[0];
    for (const p of heatData.points) if (p.normalized > busiest.normalized) busiest = p;
    const busiestPoint: Point = [(busiest.x + 0.5) * cellW, (busiest.y + 0.5) * cellH];

    let quietest: { zone: Zone; centroid: Point } | null = null;
    if (zonePolys.length > 1) {
      const totals = zonePolys.map(({ zone, polygon }) => {
        let sum = 0;
        for (const p of heatData.points) {
          const px = (p.x + 0.5) * cellW;
          const py = (p.y + 0.5) * cellH;
          if (pointInPolygon([px, py], polygon)) sum += p.normalized;
        }
        return { zone, polygon, sum };
      });
      const lowest = totals.reduce((a, b) => (b.sum < a.sum ? b : a));
      quietest = { zone: lowest.zone, centroid: centroid(lowest.polygon) };
    }

    return { busiest: busiest.normalized > 0.15 ? busiestPoint : null, quietest };
  }, [heatData, zonePolys, floorW, floorH]);

  const unplacedShelves = shelves.filter((s) => !parsePolygon(s.position_coordinates));
  const placedShelves = shelves
    .map((s) => ({ shelf: s, polygon: parsePolygon(s.position_coordinates) }))
    .filter((s): s is { shelf: Shelf; polygon: Point[] } => s.polygon !== null);

  async function handlePlaceClick(e: React.MouseEvent<HTMLDivElement>) {
    if (placingShelfId === null || !svgWrapRef.current) return;
    const rect = svgWrapRef.current.getBoundingClientRect();
    const fx = ((e.clientX - rect.left) / rect.width) * floorW;
    const fy = ((e.clientY - rect.top) / rect.height) * floorH;
    const shelf = shelves.find((s) => s.id === placingShelfId);
    if (!shelf) return;

    const w = shelf.shelf_width_m ?? DEFAULT_SHELF_W;
    const h = shelf.shelf_height_m ?? DEFAULT_SHELF_H;
    const clampedX = Math.min(Math.max(fx, w / 2), floorW - w / 2);
    const clampedY = Math.min(Math.max(fy, h / 2), floorH - h / 2);
    const polygon = rectPolygon(clampedX, clampedY, w, h);

    try {
      await shelvesApi.update(placingShelfId, {
        position_coordinates: JSON.stringify(polygon),
        shelf_width_m: w,
        shelf_height_m: h,
      });
      if (storeId !== null) {
        const refreshed = await shelvesApi.list(storeId);
        setShelves(refreshed);
      }
    } catch {
      setError("Could not save that shelf's position. Check that your account can edit shelves.");
    } finally {
      setPlacingShelfId(null);
    }
  }

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8 gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-semibold">Store layout</h1>
          <p className="text-xs text-text-muted font-mono truncate">
            Real floor plan built from zones + live tracking data, not a static image
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {stores.length > 0 && (
            <Select value={storeId ?? ""} onChange={(e) => setStoreId(Number(e.target.value))} className="w-48">
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <div className="flex items-center gap-1 bg-panel-raised border border-hairline rounded-md p-1">
            {(["today", "7d", "30d"] as PeriodPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => handleRegenerate(p)}
                disabled={generating || storeId === null}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  period === p ? "bg-signal text-base" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {p === "today" ? "Today" : p === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {error && (
          <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {stores.length === 0 ? (
          <p className="text-sm text-text-muted">No stores registered yet.</p>
        ) : loading ? (
          <p className="text-sm text-text-muted font-mono">Loading floor plan…</p>
        ) : (
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              {placingShelfId !== null && (
                <div className="mb-3 flex items-center justify-between border border-signal/40 bg-signal/10 rounded-md px-3 py-2">
                  <p className="text-sm text-text-primary">
                    Click anywhere on the floor plan to place{" "}
                    <span className="font-medium">
                      {shelves.find((s) => s.id === placingShelfId)?.name}
                    </span>
                  </p>
                  <button
                    onClick={() => setPlacingShelfId(null)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div
                ref={svgWrapRef}
                onClick={handlePlaceClick}
                className={`relative bg-panel border border-hairline rounded-lg overflow-hidden blueprint-grid ${
                  placingShelfId !== null ? "cursor-crosshair ring-1 ring-signal/50" : ""
                }`}
                style={{ aspectRatio: `${floorW} / ${floorH}` }}
              >
                <svg
                  viewBox={`0 0 ${floorW} ${floorH}`}
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <filter id="heatGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="0.35" />
                    </filter>
                  </defs>

                  {zonePolys.map(({ zone, polygon }, i) => (
                    <polygon
                      key={zone.id}
                      points={polygon.map((p) => p.join(",")).join(" ")}
                      fill={ZONE_COLORS[i % ZONE_COLORS.length]}
                      fillOpacity={0.07}
                      stroke={ZONE_COLORS[i % ZONE_COLORS.length]}
                      strokeOpacity={0.35}
                      strokeWidth={0.05}
                    />
                  ))}

                  <g filter="url(#heatGlow)">
                    {heatCells.map((c, i) => (
                      <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="#f2603b" opacity={c.opacity} />
                    ))}
                  </g>

                  {placedShelves.map(({ shelf, polygon }) => (
                    <polygon
                      key={shelf.id}
                      points={polygon.map((p) => p.join(",")).join(" ")}
                      fill="#edeff2"
                      fillOpacity={0.14}
                      stroke="#edeff2"
                      strokeOpacity={0.5}
                      strokeWidth={0.04}
                    />
                  ))}
                </svg>

                {/* HTML overlay for text - crisper than scaled SVG text at
                    this viewBox size, and reuses the app's own type styles. */}
                {zonePolys.map(({ zone, polygon }, i) => {
                  const [cx, cy] = centroid(polygon);
                  return (
                    <span
                      key={zone.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm pointer-events-none whitespace-nowrap"
                      style={{
                        left: `${(cx / floorW) * 100}%`,
                        top: `${(cy / floorH) * 100}%`,
                        color: ZONE_COLORS[i % ZONE_COLORS.length],
                      }}
                    >
                      {zone.name}
                    </span>
                  );
                })}

                {placedShelves.map(({ shelf, polygon }) => {
                  const [cx, cy] = centroid(polygon);
                  const dwell = shelfDwell.get(shelf.id);
                  return (
                    <div
                      key={shelf.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 pointer-events-none"
                      style={{ left: `${(cx / floorW) * 100}%`, top: `${(cy / floorH) * 100}%` }}
                    >
                      <span className="text-[10px] font-medium text-text-primary bg-black/50 backdrop-blur-sm rounded px-1 whitespace-nowrap">
                        {shelf.name}
                      </span>
                      {dwell && dwell.view_count > 0 && (
                        <span
                          className="text-[9px] font-mono text-signal bg-black/50 backdrop-blur-sm rounded px-1 whitespace-nowrap"
                          title={`${dwell.view_count} recorded look(s), ${formatDwell(dwell.total_dwell_seconds)} total`}
                        >
                          {formatDwell(dwell.avg_dwell_seconds)} avg dwell
                        </span>
                      )}
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlacingShelfId(shelf.id);
                          }}
                          className="pointer-events-auto text-[9px] font-mono text-signal hover:text-text-primary bg-black/50 rounded px-1"
                        >
                          Move
                        </button>
                      )}
                    </div>
                  );
                })}

                {insights.busiest && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center w-20 h-20 rounded-full bg-critical/25 border border-critical/50 backdrop-blur-sm pointer-events-none"
                    style={{
                      left: `${(insights.busiest[0] / floorW) * 100}%`,
                      top: `${(insights.busiest[1] / floorH) * 100}%`,
                    }}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wide text-critical leading-tight">
                      Busiest
                      <br />
                      spot
                    </span>
                  </div>
                )}

                {insights.quietest && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center w-24 h-24 rounded-full bg-ok/15 border border-ok/40 backdrop-blur-sm pointer-events-none"
                    style={{
                      left: `${(insights.quietest.centroid[0] / floorW) * 100}%`,
                      top: `${(insights.quietest.centroid[1] / floorH) * 100}%`,
                    }}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wide text-ok leading-tight px-2">
                      Low activity - reallocation opportunity
                    </span>
                  </div>
                )}

                {zonePolys.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-text-muted text-center max-w-xs">
                      No zones defined for this store yet. Run a Live Tracking session once - it
                      auto-creates the standard zones and cameras.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-text-muted mt-3">
                Red glow is live-tracking foot traffic for the selected period, smoothed into a
                density surface. Outlined shapes are shelves; click "Place on map" on any unplaced
                shelf below, then click the floor plan to drop it there.
              </p>
            </div>

            <div className="w-72 shrink-0 space-y-5">
              <div className="bg-panel border border-hairline rounded-lg p-4">
                <h2 className="text-xs font-mono uppercase tracking-wide text-text-muted mb-3">Legend</h2>
                <div className="space-y-2">
                  {zonePolys.map(({ zone }, i) => (
                    <div key={zone.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: ZONE_COLORS[i % ZONE_COLORS.length] }}
                      />
                      <span className="text-text-primary truncate">{zone.name}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs pt-1 border-t border-hairline mt-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-critical" />
                    <span className="text-text-muted">Foot-traffic density</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0 border border-text-primary/60" />
                    <span className="text-text-muted">Shelf</span>
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="bg-panel border border-hairline rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-mono uppercase tracking-wide text-text-muted">
                      Unplaced shelves
                    </h2>
                    <Badge tone={unplacedShelves.length > 0 ? "warn" : "ok"}>
                      {unplacedShelves.length}
                    </Badge>
                  </div>
                  {unplacedShelves.length === 0 ? (
                    <p className="text-xs text-text-muted">Every shelf has a floor position.</p>
                  ) : (
                    <div className="space-y-2">
                      {unplacedShelves.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-text-primary truncate">{s.name}</span>
                          <Button
                            variant="ghost"
                            onClick={() => setPlacingShelfId(s.id)}
                            disabled={placingShelfId === s.id}
                          >
                            {placingShelfId === s.id ? "Click map…" : "Place on map"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-panel border border-hairline rounded-lg p-4">
                <h2 className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">
                  Floor dimensions
                </h2>
                <p className="text-sm text-text-primary">
                  {floorW}m × {floorH}m
                </p>
                {!store?.floor_width_m && (
                  <p className="text-xs text-text-muted mt-1">
                    Using a default size - set floor_width_m / floor_height_m on this store for an
                    accurate scale.
                  </p>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-4">
                <h2 className="text-xs font-mono uppercase tracking-wide text-text-muted mb-3">
                  Top viewed shelves
                </h2>
                {(() => {
                  const ranked = placedShelves
                    .map(({ shelf }) => ({ shelf, dwell: shelfDwell.get(shelf.id) }))
                    .filter((r): r is { shelf: Shelf; dwell: ShelfDwell } => !!r.dwell && r.dwell.view_count > 0)
                    .sort((a, b) => b.dwell.total_dwell_seconds - a.dwell.total_dwell_seconds)
                    .slice(0, 5);
                  if (ranked.length === 0) {
                    return (
                      <p className="text-xs text-text-muted">
                        No recorded shelf attention yet for this period. Start Live Tracking for this
                        store and place shelves + assign products so dwell time can be measured.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2.5">
                      {ranked.map(({ shelf, dwell }) => (
                        <div key={shelf.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-text-primary truncate">{shelf.name}</span>
                          <span className="font-mono text-signal shrink-0">
                            {formatDwell(dwell.avg_dwell_seconds)} avg · {dwell.view_count} looks
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
