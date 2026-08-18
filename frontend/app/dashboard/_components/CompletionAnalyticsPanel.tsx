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
            <p className="text-xs text-muted-foreground">Sankey-ready flow data. Cross-camera re-identification is not claimed.</p>
          </div>
        </div>
        <div className="space-y-2">
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
        {!journey?.links?.length && <p className="mt-3 text-xs text-muted-foreground">No trustworthy cross-zone links yet. The backend will not fabricate shopper transitions.</p>}
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
