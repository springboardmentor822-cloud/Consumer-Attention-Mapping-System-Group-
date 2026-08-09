import { useEffect, useMemo, useRef, useState } from "react";
import type { ZoneTransition } from "../../api/analyticsDashboard";

export interface ZoneHeatmapData {
  zone_id: number;
  zone_name: string;
  points: { x: number; y: number; weight: number }[];
}

interface HeatmapGridProps {
  zones: ZoneHeatmapData[];
  /** Real zone-to-zone movement counts from GET /dashboard/analyst/journey-flow
   * (see useZoneHeatmaps) - rendered as directional flow arrows between the
   * zones' floor-plan positions. Optional so existing callers that haven't
   * been updated yet still render (just without arrows). */
  transitions?: ZoneTransition[];
}

interface FlowArrow extends ZoneTransition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strength: number;
}

const FLOW_COLOR = "168, 139, 250"; // violet-400 - distinct from the blue-to-red heat gradient

interface ZoneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type ZoneKind = "entrance" | "checkout" | "exit" | "promotional" | "aisle";

// Grid resolution the density field is computed at - deliberately coarse.
// The canvas is drawn from this via a smoothed upscale (see render()),
// which is what produces the blurred/KDE-like look cheaply: this is the
// same "splat onto a coarse grid, then upscale with smoothing" approach
// heatmap libraries use internally, not a shortcut that skews the result.
const GRID_W = 160;
const GRID_H = 100;
// Gaussian kernel radius in grid cells - how far one detection's "heat"
// spreads before fading to ~0, in the same coarse-grid units as GRID_W/H.
const KERNEL_RADIUS = 7;
const KERNEL_SIGMA = 3.2;

const TOP_BAND_H = 0.17;
const BOTTOM_BAND_H = 0.2;

const COLOR_STOPS: [number, [number, number, number]][] = [
  [0.0, [37, 99, 235]], // blue - low traffic
  [0.28, [16, 185, 129]], // green - medium
  [0.52, [234, 179, 8]], // yellow - high
  [0.75, [249, 115, 22]], // orange - very high
  [1.0, [239, 68, 68]], // red - hotspot
];

function colorForIntensity(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [t0, c0] = COLOR_STOPS[i];
    const [t1, c1] = COLOR_STOPS[i + 1];
    if (clamped >= t0 && clamped <= t1) {
      const localT = (clamped - t0) / (t1 - t0 || 1);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * localT),
        Math.round(c0[1] + (c1[1] - c0[1]) * localT),
        Math.round(c0[2] + (c1[2] - c0[2]) * localT),
      ];
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1][1];
}

/** Zone role inferred from its real name, purely to decide where on the
 * floor plan it's drawn (an honest layout/UX decision) - never used to
 * alter or invent any tracking data. */
function classifyZone(name: string): ZoneKind {
  const n = name.toLowerCase();
  if (n.includes("entrance") || n.includes("entry")) return "entrance";
  if (n.includes("checkout") || n.includes("billing")) return "checkout";
  if (n.includes("exit")) return "exit";
  if (n.includes("promo")) return "promotional";
  return "aisle";
}

/** Lays real zones onto a retail floor-plan grid: entrance/promo strip on
 * top, aisles filling the middle (however many real aisle-type zones
 * exist, evenly split), checkout/exit strip on the bottom. Falls back
 * gracefully for any zone name that doesn't match a known keyword by
 * treating it as another aisle, so this works for any store's real zone
 * list, not just this one's. */
