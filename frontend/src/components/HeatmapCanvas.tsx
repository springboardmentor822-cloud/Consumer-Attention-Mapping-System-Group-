import { useEffect, useRef } from "react";

type GridPoint = { x: number; y: number; intensity: number; normalized: number };
type ShelfPoint = { shelf_id: number; intensity: number };

function isGridData(data: unknown): data is { grid_size: number; points: GridPoint[] } {
  return (
    !!data &&
    typeof data === "object" &&
    "points" in (data as any) &&
    Array.isArray((data as any).points) &&
    (data as any).points.length > 0 &&
    "x" in (data as any).points[0]
  );
}

// Blue (cold) -> green -> yellow -> red (hot), the standard "weather map"
// density scale the retail-analyst heatmaps are meant to look like.
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

/** Renders a store-floor density heatmap (traffic/movement/occupancy
 * heatmaps, which carry an x/y grid) as a colored canvas, or a shelf
 * attention bar list (shelf/product_attention/engagement_hotspot
 * heatmaps, which carry per-shelf totals instead of x/y positions). */
export function HeatmapCanvas({
  rawData,
  shelfNames,
}: {
  rawData: string;
  shelfNames?: Record<number, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawData);
  } catch {
    parsed = null;
  }

  const gridSize = isGridData(parsed) ? parsed.grid_size || 20 : 20;
  const gridPoints = isGridData(parsed) ? parsed.points : [];
  const shelfPoints: ShelfPoint[] =
    parsed && typeof parsed === "object" && "points" in (parsed as any) && !isGridData(parsed)
      ? ((parsed as any).points as ShelfPoint[])
      : [];

  useEffect(() => {
    if (!isGridData(parsed)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 360;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Cold background so zero-intensity cells still read as "floor",
    // not "unknown".
    ctx.fillStyle = heatColor(0);
    ctx.fillRect(0, 0, size, size);

    const cell = size / gridSize;
    for (const p of gridPoints) {
      ctx.fillStyle = heatColor(p.normalized);
      ctx.fillRect(p.x * cell, p.y * cell, cell + 0.5, cell + 0.5);
    }
  }, [rawData]);

  if (!parsed) {
    return <p className="text-sm text-text-muted">This heatmap's data couldn't be read.</p>;
  }

  if (isGridData(parsed)) {
    if (gridPoints.length === 0) {
      return <p className="text-sm text-text-muted">No tracked positions in this period yet.</p>;
    }
    return (
      <div>
        <canvas ref={canvasRef} className="rounded-md border border-hairline block" />
        <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted font-mono uppercase tracking-wide">
          <span>Low traffic</span>
          <div
            className="h-2 flex-1 rounded-full max-w-[160px]"
            style={{
              background: `linear-gradient(to right, ${heatColor(0)}, ${heatColor(0.35)}, ${heatColor(0.6)}, ${heatColor(0.85)}, ${heatColor(1)})`,
            }}
          />
          <span>High traffic</span>
        </div>
      </div>
    );
  }

  if (shelfPoints.length === 0) {
    return <p className="text-sm text-text-muted">No shelf attention recorded in this period yet.</p>;
  }

  const sorted = [...shelfPoints].sort((a, b) => b.intensity - a.intensity);
  const max = Math.max(1, ...sorted.map((p) => p.intensity));

  return (
    <div className="space-y-2.5">
      {sorted.map((p) => (
        <div key={p.shelf_id}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-muted truncate">{shelfNames?.[p.shelf_id] ?? `Shelf ${p.shelf_id}`}</span>
            <span className="font-mono text-text-primary">{p.intensity}s</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-panel-raised">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(4, (p.intensity / max) * 100)}%`, background: heatColor(p.intensity / max) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
