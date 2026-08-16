import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../components/AppShell";
import {
  analyticsApi,
  notificationsApi,
  recommendationsApi,
  scoresApi,
  sessionsApi,
  storesApi,
} from "../api/resources";
import type {
  Notification,
  ProductRankingRow,
  Recommendation,
  ShopperSessionSummary,
  Store,
  StoreSummary,
} from "../types";
import { Button, Select } from "../components/ui";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SEGMENT_LABELS: Record<string, string> = {
  explorer: "Explorer",
  quick_buyer: "Quick Buyer",
  comparison_shopper: "Comparison Shopper",
  impulse_buyer: "Impulse Buyer",
  brand_loyal: "Brand Loyal",
  unclassified: "Unclassified",
};

const SEVERITY_COLOR: Record<string, string> = {
  info: "text-text-muted",
  warning: "text-warn",
  critical: "text-critical",
};

export function AnalyticsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [ranking, setRanking] = useState<ProductRankingRow[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sessions, setSessions] = useState<ShopperSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storesApi.list().then((s) => {
      setStores(s);
      if (s.length > 0) setStoreId(s[0].id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (storeId === null) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  function refreshAll() {
    if (storeId === null) return;
    setLoading(true);
    const start = daysAgoIso(30);
    const end = new Date().toISOString();
    Promise.all([
      analyticsApi.summary(storeId, start, end),
      analyticsApi.productRanking(storeId, start, end),
      recommendationsApi.list(storeId),
      notificationsApi.list(storeId),
      sessionsApi.list(storeId),
    ])
      .then(([s, r, recs, notifs, sess]) => {
        setSummary(s);
        setRanking(r);
        setRecommendations(recs);
        setNotifications(notifs);
        setSessions(sess);
      })
      .finally(() => setLoading(false));
  }

  async function handleComputeScores() {
    if (storeId === null) return;
    setBusy("scores");
    setError(null);
    try {
      await scoresApi.compute(storeId, daysAgoIso(30), new Date().toISOString());
      await recommendationsApi.generate(storeId);
      refreshAll();
    } catch {
      setError("Could not compute scores. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  async function handleComputeSegments() {
    if (storeId === null) return;
    setBusy("segments");
    setError(null);
    try {
      await sessionsApi.computeSegments(storeId);
      refreshAll();
    } catch {
      setError("Could not compute segments. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDismiss(id: number) {
    setError(null);
    try {
      await recommendationsApi.dismiss(id);
      setRecommendations((rs) => rs.filter((r) => r.id !== id));
    } catch {
      setError("Could not dismiss that recommendation.");
    }
  }

  const segmentCounts: Record<string, number> = {};
  for (const s of sessions) {
    segmentCounts[s.segment] = (segmentCounts[s.segment] || 0) + 1;
  }

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Analytics</h1>
          <p className="text-xs text-text-muted font-mono">Last 30 days</p>
        </div>
        <div className="flex items-center gap-3">
          {stores.length > 0 && (
            <Select
              value={storeId ?? ""}
              onChange={(e) => setStoreId(Number(e.target.value))}
              className="w-56"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div className="p-8 max-w-6xl space-y-8">
        {error && (
          <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {stores.length === 0 ? (
          <p className="text-sm text-text-muted">Register a store first to see analytics.</p>
        ) : loading ? (
          <p className="text-sm text-text-muted font-mono">Loading…</p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Visitors" value={summary?.total_visitors ?? 0} />
              <StatCard
                label="Avg. dwell time"
                value={`${Math.round((summary?.average_dwell_time_seconds ?? 0) / 60)}m`}
              />
              <StatCard label="Purchases" value={summary?.total_purchases ?? 0} />
              <StatCard label="Conversion" value={`${summary?.conversion_rate_percent ?? 0}%`} />
            </div>

            {/* Product ranking chart */}
            <div className="bg-panel border border-hairline rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold">Product engagement ranking</h2>
                <Button variant="ghost" onClick={handleComputeScores} disabled={busy === "scores"}>
                  {busy === "scores" ? "Computing…" : "Compute scores + recommendations"}
                </Button>
              </div>
              {ranking.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No product interaction data yet for this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ranking} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                    <XAxis
                      dataKey="product_name"
                      tick={{ fill: "#7c8592", fontSize: 11 }}
                      axisLine={{ stroke: "#2a313b" }}
                    />
                    <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} />
                    <Tooltip
                      contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }}
                      labelStyle={{ color: "#edeff2" }}
                    />
                    <Bar dataKey="interaction_count" fill="#f2a93b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Recommendations */}
              <div className="bg-panel border border-hairline rounded-lg p-6">
                <h2 className="font-display font-semibold mb-4">Recommendations</h2>
                {recommendations.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    No active recommendations. Compute scores above to generate some.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((r) => (
                      <div key={r.id} className="border border-hairline rounded-md p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{r.title}</p>
                          <button
                            onClick={() => handleDismiss(r.id)}
                            className="text-xs text-text-muted hover:text-signal shrink-0"
                          >
                            Dismiss
                          </button>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{r.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="bg-panel border border-hairline rounded-lg p-6">
                <h2 className="font-display font-semibold mb-4">Notifications</h2>
                {notifications.length === 0 ? (
                  <p className="text-sm text-text-muted">No notifications.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 8).map((n) => (
                      <div key={n.id} className="flex items-start gap-2 text-sm">
                        <span className={`font-mono text-[10px] uppercase mt-0.5 ${SEVERITY_COLOR[n.severity]}`}>
                          ●
                        </span>
                        <p className="text-text-primary">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer segments */}
            <div className="bg-panel border border-hairline rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold">Customer segments</h2>
                <Button variant="ghost" onClick={handleComputeSegments} disabled={busy === "segments"}>
                  {busy === "segments" ? "Classifying…" : "Compute segments"}
                </Button>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-text-muted">No completed sessions yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(segmentCounts).map(([segment, count]) => (
                    <div key={segment} className="border border-hairline rounded-md p-3 text-center">
                      <p className="font-display text-xl font-semibold">{count}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {SEGMENT_LABELS[segment] ?? segment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-panel border border-hairline rounded-lg p-5">
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-text-muted font-mono uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}