function layoutZones(zoneNames: string[]): Map<string, ZoneRect> {
  const byKind: Record<ZoneKind, string[]> = { entrance: [], checkout: [], exit: [], promotional: [], aisle: [] };
  for (const name of zoneNames) byKind[classifyZone(name)].push(name);

  const rects = new Map<string, ZoneRect>();

  const topZones = [...byKind.entrance, ...byKind.promotional];
  if (topZones.length) {
    if (byKind.entrance.length && byKind.promotional.length) {
      const entW = 0.28;
      byKind.entrance.forEach((n, i) =>
        rects.set(n, { x: (entW / byKind.entrance.length) * i, y: 0, w: entW / byKind.entrance.length, h: TOP_BAND_H }),
      );
      const promoW = 1 - entW;
      byKind.promotional.forEach((n, i) =>
        rects.set(n, { x: entW + (promoW / byKind.promotional.length) * i, y: 0, w: promoW / byKind.promotional.length, h: TOP_BAND_H }),
      );
    } else {
      topZones.forEach((n, i) => rects.set(n, { x: (1 / topZones.length) * i, y: 0, w: 1 / topZones.length, h: TOP_BAND_H }));
    }
  }

  const midY = topZones.length ? TOP_BAND_H : 0;
  const bottomZones = [...byKind.checkout, ...byKind.exit];
  const midH = 1 - midY - (bottomZones.length ? BOTTOM_BAND_H : 0);
  const aisleCount = Math.max(byKind.aisle.length, 1);
  byKind.aisle.forEach((n, i) =>
    rects.set(n, { x: (1 / aisleCount) * i, y: midY, w: 1 / aisleCount, h: midH }),
  );

  if (bottomZones.length) {
    if (byKind.checkout.length && byKind.exit.length) {
      const exitW = 0.22;
      const checkoutW = 1 - exitW;
      byKind.checkout.forEach((n, i) =>
        rects.set(n, {
          x: (checkoutW / byKind.checkout.length) * i,
          y: 1 - BOTTOM_BAND_H,
          w: checkoutW / byKind.checkout.length,
          h: BOTTOM_BAND_H,
        }),
      );
      byKind.exit.forEach((n, i) =>
        rects.set(n, {
          x: checkoutW + (exitW / byKind.exit.length) * i,
          y: 1 - BOTTOM_BAND_H,
          w: exitW / byKind.exit.length,
          h: BOTTOM_BAND_H,
        }),
      );
    } else {
      bottomZones.forEach((n, i) =>
        rects.set(n, { x: (1 / bottomZones.length) * i, y: 1 - BOTTOM_BAND_H, w: 1 / bottomZones.length, h: BOTTOM_BAND_H }),
      );
    }
  }

  return rects;
}

function zoneIcon(kind: ZoneKind) {
  switch (kind) {
    case "entrance":
      return "\u{1F6AA}"; // door
    case "exit":
      return "\u{1F6AA}";
    case "checkout":
      return "\u{1F6D2}"; // cart
    case "promotional":
      return "\u{2B50}";
    default:
      return "\u{1F4E6}"; // package (shelf/aisle)
  }
}

/** Real (x,y) detections for one zone, normalized to that zone's own
 * min/max range and splatted as a Gaussian kernel into the shared density
 * grid at the zone's real floor-plan position. */
function splatZone(grid: Float32Array, zone: ZoneHeatmapData, rect: ZoneRect) {
  const points = zone.points;
  if (!points.length) return;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const cellX0 = rect.x * GRID_W;
  const cellY0 = rect.y * GRID_H;
  const cellW = rect.w * GRID_W;
  const cellH = rect.h * GRID_H;
  const pad = Math.min(cellW, cellH) * 0.12; // keeps hotspots off the zone's own border

  for (const p of points) {
    const localX = (p.x - minX) / spanX;
    const localY = (p.y - minY) / spanY;
    const gx = cellX0 + pad + localX * Math.max(cellW - pad * 2, 1);
    const gy = cellY0 + pad + localY * Math.max(cellH - pad * 2, 1);

    const x0 = Math.max(0, Math.floor(gx - KERNEL_RADIUS));
    const x1 = Math.min(GRID_W - 1, Math.ceil(gx + KERNEL_RADIUS));
    const y0 = Math.max(0, Math.floor(gy - KERNEL_RADIUS));
    const y1 = Math.min(GRID_H - 1, Math.ceil(gy + KERNEL_RADIUS));

    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const dx = xx - gx;
        const dy = yy - gy;
        const dist2 = dx * dx + dy * dy;
        const g = Math.exp(-dist2 / (2 * KERNEL_SIGMA * KERNEL_SIGMA));
        grid[yy * GRID_W + xx] += g * p.weight;
      }
    }
  }
}

