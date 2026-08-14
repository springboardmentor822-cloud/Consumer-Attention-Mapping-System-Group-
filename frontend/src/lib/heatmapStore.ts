// Shared client-side store bridging CamerasTab (producer) and HeatmapTab
// (consumer). It's a plain module-level singleton — not React state — so it
// keeps the last-known points even while HeatmapTab isn't mounted, and
// HeatmapTab picks them up the moment it mounts via subscribe().

export interface HeatPoint {
  x: number;
  y: number;
  weight: number;
}

interface SourceEntry {
  points: HeatPoint[];
  ts: number;
}

type Listener = (points: HeatPoint[]) => void;

const STALE_MS = 6000; // drop a camera's points if it hasn't reported in 6s (tab closed, model stopped, etc.)

class HeatmapStore {
  private bySource = new Map<string, SourceEntry>();
  private listeners = new Set<Listener>();

  /** Replace all points contributed by one source (e.g. "camera-1") in one shot. */
  reportBatch(source: string, points: HeatPoint[]) {
    this.bySource.set(source, { points, ts: Date.now() });
    this.prune();
    this.emit();
  }

  /** Explicitly remove a source's points (camera unmounted / detection stopped). */
  clearSource(source: string) {
    if (this.bySource.delete(source)) this.emit();
  }

  getPoints(): HeatPoint[] {
    this.prune();
    const all: HeatPoint[] = [];
    this.bySource.forEach((entry) => all.push(...entry.points));
    return all;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.getPoints());
    return () => this.listeners.delete(fn);
  }

  private prune() {
    const now = Date.now();
    let changed = false;
    this.bySource.forEach((entry, key) => {
      if (now - entry.ts > STALE_MS) {
        this.bySource.delete(key);
        changed = true;
      }
    });
    if (changed) this.emit();
  }

  private emit() {
    const pts = this.getPoints();
    this.listeners.forEach((fn) => fn(pts));
  }
}

export const heatmapStore = new HeatmapStore();