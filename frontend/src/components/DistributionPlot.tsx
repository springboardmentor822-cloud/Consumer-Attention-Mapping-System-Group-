/**
 * Minimal box-plot and violin-plot rows, rendered as inline SVG.
 *
 * recharts (the only chart library in this project) has no built-in box
 * or violin plot type, and pulling in a second charting library for two
 * chart types isn't worth the bundle weight - these are small enough to
 * hand-roll directly against the same design tokens the rest of the app
 * uses (bg-panel-raised / signal / hairline).
 */

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function computeStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1] ?? 0,
  };
}

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 130;

export function BoxPlotRow({
  label,
  values,
  domainMax,
  color = "#4fd1c5",
}: {
  label: string;
  values: number[];
  domainMax: number;
  color?: string;
}) {
  if (values.length === 0) {
    return (
      <div className="flex items-center gap-3 text-xs text-text-muted" style={{ height: ROW_HEIGHT }}>
        <span style={{ width: LABEL_WIDTH }} className="truncate">{label}</span>
        <span>No data</span>
      </div>
    );
  }
  const { min, q1, median, q3, max } = computeStats(values);
  const scale = (v: number) => (domainMax > 0 ? (v / domainMax) * 100 : 0);

  return (
    <div className="flex items-center gap-3" style={{ height: ROW_HEIGHT }}>
      <span style={{ width: LABEL_WIDTH }} className="text-xs text-text-muted truncate">{label}</span>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="flex-1" style={{ height: 24 }}>
        {/* whisker */}
        <line x1={scale(min)} x2={scale(max)} y1={12} y2={12} stroke={color} strokeWidth={1} opacity={0.6} />
        <line x1={scale(min)} x2={scale(min)} y1={7} y2={17} stroke={color} strokeWidth={1} opacity={0.6} />
        <line x1={scale(max)} x2={scale(max)} y1={7} y2={17} stroke={color} strokeWidth={1} opacity={0.6} />
        {/* box (Q1 - Q3) */}
        <rect
          x={scale(q1)}
          y={3}
          width={Math.max(0.5, scale(q3) - scale(q1))}
          height={18}
          fill={color}
          fillOpacity={0.25}
          stroke={color}
          strokeWidth={1}
        />
        {/* median */}
        <line x1={scale(median)} x2={scale(median)} y1={3} y2={21} stroke={color} strokeWidth={1.5} />
      </svg>
    </div>
  );
}

export function ViolinRow({
  label,
  values,
  domainMax,
  color = "#f2a93b",
}: {
  label: string;
  values: number[];
  domainMax: number;
  color?: string;
}) {
  if (values.length === 0) {
    return (
      <div className="flex items-center gap-3 text-xs text-text-muted" style={{ height: ROW_HEIGHT }}>
        <span style={{ width: LABEL_WIDTH }} className="truncate">{label}</span>
        <span>No data</span>
      </div>
    );
  }
  const BIN_COUNT = 14;
  const scale = (v: number) => (domainMax > 0 ? (v / domainMax) * 100 : 0);
  const bins = new Array(BIN_COUNT).fill(0);
  const binWidth = domainMax / BIN_COUNT || 1;
  for (const v of values) {
    const idx = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(v / binWidth)));
    bins[idx] += 1;
  }
  const maxBin = Math.max(1, ...bins);
  const AMPLITUDE = 9; // half-height of the violin silhouette

  const top = bins.map((count, i) => {
    const x = scale((i + 0.5) * binWidth);
    const h = (count / maxBin) * AMPLITUDE;
    return `${x},${12 - h}`;
  });
  const bottom = bins
    .map((count, i) => {
      const x = scale((i + 0.5) * binWidth);
      const h = (count / maxBin) * AMPLITUDE;
      return `${x},${12 + h}`;
    })
    .reverse();
  const points = [...top, ...bottom].join(" ");
  const { median } = computeStats(values);

  return (
    <div className="flex items-center gap-3" style={{ height: ROW_HEIGHT }}>
      <span style={{ width: LABEL_WIDTH }} className="text-xs text-text-muted truncate">{label}</span>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="flex-1" style={{ height: 24 }}>
        <polygon points={points} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={0.75} />
        <line x1={scale(median)} x2={scale(median)} y1={4} y2={20} stroke={color} strokeWidth={1.5} />
      </svg>
    </div>
  );
}