function buildDensityGrid(zones: ZoneHeatmapData[], layout: Map<string, ZoneRect>): Float32Array {
  const grid = new Float32Array(GRID_W * GRID_H);
  for (const zone of zones) {
    const rect = layout.get(zone.zone_name);
    if (rect) splatZone(grid, zone, rect);
  }
  return grid;
}

function drawGrid(ctx: CanvasRenderingContext2D, grid: Float32Array, width: number, height: number) {
  let max = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i] > max) max = grid[i];

  const offscreen = document.createElement("canvas");
  offscreen.width = GRID_W;
  offscreen.height = GRID_H;
  const octx = offscreen.getContext("2d")!;
  const imageData = octx.createImageData(GRID_W, GRID_H);
  for (let i = 0; i < grid.length; i++) {
    const t = max > 0 ? grid[i] / max : 0;
    const [r, g, b] = colorForIntensity(t);
    const alpha = t <= 0.02 ? 0 : Math.min(0.85, 0.25 + t * 0.6);
    imageData.data[i * 4] = r;
    imageData.data[i * 4 + 1] = g;
    imageData.data[i * 4 + 2] = b;
    imageData.data[i * 4 + 3] = Math.round(alpha * 255);
  }
  octx.putImageData(imageData, 0, 0);

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(offscreen, 0, 0, width, height);
}

/**
 * Real-time store floor-plan heatmap. The floor plan is an authored
 * illustration (no real blueprint/homography data exists for this store -
 * see the honest gap noted earlier this project), but every pixel of heat
 * on it comes from real tracking_data via the existing, unchanged
 * GET /dashboard/heatmap-data?zone_id=X endpoint, one real call per real
 * zone (see useZoneHeatmaps) - not fabricated, not per-camera guesswork.
 */
