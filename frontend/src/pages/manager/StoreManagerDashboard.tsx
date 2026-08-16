import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "../../components/AppShell";
import { LiveCameras } from "../../components/LiveCameras";
import { Badge, Select, StatCard } from "../../components/ui";
import {
  analyticsApi,
  attentionApi,
  camerasApi,
  liveTrackingApi,
  notificationsApi,
  productsApi,
  recommendationsApi,
  sessionsApi,
  shelvesApi,
  storesApi,
  zonesApi,
} from "../../api/resources";
import type {
  Camera,
  Notification,
  OccupancySnapshot,
  Product,
  Recommendation,
  Shelf,
  ShopperSessionSummary,
  Store,
  StoreSummary,
  Zone,
} from "../../types";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SEVERITY_TONE: Record<string, "ok" | "warn" | "critical"> = {
  info: "ok",
  warning: "warn",
  critical: "critical",
};

export function StoreManagerDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancySnapshot | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sessions, setSessions] = useState<ShopperSessionSummary[]>([]);
  const [interactions, setInteractions] = useState<
    { product_id: number; interaction_type: string; timestamp: string }[]
  >([]);
  const [shelfAttentionCounts, setShelfAttentionCounts] = useState<Record<number, number>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    storesApi.list().then((s) => {
      setStores(s);
      if (s.length > 0) setStoreId(s[0].id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (storeId === null) return;
    setLoading(true);
    const start = daysAgoIso(1);
    const end = new Date().toISOString();

    Promise.all([
      analyticsApi.summary(storeId, start, end).catch(() => null),
      liveTrackingApi.occupancy(storeId).catch(() => null),
      camerasApi.list(storeId).catch(() => []),
      zonesApi.list(storeId).catch(() => []),
      shelvesApi.list(storeId).catch(() => []),
      productsApi.list().catch(() => []),
      sessionsApi.list(storeId).catch(() => []),
      attentionApi.listInteractions().catch(() => []),
      notificationsApi.list(storeId).catch(() => []),
      recommendationsApi.list(storeId).catch(() => []),
    ]).then(
      ([sum, occ, cams, zns, shvs, prods, sess, ix, notes, recs]) => {
        setSummary(sum as StoreSummary | null);
        setOccupancy(occ as OccupancySnapshot | null);
        setCameras(cams as Camera[]);
        setZones(zns as Zone[]);
        setShelves(shvs as Shelf[]);
        setProducts(prods as Product[]);
        setSessions(sess as ShopperSessionSummary[]);
        setInteractions(ix as any);
        setNotifications(notes as Notification[]);
        setRecommendations(recs as Recommendation[]);
        setLoading(false);
      }
    );

    // Shelf attention: one request per shelf, run after the shelves list
    // above resolves (kept separate since it depends on that result).
    shelvesApi.list(storeId).then((shvs) => {
      Promise.all(
        shvs.map((sh) =>
          attentionApi
            .listEvents({ shelf_id: sh.id })
            .then((events) => [sh.id, events.length] as const)
            .catch(() => [sh.id, 0] as const)
        )
      ).then((pairs) => {
        setShelfAttentionCounts(Object.fromEntries(pairs));
      });
    });
  }, [storeId]);

  const onlineCameras = cameras.filter((c) => c.status === "online").length;

  const productsPickedToday = interactions.filter((i) => i.interaction_type === "picked_up").length;

  // Section 3 - Store Traffic
  const visitorsByHour = useMemo(() => {
    const buckets: Record<number, number> = {};
    for (const s of sessions) {
      const hour = new Date(s.entry_time).getHours();
      buckets[hour] = (buckets[hour] || 0) + 1;
    }
    return Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, visitors: buckets[h] || 0 }));
  }, [sessions]);

  const customersByZone = useMemo(() => {
    return zones.map((z, idx) => ({
      zone: z.name,
      customers: occupancy?.by_zone_index?.[String(idx)] ?? 0,
    }));
  }, [zones, occupancy]);

  // Section 4 - Shelf Performance
  const shelfPerformance = useMemo(() => {
    const maxCount = Math.max(1, ...Object.values(shelfAttentionCounts));
    return shelves
      .map((sh) => ({
        name: sh.name,
        events: shelfAttentionCounts[sh.id] ?? 0,
        engagementPct: Math.round(((shelfAttentionCounts[sh.id] ?? 0) / maxCount) * 100),
      }))
      .sort((a, b) => b.events - a.events);
  }, [shelves, shelfAttentionCounts]);

  // Section 5 - Product Interaction
  const productName = (id: number) => products.find((p) => p.id === id)?.name ?? `Product ${id}`;
  const rankByType = (type: string, ascending = false) => {
    const counts: Record<number, number> = {};
    for (const i of interactions) {
      if (i.interaction_type === type) counts[i.product_id] = (counts[i.product_id] || 0) + 1;
    }
    const rows = Object.entries(counts).map(([pid, count]) => ({
      product_id: Number(pid),
      count,
    }));
    rows.sort((a, b) => (ascending ? a.count - b.count : b.count - a.count));
    return rows.slice(0, 5);
  };
  const mostPicked = rankByType("picked_up");

  // Section: Product interaction donut - totals across all products, by type.
  const interactionTotals = useMemo(() => {
    const counts: Record<string, number> = { picked_up: 0, viewed: 0, returned: 0, compared: 0 };
    for (const i of interactions) {
      if (i.interaction_type in counts) counts[i.interaction_type] += 1;
    }
    return [
      { key: "picked_up", label: "Picked", value: counts.picked_up, color: "#4fd1c5" },
      { key: "viewed", label: "Viewed", value: counts.viewed, color: "#f2a93b" },
      { key: "returned", label: "Returned", value: counts.returned, color: "#f2603b" },
      { key: "compared", label: "Compared", value: counts.compared, color: "#7c8592" },
    ];
  }, [interactions]);
  const interactionTotal = interactionTotals.reduce((sum, r) => sum + r.value, 0);

  const highPriorityRecs = useMemo(
    () =>
      recommendations
        .filter((r) => !r.is_dismissed)
        .sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0))
        .slice(0, 5),
    [recommendations]
  );

  const topPickedRows = useMemo(() => {
    return mostPicked.map((r) => ({
      ...r,
      product: products.find((p) => p.id === r.product_id),
    }));
  }, [mostPicked, products]);

  const storeName = stores.find((s) => s.id === storeId)?.name ?? "";

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Store manager dashboard</h1>
          <p className="text-xs text-text-muted font-mono">{storeName || "—"} · Today</p>
        </div>
        {stores.length > 0 && (
          <Select value={storeId ?? ""} onChange={(e) => setStoreId(Number(e.target.value))} className="w-56">
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="p-8 max-w-6xl space-y-8">
        {stores.length === 0 ? (
          <p className="text-sm text-text-muted">No stores registered yet.</p>
        ) : loading ? (
          <p className="text-sm text-text-muted font-mono">Loading…</p>
        ) : (
          <>
            {/* Section 1 - KPI Cards */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Today's visitors" value={summary?.total_visitors ?? 0} />
              <StatCard label="Customers in store" value={occupancy?.total ?? 0} />
              <StatCard
                label="Avg. dwell time"
                value={`${Math.round(summary?.average_dwell_time_seconds ?? 0)}s`}
              />
              <StatCard label="Products picked today" value={productsPickedToday} />
              <StatCard
                label="Purchase conversion"
                value={`${(summary?.conversion_rate_percent ?? 0).toFixed(1)}%`}
              />
              <StatCard label="Online cameras" value={`${onlineCameras}/${cameras.length}`} />
              <StatCard
                label="Peak hour"
                value={
                  summary?.peak_hour != null ? `${summary.peak_hour.toString().padStart(2, "0")}:00` : "—"
                }
              />
              <StatCard
                label="Avg. walking distance"
                value={`${(summary?.average_walking_distance_m ?? 0).toFixed(1)}m`}
              />
              <StatCard label="Popular zone" value={summary?.popular_zone_name ?? "—"} />
            </div>

            {/* High-priority shelf optimization recommendations */}
            <div className="bg-panel border border-hairline rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm">
                  High-priority shelf optimization recommendations
                </h2>
                <Link to="/analytics" className="text-xs text-signal hover:underline">
                  View all →
                </Link>
              </div>
              {highPriorityRecs.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No open recommendations right now - the recommendation engine regenerates
                  automatically every 30 minutes as new attractiveness scores come in.
                </p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {highPriorityRecs.map((r) => (
                    <li key={r.id} className="border border-hairline rounded-md p-3">
                      <Badge tone={(r.confidence_score ?? 0) >= 0.65 ? "critical" : "warn"}>
                        {r.recommendation_type.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-xs text-text-primary leading-snug mt-2">{r.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Row 2: Live Cameras (8-camera wall, YOLO person detection) | Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-display font-semibold text-sm">Live cameras</h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Live feeds from every store camera, monitored in real time.
                    </p>
                  </div>
                  <Link to="/cameras" className="text-xs text-signal hover:underline shrink-0">
                    Manage cameras →
                  </Link>
                </div>
                <LiveCameras />
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Alerts</h2>
                {notifications.length === 0 ? (
                  <p className="text-sm text-text-muted">No alerts - everything's running smoothly.</p>
                ) : (
                  <ul className="space-y-2.5 max-h-64 overflow-y-auto">
                    {notifications.slice(0, 6).map((n) => (
                      <li key={n.id} className="flex items-start gap-2.5 border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                        <Badge tone={SEVERITY_TONE[n.severity] ?? "muted"}>{n.severity}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary leading-snug">{n.message}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Row 3: Visitors by Hour | Customers by Zone | Top Shelf Performance | Product Interaction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Visitors by hour</h2>
                {sessions.length === 0 ? (
                  <p className="text-sm text-text-muted">No visitor sessions recorded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={visitorsByHour} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                      <XAxis dataKey="hour" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} interval={3} />
                      <YAxis tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} labelStyle={{ color: "#edeff2" }} />
                      <Line type="monotone" dataKey="visitors" stroke="#4fd1c5" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Customers by zone</h2>
                {zones.length === 0 ? (
                  <p className="text-sm text-text-muted">No zones configured yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={customersByZone} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                      <XAxis dataKey="zone" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                      <YAxis tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} labelStyle={{ color: "#edeff2" }} />
                      <Bar dataKey="customers" fill="#f2a93b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Top shelf performance</h2>
                {shelfPerformance.length === 0 ? (
                  <p className="text-sm text-text-muted">No shelves configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {shelfPerformance.slice(0, 4).map((sh) => (
                      <div key={sh.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-text-muted truncate">{sh.name}</span>
                          <span className="font-mono text-text-primary">{sh.engagementPct}%</span>
                        </div>
                        <div className="h-2 bg-panel-raised rounded-full overflow-hidden">
                          <div className="h-full bg-ok rounded-full" style={{ width: `${sh.engagementPct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Product interaction</h2>
                {interactionTotal === 0 ? (
                  <p className="text-sm text-text-muted">No interactions recorded yet.</p>
                ) : (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={interactionTotals}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {interactionTotals.map((r) => (
                            <Cell key={r.key} fill={r.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="font-display text-lg font-semibold">{interactionTotal}</p>
                      <p className="text-[10px] text-text-muted font-mono uppercase">Total</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {interactionTotals.map((r) => (
                        <div key={r.key} className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />
                          {r.label} ({interactionTotal ? Math.round((r.value / interactionTotal) * 100) : 0}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Top Picked Products | Recent Activities | Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-sm">Top picked products</h2>
                  <Link to="/catalog" className="text-xs text-signal hover:underline">
                    View all →
                  </Link>
                </div>
                {topPickedRows.length === 0 ? (
                  <p className="text-sm text-text-muted">No data yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text-muted font-mono text-[10px] uppercase tracking-wide">
                        <th className="pb-2 font-normal">#</th>
                        <th className="pb-2 font-normal">Product</th>
                        <th className="pb-2 font-normal text-right">Picked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPickedRows.map((r, idx) => (
                        <tr key={r.product_id} className="border-t border-hairline">
                          <td className="py-2 text-text-muted font-mono">{idx + 1}</td>
                          <td className="py-2 text-text-primary truncate max-w-[10rem]">
                            {r.product?.name ?? productName(r.product_id)}
                          </td>
                          <td className="py-2 text-right font-mono text-text-primary">{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-sm">Recent activities</h2>
                  <Link to="/analytics" className="text-xs text-signal hover:underline">
                    View all →
                  </Link>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-text-muted">No recent activity.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {notifications.slice(0, 5).map((n) => (
                      <li key={n.id} className="flex items-start gap-2.5 border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                        <Badge tone={SEVERITY_TONE[n.severity] ?? "muted"}>{n.notification_type.replace(/_/g, " ")}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary leading-snug">{n.message}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Quick actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/analytics"
                    className="rounded-md bg-signal/15 border border-signal/30 text-signal text-xs font-medium px-3 py-4 text-center hover:bg-signal/25 transition-colors"
                  >
                    View reports
                  </Link>
                  <Link
                    to="/cameras"
                    className="rounded-md bg-ok/15 border border-ok/30 text-ok text-xs font-medium px-3 py-4 text-center hover:bg-ok/25 transition-colors"
                  >
                    Manage cameras
                  </Link>
                  <Link
                    to="/tracking"
                    className="rounded-md bg-warn/15 border border-warn/30 text-warn text-xs font-medium px-3 py-4 text-center hover:bg-warn/25 transition-colors"
                  >
                    Add alert
                  </Link>
                  <Link
                    to="/"
                    className="rounded-md bg-critical/15 border border-critical/30 text-critical text-xs font-medium px-3 py-4 text-center hover:bg-critical/25 transition-colors"
                  >
                    Store settings
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
