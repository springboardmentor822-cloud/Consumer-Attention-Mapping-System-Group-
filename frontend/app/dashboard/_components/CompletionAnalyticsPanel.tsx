"use client";

import { useEffect, useState } from "react";
import { api, ApiError, CompletionInteractions, JourneyData, ConversionSummary, CompletionAlert, getApiBaseUrl, getAuthToken } from "@/lib/api";

function pct(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "warn" | "neutral" }) {
  const cls = tone === "good"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-border bg-muted text-muted-foreground";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{children}</span>;
}

const SANKEY_COLORS = ["currentColor", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

// Custom SVG Sankey - no sankey-layout library is installed in this
// project (checked package.json before writing this), and with only a
// handful of zones per store, a hand-computed layout is simpler and
// lighter than adding a new dependency for it. Real column-per-zone,
// zones ordered left-to-right by first appearance in the links (source
// zones left of the targets they feed), link widths proportional to the
// real matched-transition counts from journey_data().
function JourneySankey({ journey }: { journey: JourneyData }) {
  const nodeNames = journey.nodes.map((n) => n.name);
  if (!nodeNames.length) return null;

  // Column assignment: a node with no incoming link is column 0; every
  // other node's column is 1 + the max column of anything that links
  // into it. Falls back gracefully for cycles/unlinked nodes (stays at
  // its default column) rather than looping forever.
  const columnOf = new Map<string, number>(nodeNames.map((n) => [n, 0]));
  for (let pass = 0; pass < nodeNames.length; pass++) {
    let changed = false;
    for (const link of journey.links) {
      const targetCol = columnOf.get(link.target) ?? 0;
      const sourceCol = columnOf.get(link.source) ?? 0;
      if (targetCol <= sourceCol) {
        columnOf.set(link.target, sourceCol + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const columns = new Map<number, string[]>();
  for (const name of nodeNames) {
    const col = columnOf.get(name) ?? 0;
    columns.set(col, [...(columns.get(col) ?? []), name]);
  }
  const columnCount = Math.max(...columns.keys()) + 1;

  const width = 560;
  const height = 220;
  const nodeWidth = 14;
  const colGap = columnCount > 1 ? (width - nodeWidth) / (columnCount - 1) : 0;

  const nodePositions = new Map<string, { x: number; y: number; height: number; color: string }>();
  for (let col = 0; col < columnCount; col++) {
    const names = columns.get(col) ?? [];
    const totalValue = names.reduce(
      (sum, name) =>
        sum +
        Math.max(
          1,
          journey.zone_observations.find((z) => z.zone === name)?.count ?? 1
        ),
      0
    );
    let y = 10;
    const gap = 10;
    const usableHeight = height - 20 - gap * Math.max(0, names.length - 1);
    names.forEach((name, i) => {
      const value = Math.max(1, journey.zone_observations.find((z) => z.zone === name)?.count ?? 1);
      const h = Math.max(20, (value / totalValue) * usableHeight);
      nodePositions.set(name, { x: col * colGap, y, height: h, color: SANKEY_COLORS[i % SANKEY_COLORS.length] });
      y += h + gap;
    });
  }

  const maxLinkValue = Math.max(...journey.links.map((l) => l.value), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {journey.links.map((link, i) => {
        const source = nodePositions.get(link.source);
        const target = nodePositions.get(link.target);
        if (!source || !target) return null;
        const strokeWidth = Math.max(2, (link.value / maxLinkValue) * 24);
        const x1 = source.x + nodeWidth;
        const y1 = source.y + source.height / 2;
        const x2 = target.x;
        const y2 = target.y + target.height / 2;
        const midX = (x1 + x2) / 2;
        return (
          <path
            key={`${link.source}-${link.target}-${i}`}
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke={source.color}
            className={source.color === "currentColor" ? "text-primary" : undefined}
            strokeOpacity={0.4}
            strokeWidth={strokeWidth}
          />
        );
      })}
      {[...nodePositions.entries()].map(([name, pos]) => (
        <g key={name}>
          <rect
            x={pos.x}
            y={pos.y}
            width={nodeWidth}
            height={pos.height}
            fill={pos.color}
            className={pos.color === "currentColor" ? "text-primary" : undefined}
            rx={2}
          />
          <text
            x={pos.x + (pos.x < width / 2 ? nodeWidth + 6 : -6)}
            y={pos.y + pos.height / 2}
            fontSize={11}
            fill="currentColor"
            className="text-foreground"
            textAnchor={pos.x < width / 2 ? "start" : "end"}
            dominantBaseline="middle"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function CompletionAnalyticsPanel({
  storeId,
  cameraId,
  compact = false,
}: {
  storeId: string;
  cameraId?: string;
  compact?: boolean;
}) {
  const [interactions, setInteractions] = useState<CompletionInteractions | null>(null);
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [conversion, setConversion] = useState<ConversionSummary | null>(null);
  const [alerts, setAlerts] = useState<CompletionAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      cameraId ? api.getCompletionInteractions(storeId, cameraId) : Promise.resolve(null),
      api.getJourney(storeId),
      api.getConversion(storeId, cameraId),
      api.getCompletionAlerts(storeId),
    ]).then(([i, j, c, a]) => {
      if (!alive) return;
      setInteractions(i);
      setJourney(j);
      setConversion(c);
      setAlerts(a);
      setError(null);
    }).catch((err: unknown) => {
      if (!alive) return;
      setError(err instanceof ApiError ? err.message : "Completion analytics could not be loaded.");
    });
    return () => { alive = false; };
  }, [storeId, cameraId]);

  async function downloadCsv() {
    const token = getAuthToken();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/completion/${storeId}/report.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "completion-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  const maxZone = Math.max(...(journey?.zone_observations.map((x) => x.count) ?? [1]));

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold">Completion Analytics</h2>
          <p className="text-xs text-muted-foreground">Real/derived signals added without inventing purchase data.</p>
        </div>
        <button onClick={downloadCsv} className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">Export CSV</button>
      </div>

      <div className={`grid gap-4 ${compact ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground mb-2">Person ↔ product interaction</div>
          <div className="text-2xl font-semibold">{interactions?.interaction_events ?? "—"}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge tone="good">derived from tracking</Badge>
            {interactions && <Badge>{interactions.data_quality.interaction}</Badge>}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Pickup candidates: {interactions?.pickup_candidates ?? 0} · Return candidates: {interactions?.return_candidates ?? 0}</div>
          <div className="mt-1 text-xs text-amber-700">Pickup/return are candidates, not hand-level CV.</div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground mb-2">Purchase / conversion</div>
          <div className="text-2xl font-semibold">{conversion?.purchase.transactions ?? 0}</div>
          <div className="text-xs text-muted-foreground">POS transactions</div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge tone={conversion?.conversion_available ? "good" : "warn"}>
              {conversion?.conversion_available ? "Real POS data" : "No POS data"}
            </Badge>
          </div>
          <div className="mt-2 text-xs">Revenue: ₹{(conversion?.purchase.revenue ?? 0).toFixed(2)}</div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground mb-2">Journey coverage</div>
          <div className="text-2xl font-semibold">{journey?.sessions ?? "—"}</div>
          <div className="text-xs text-muted-foreground">camera-scoped sessions</div>
          <div className="mt-2"><Badge tone="warn">{journey?.data_quality ?? "Loading"}</Badge></div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Journey / zone flow</h3>
            <p className="text-xs text-muted-foreground">
              Real timing-proximity heuristic, not confirmed shopper identity — see the note below the diagram.
            </p>
          </div>
        </div>

        {journey?.links?.length ? (
          <>
            <JourneySankey journey={journey} />
            <p className="mt-3 text-xs text-amber-700">{journey.disclosure}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            No zone-to-zone transitions matched the timing window yet
            {journey ? ` (${journey.sessions} session${journey.sessions === 1 ? "" : "s"} observed, 0 matched).` : "."}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Zone observation counts</p>
          {(journey?.zone_observations ?? []).map((z) => (
            <div key={z.zone} className="flex items-center gap-3">
              <div className="w-36 truncate text-xs">{z.zone}</div>
              <div className="h-5 flex-1 rounded bg-muted overflow-hidden">
                <div className="h-full bg-foreground/70" style={{ width: `${(z.count / maxZone) * 100}%` }} />
              </div>
              <div className="w-10 text-right text-xs">{z.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border p-3">
        <h3 className="text-sm font-semibold mb-2">Operational alerts</h3>
        {alerts.length ? (
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a) => (
              <div key={a.id} className="rounded-md border p-2 text-xs">
                <div className="flex justify-between gap-2"><span className="font-medium">{a.event_type.replace(/^alert_/, "")}</span><span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span></div>
                <p className="text-muted-foreground mt-1">{a.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No persisted alerts for this store yet.</p>
        )}
      </div>

      {!compact && interactions?.events?.length ? (
        <div className="mt-4 rounded-lg border p-3">
          <h3 className="text-sm font-semibold mb-2">Derived interaction events</h3>
          <div className="max-h-40 overflow-auto divide-y">
            {interactions.events.slice(0, 20).map((e, i) => (
              <div key={`${e.event_type}-${e.person_track_id}-${e.product_track_id}-${i}`} className="flex items-center justify-between py-2 text-xs">
                <span>{e.product_name}</span>
                <span className="text-muted-foreground">{e.event_type} · {pct(e.confidence)} confidence</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