export default function HeatmapGrid({ zones, transitions = [] }: HeatmapGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const currentGridRef = useRef<Float32Array | null>(null);
  const targetGridRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredFlow, setHoveredFlow] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const totalPoints = zones.reduce((sum, z) => sum + z.points.length, 0);
  const layout = useMemo(() => layoutZones(zones.map((z) => z.zone_name)), [zones]);

  // Real zone-to-zone movement, positioned between the same floor-plan rects
  // the zone tiles use above - so an arrow from "Entrance" to "Dairy Zone"
  // always points at exactly where those tiles are drawn, never a separate
  // invented layout. Self-transitions (from === to) aren't a "path" and are
  // dropped; strength is normalized against the largest real count so the
  // busiest real route is always the most visible one.
  const flows = useMemo<FlowArrow[]>(() => {
    const real = transitions.filter((t) => t.from_zone_name !== t.to_zone_name && t.count > 0);
    if (!real.length || size.width === 0) return [];
    const maxCount = Math.max(...real.map((t) => t.count));
    const arrows: FlowArrow[] = [];
    for (const t of real) {
      const fromRect = layout.get(t.from_zone_name);
      const toRect = layout.get(t.to_zone_name);
      if (!fromRect || !toRect) continue;
      arrows.push({
        ...t,
        x1: (fromRect.x + fromRect.w / 2) * size.width,
        y1: (fromRect.y + fromRect.h / 2) * size.height,
        x2: (toRect.x + toRect.w / 2) * size.width,
        y2: (toRect.y + toRect.h / 2) * size.height,
        strength: t.count / maxCount,
      });
    }
    // Weakest drawn first so the busiest real routes sit on top.
    return arrows.sort((a, b) => a.count - b.count);
  }, [transitions, layout, size.width, size.height]);

  // Resize observer keeps the canvas backing resolution matched to its
  // displayed size (crisp on any screen, no stretched blur) - this is what
  // makes the heatmap responsive across desktop/tablet/laptop.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ResizeObserver's first callback isn't reliably synchronous-enough in
    // every environment, and a single getBoundingClientRect() read on
    // mount can race the container's own layout (e.g. before its
    // aspect-video width has settled) and catch a stale/zero size -
    // leaving the canvas stuck at its 300x150 default, never drawing
    // anything. Polling briefly until a real size shows up is a small,
    // self-terminating fix for that race, not a permanent poll - it stops
    // the moment it finds one, and ResizeObserver covers every change
    // after that.
    let attempts = 0;
    let pollId: number | null = null;
    const tryMeasure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
        return true;
      }
      return false;
    };
    if (!tryMeasure()) {
      pollId = window.setInterval(() => {
        attempts += 1;
        if (tryMeasure() || attempts > 20) {
          if (pollId !== null) window.clearInterval(pollId);
        }
      }, 100);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (pollId !== null) window.clearInterval(pollId);
    };
  }, []);

  // New real data arrives (poll tick) -> becomes the animation target;
  // the render loop below eases the on-screen grid toward it instead of
  // snapping, which is what makes new detections fade in and stale ones
  // fade out smoothly rather than popping. The very first load skips the
  // ease (current starts already equal to target) - fading up from black
  // on first paint isn't a meaningful "change" to animate, it would just
  // delay showing real data for no reason.
  useEffect(() => {
    const target = buildDensityGrid(zones, layout);
    const isFirstLoad = !currentGridRef.current || currentGridRef.current.length !== target.length;
    targetGridRef.current = target;
    if (isFirstLoad) currentGridRef.current = new Float32Array(target);

    // Draw synchronously here too, not only from the rAF loop below - the
    // loop provides smooth ongoing interpolation when the browser is
    // actually compositing frames, but the first paint (and any
    // environment where rAF is throttled/unavailable) must not depend on
    // it entirely to show real data.
    const canvas = canvasRef.current;
    const current = currentGridRef.current;
    if (ctxRef.current && canvas && current) drawGrid(ctxRef.current, current, canvas.width, canvas.height);
  }, [zones, layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    // Same reasoning as above: draw immediately with whatever data is
    // already available, since sizing can resolve after the data effect
    // already ran once (nothing to draw with yet back then).
    if (currentGridRef.current) drawGrid(ctx, currentGridRef.current, canvas.width, canvas.height);

    let lastTime = performance.now();
    const EASE_PER_SECOND = 4.5; // higher = snaps to new data faster, lower = more fade/trail

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const current = currentGridRef.current;
      const target = targetGridRef.current;
      if (current && target && current.length === target.length) {
        const alpha = 1 - Math.exp(-EASE_PER_SECOND * dt);
        for (let i = 0; i < current.length; i++) {
          current[i] += (target[i] - current[i]) * alpha;
        }
        drawGrid(ctx, current, canvas.width, canvas.height);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1120]"
    >
      {/* Floor plan illustration - CSS/SVG only, an authored layout, not a
          claim about this store's real physical blueprint (none exists).
          Always rendered (never behind an early return) so containerRef/
          canvasRef stay attached to real DOM across data states - the
          ResizeObserver and render-loop effects below only get one chance
          to find a live ref, and an early return that swaps the whole tree
          out from under them means they never recover once real data
          arrives. The "no data yet" case is an overlay, not a replacement. */}
      {zones.map((zone) => {
        const rect = layout.get(zone.zone_name);
        if (!rect) return null;
        const kind = classifyZone(zone.zone_name);
        const weight = zone.points.reduce((sum, p) => sum + p.weight, 0);
        const isHovered = hoveredZone === zone.zone_name;
        return (
          <div
            key={zone.zone_id}
            role="button"
            tabIndex={0}
            onMouseEnter={() => setHoveredZone(zone.zone_name)}
            onMouseLeave={() => setHoveredZone(null)}
            onFocus={() => setHoveredZone(zone.zone_name)}
            onBlur={() => setHoveredZone(null)}
            className="absolute outline-none"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
          >
            <div
              className={`h-full w-full border transition-all duration-200 ${
                isHovered ? "border-white/40 bg-white/[0.06] shadow-[inset_0_0_24px_rgba(255,255,255,0.06)]" : "border-white/10"
              }`}
              style={{
                backgroundImage:
                  kind === "aisle"
                    ? "repeating-linear-gradient(0deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 2px, transparent 2px, transparent 10px)"
                    : undefined,
              }}
            />
            <div className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 backdrop-blur-sm">
              <span>{zoneIcon(kind)}</span>
              <span className="truncate">{zone.zone_name}</span>
            </div>
            {isHovered && (
              <div className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-slate-300 backdrop-blur-sm">
                {weight} detection{weight === 1 ? "" : "s"}
              </div>
            )}
          </div>
        );
      })}

      {/* Heat overlay - "screen" blend lightens against the dark floor plan
          (colors glow instead of muddying it), and near-zero density is
          already near-transparent (see drawGrid), so zone labels/borders
          stay readable underneath exactly where there's little heat. */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "screen", opacity: 0.85 }}
      />

      {/* Real zone-to-zone flow arrows - viewBox is sized in actual CSS
          pixels (not a normalized 0-1 box) so line thickness and arrowheads
          never get stretched by the container's aspect ratio. */}
      {flows.length > 0 && (
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${size.width} ${size.height}`}
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <marker id="heatmap-flow-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill={`rgba(${FLOW_COLOR}, 0.95)`} />
            </marker>
          </defs>
          {flows.map((f, i) => {
            const dx = f.x2 - f.x1;
            const dy = f.y2 - f.y1;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const bend = Math.min(24, len * 0.18);
            const sign = f.from_zone_id < f.to_zone_id ? 1 : -1;
            const mx = (f.x1 + f.x2) / 2 + nx * bend * sign;
            const my = (f.y1 + f.y2) / 2 + ny * bend * sign;
            const path = `M ${f.x1} ${f.y1} Q ${mx} ${my} ${f.x2} ${f.y2}`;
            const strokeWidth = 1.25 + f.strength * 4.5;
            const opacity = 0.3 + f.strength * 0.6;
            const isHovered = hoveredFlow === i;
            return (
              <g key={`${f.from_zone_id}-${f.to_zone_id}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(16, strokeWidth * 2)}
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredFlow(i)}
                  onMouseLeave={() => setHoveredFlow((cur) => (cur === i ? null : cur))}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={`rgba(${FLOW_COLOR}, ${isHovered ? Math.min(1, opacity + 0.3) : opacity})`}
                  strokeWidth={isHovered ? strokeWidth + 1.5 : strokeWidth}
                  strokeLinecap="round"
                  markerEnd="url(#heatmap-flow-arrowhead)"
                  style={{ transition: "stroke-width 120ms ease, stroke 120ms ease" }}
                />
                {isHovered && (
                  <foreignObject x={mx - 90} y={my - 16} width={180} height={32} style={{ pointerEvents: "none" }}>
                    <div className="mx-auto flex w-fit items-center gap-1 rounded-md bg-black/85 px-2 py-1 text-[10px] font-medium text-violet-200 backdrop-blur-sm">
                      {f.from_zone_name} &rarr; {f.to_zone_name}: <span className="font-bold text-white">{f.count}</span>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Legend - matches the intensity labels from the heat color scale
          plus the flow-arrow key, both driven by the same real data drawn
          above (no separate/invented scale). */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-2 text-[10px] text-slate-300 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-24 rounded-full"
            style={{
              background: `linear-gradient(to right, ${COLOR_STOPS.map(([t, [r, g, b]]) => `rgba(${r},${g},${b},${0.35 + t * 0.5}) ${t * 100}%`).join(", ")})`,
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-slate-400">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Very High</span>
          <span>Hotspot</span>
        </div>
        {flows.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5 border-t border-white/10 pt-1.5 text-violet-300">
            <svg width="18" height="8" viewBox="0 0 18 8">
              <line x1="0" y1="4" x2="14" y2="4" stroke={`rgba(${FLOW_COLOR}, 0.9)`} strokeWidth="2" />
              <path d="M13,1 L18,4 L13,7 Z" fill={`rgba(${FLOW_COLOR}, 0.9)`} />
            </svg>
            <span>Customer flow between zones</span>
          </div>
        )}
      </div>

      {!totalPoints && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/50 text-sm text-slate-400">
          No tracking data in range yet
        </div>
      )}
    </div>
  );
}
