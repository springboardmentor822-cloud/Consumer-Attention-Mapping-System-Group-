import type { Camera, Store, Zone } from "../types";

type ZoneWithOccupancy = {
  zone: Zone;
  index: number;
  count: number;
};

function parsePolygon(zone: Zone, floorW: number, floorH: number, index: number, total: number): number[][] {
  if (zone.polygon_coordinates) {
    try {
      const parsed = JSON.parse(zone.polygon_coordinates);
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed as number[][];
    } catch {
      // fall through to the auto-layout below
    }
  }
  // No (or invalid) real coordinates on this zone - fall back to the same
  // horizontal-band layout the backend auto-assigns new zones, so the
  // floor plan always renders something sensible instead of collapsing.
  const bandTop = (index / total) * floorH;
  const bandBottom = ((index + 1) / total) * floorH;
  return [
    [0, bandTop],
    [floorW, bandTop],
    [floorW, bandBottom],
    [0, bandBottom],
  ];
}

function centroid(points: number[][]): [number, number] {
  const n = points.length || 1;
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  return [sx / n, sy / n];
}

// Same blue -> green -> yellow -> red density scale used by the analyst
// heatmap canvas, so "hot" means the same thing everywhere in the app.
function heatColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const stops: [number, [number, number, number]][] = [
    [0.0, [30, 60, 160]],
    [0.35, [40, 170, 190]],
    [0.6, [230, 200, 60]],
    [0.85, [235, 120, 40]],
    [1.0, [220, 40, 40]],
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const localT = (clamped - lo[0]) / span;
  const r = Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * localT);
  const g = Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * localT);
  const b = Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * localT);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * A real 2D store floor plan: each zone drawn to scale from its
 * polygon_coordinates (meters), heat-colored by live occupancy, with
 * camera markers placed at their assigned zone and colored by
 * online/offline status. This is the "store layout + heatmap + camera"
 * view - not a placeholder.
 */
export function StoreLayout({
  store,
  zones,
  cameras,
  occupancyByZoneIndex,
}: {
  store: Store | undefined;
  zones: Zone[];
  cameras: Camera[];
  occupancyByZoneIndex: Record<string, number> | null | undefined;
}) {
  const floorW = store?.floor_width_m || 20;
  const floorH = store?.floor_height_m || 12;

  if (zones.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No zones configured for this store yet - start live tracking or add zones from Catalog to
        see the floor plan.
      </p>
    );
  }

  const zoneData: ZoneWithOccupancy[] = zones.map((zone, index) => ({
    zone,
    index,
    count: occupancyByZoneIndex?.[String(index)] ?? 0,
  }));
  const maxCount = Math.max(1, ...zoneData.map((z) => z.count));

  const camerasByZone: Record<number, Camera[]> = {};
  for (const cam of cameras) {
    if (cam.zone_id == null) continue;
    (camerasByZone[cam.zone_id] ??= []).push(cam);
  }

  return (
    <div>
      <div
        className="relative w-full rounded-md overflow-hidden border border-hairline bg-panel-raised"
        style={{ aspectRatio: `${floorW} / ${floorH}` }}
      >
        <svg
          viewBox={`0 0 ${floorW} ${floorH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {zoneData.map(({ zone, index, count }) => {
            const points = parsePolygon(zone, floorW, floorH, index, zones.length);
            return (
              <polygon
                key={zone.id}
                points={points.map((p) => p.join(",")).join(" ")}
                fill={heatColor(count / maxCount)}
                fillOpacity={0.75}
                stroke="#0b0d10"
                strokeWidth={floorH * 0.006}
              />
            );
          })}
        </svg>

        {zoneData.map(({ zone, index, count }) => {
          const points = parsePolygon(zone, floorW, floorH, index, zones.length);
          const [cx, cy] = centroid(points);
          const zoneCameras = camerasByZone[zone.id] ?? [];
          return (
            <div
              key={zone.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
              style={{ left: `${(cx / floorW) * 100}%`, top: `${(cy / floorH) * 100}%` }}
            >
              <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {zone.name}
              </span>
              <span className="text-[10px] font-mono text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {count} {count === 1 ? "person" : "people"}
              </span>
              {zoneCameras.length > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5 pointer-events-auto">
                  {zoneCameras.map((cam) => (
                    <div
                      key={cam.id}
                      title={`${cam.name} - ${cam.status}`}
                      className={`h-2.5 w-2.5 rounded-full border border-white/70 ${
                        cam.status === "online" ? "bg-ok animate-pulse" : "bg-critical"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono uppercase tracking-wide">
          <span>Low traffic</span>
          <div
            className="h-2 w-32 rounded-full"
            style={{
              background: `linear-gradient(to right, ${heatColor(0)}, ${heatColor(0.35)}, ${heatColor(0.6)}, ${heatColor(0.85)}, ${heatColor(1)})`,
            }}
          />
          <span>High traffic</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-ok" /> Camera online
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-critical" /> Camera offline
          </span>
        </div>
      </div>
    </div>
  );
}
