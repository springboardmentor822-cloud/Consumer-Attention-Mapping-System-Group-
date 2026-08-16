import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AppShell } from "../../components/AppShell";
import { Badge, Button, Field, SectionTabs, Select, StatCard } from "../../components/ui";
import { BoxPlotRow, ViolinRow } from "../../components/DistributionPlot";
import { HeatmapCanvas } from "../../components/HeatmapCanvas";
import {
  analyticsApi,
  attentionApi,
  heatmapsApi,
  productsApi,
  reportsApi,
  sessionsApi,
  shelvesApi,
  storesApi,
  zonesApi,
} from "../../api/resources";
import type {
  AttentionEvent,
  Heatmap,
  Product,
  ProductInteraction,
  ProductRankingRow,
  ReportItem,
  Shelf,
  ShopperSessionSummary,
  Store,
  Zone,
} from "../../types";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "attention", label: "Attention Analytics" },
  { key: "journey", label: "Consumer Journey" },
  { key: "segmentation", label: "Segmentation" },
  { key: "shopping", label: "Shopping Behavior" },
  { key: "heatmaps", label: "Heatmaps" },
  { key: "dwell", label: "Dwell Time" },
  { key: "behavioral", label: "Behavioral Analytics" },
  { key: "reports", label: "Reports" },
];

const SEGMENT_LABELS: Record<string, string> = {
  explorer: "Explorer",
  quick_buyer: "Quick Buyer",
  comparison_shopper: "Comparison Shopper",
  impulse_buyer: "Impulse Buyer",
  brand_loyal: "Brand Loyal",
  unclassified: "Unclassified",
};

const SEGMENT_COLORS: Record<string, string> = {
  explorer: "#4fd1c5",
  quick_buyer: "#f2a93b",
  comparison_shopper: "#8a7ef2",
  impulse_buyer: "#f2495c",
  brand_loyal: "#4f9dff",
  unclassified: "#7c8592",
};

const HEATMAP_TYPES = [
  "traffic",
  "shelf",
  "product_attention",
  "engagement_hotspot",
  "movement",
  "occupancy",
];

const TREEMAP_COLORS = ["#4fd1c5", "#f2a93b", "#8a7ef2", "#f2495c", "#4f9dff", "#5fd97a", "#e0b84f"];

export function AnalystDashboard() {
  const [tab, setTab] = useState("overview");
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [heatmaps, setHeatmaps] = useState<Heatmap[]>([]);
  const [events, setEvents] = useState<AttentionEvent[]>([]);
  const [interactions, setInteractions] = useState<ProductInteraction[]>([]);
  const [sessions, setSessions] = useState<ShopperSessionSummary[]>([]);
  const [ranking, setRanking] = useState<ProductRankingRow[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heatmapType, setHeatmapType] = useState(HEATMAP_TYPES[0]);
  const [heatmapSegment, setHeatmapSegment] = useState<string>("");
  const [selectedHeatmapId, setSelectedHeatmapId] = useState<number | null>(null);

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
      heatmapsApi.list(storeId),
      attentionApi.listEvents().catch(() => [] as AttentionEvent[]),
      attentionApi.listInteractions().catch(() => [] as ProductInteraction[]),
      sessionsApi.list(storeId),
      analyticsApi.productRanking(storeId, start, end),
      reportsApi.list(storeId),
      zonesApi.list(storeId).catch(() => [] as Zone[]),
      shelvesApi.list(storeId).catch(() => [] as Shelf[]),
      productsApi.list().catch(() => [] as Product[]),
    ])
      .then(([hm, ev, ix, sess, rank, rep, zns, shvs, prods]) => {
        setHeatmaps(hm);
        setEvents(ev);
        setInteractions(ix);
        setSessions(sess);
        setRanking(rank);
        setReports(rep);
        setZones(zns);
        setShelves(shvs);
        setProducts(prods as Product[]);
      })
      .finally(() => setLoading(false));
  }

  async function handleGenerateHeatmap(e: FormEvent) {
    e.preventDefault();
    if (storeId === null) return;
    setBusy("heatmap");
    setError(null);
    try {
      const generated = await heatmapsApi.generate({
        store_id: storeId,
        heatmap_type: heatmapType,
        period_start: daysAgoIso(30),
        period_end: new Date().toISOString(),
        segment: heatmapSegment || undefined,
      });
      const hm = await heatmapsApi.list(storeId);
      setHeatmaps(hm);
      setSelectedHeatmapId(generated.id);
    } catch {
      setError("Could not generate that heatmap. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRequestReport(reportType: string, format: string) {
    if (storeId === null) return;
    setBusy("report");
    setError(null);
    try {
      await reportsApi.request({
        store_id: storeId,
        report_type: reportType,
        report_format: format,
        period_start: daysAgoIso(30),
        period_end: new Date().toISOString(),
      });
      const rep = await reportsApi.list(storeId);
      setReports(rep);
    } catch {
      setError("Could not request that report. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload(reportId: number, reportType: string, format: string) {
    setError(null);
    try {
      const ext = format === "excel" ? "xlsx" : "pdf";
      await reportsApi.download(reportId, `${reportType}-${reportId}.${ext}`);
    } catch {
      setError("Could not download that report. Try again in a moment.");
    }
  }

  const repeatEvents = events.filter((e) => e.is_repeat_attention === 1).length;
  const avgDuration = events.length
    ? events.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) / events.length
    : 0;

  const interactionCounts: Record<string, number> = {};
  for (const i of interactions) {
    interactionCounts[i.interaction_type] = (interactionCounts[i.interaction_type] || 0) + 1;
  }

  const segmentCounts: Record<string, number> = {};
  for (const s of sessions) segmentCounts[s.segment] = (segmentCounts[s.segment] || 0) + 1;
  const segmentPieData = Object.entries(segmentCounts).map(([segment, count]) => ({
    name: SEGMENT_LABELS[segment] ?? segment,
    value: count,
    color: SEGMENT_COLORS[segment] ?? "#7c8592",
  }));

  // --- Section 1: Consumer Attention Analytics ---
  const attentionByDay = useMemo(() => {
    const buckets: Record<string, { total: number; count: number }> = {};
    for (const e of events) {
      if (e.duration_seconds == null) continue;
      const key = dayKey(e.start_time);
      buckets[key] ??= { total: 0, count: 0 };
      buckets[key].total += e.duration_seconds;
      buckets[key].count += 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({
        day: day.slice(5),
        avgDuration: Math.round((v.total / v.count) * 10) / 10,
        events: v.count,
      }));
  }, [events]);

  const shelfName = (id?: number | null) => shelves.find((s) => s.id === id)?.name ?? `Shelf ${id}`;
  const shelfAttentionDurations = useMemo(() => {
    const byShelf: Record<number, number[]> = {};
    for (const e of events) {
      if (e.shelf_id == null || e.duration_seconds == null) continue;
      (byShelf[e.shelf_id] ??= []).push(e.duration_seconds);
    }
    return Object.entries(byShelf)
      .map(([shelfId, durations]) => ({ shelfId: Number(shelfId), durations }))
      .sort((a, b) => b.durations.length - a.durations.length)
      .slice(0, 6);
  }, [events]);
  const shelfDurationDomainMax = Math.max(
    1,
    ...shelfAttentionDurations.flatMap((s) => s.durations)
  );

  // --- Section 2: Consumer Journey ---
  const journeySankey = useMemo(() => {
    if (zones.length < 2) return null;
    const [entrance, aisle, checkout] = zones;
    let reachedCheckout = 0;
    let reachedAisleOnly = 0;
    let leftAtEntrance = 0;
    for (const s of sessions) {
      if (s.zones_visited_count >= 3) reachedCheckout++;
      else if (s.zones_visited_count === 2) reachedAisleOnly++;
      else leftAtEntrance++;
    }
    const nodes = [
      { name: entrance?.name ?? "Entrance" },
      { name: aisle?.name ?? "Aisle" },
      { name: checkout?.name ?? "Checkout" },
      { name: "Left early" },
    ];
    const enteredAisle = reachedAisleOnly + reachedCheckout;
    const links = [
      { source: 0, target: 1, value: enteredAisle },
      { source: 1, target: 2, value: reachedCheckout },
      { source: 0, target: 3, value: leftAtEntrance },
    ].filter((l) => l.value > 0);
    if (links.length === 0) return null;
    return { data: { nodes, links }, reachedCheckout, reachedAisleOnly, leftAtEntrance };
  }, [zones, sessions]);

  // --- Section 4: Shopping Behavior ---
  const productName = (id: number) => products.find((p) => p.id === id)?.name ?? `Product ${id}`;
  const rankByType = (type: string, ascending = false, min = 0) => {
    const counts: Record<number, number> = {};
    for (const i of interactions) {
      if (i.interaction_type === type) counts[i.product_id] = (counts[i.product_id] || 0) + 1;
    }
    let rows = Object.entries(counts).map(([pid, count]) => ({
      name: productName(Number(pid)),
      count,
    }));
    if (min > 0) rows = rows.filter((r) => r.count >= min);
    rows.sort((a, b) => (ascending ? a.count - b.count : b.count - a.count));
    return rows.slice(0, 6);
  };
  const mostViewed = rankByType("viewed");
  const mostCompared = rankByType("compared");
  const mostIgnored = useMemo(() => {
    const totalByProduct: Record<number, number> = {};
    for (const i of interactions) totalByProduct[i.product_id] = (totalByProduct[i.product_id] || 0) + 1;
    return Object.entries(totalByProduct)
      .map(([pid, count]) => ({ name: productName(Number(pid)), count }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 6);
  }, [interactions, products]);

  const brandInterest = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of interactions) {
      const product = products.find((p) => p.id === i.product_id);
      const brand = product?.brand || "Unbranded";
      counts[brand] = (counts[brand] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, size]) => ({ name, size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 8);
  }, [interactions, products]);

  // --- Section 6: Dwell Time ---
  const dwellBySegment = useMemo(() => {
    const bySegment: Record<string, number[]> = {};
    for (const s of sessions) {
      if (s.total_duration_seconds == null) continue;
      (bySegment[s.segment] ??= []).push(s.total_duration_seconds);
    }
    return Object.entries(bySegment).map(([segment, durations]) => ({
      segment: SEGMENT_LABELS[segment] ?? segment,
      durations,
    }));
  }, [sessions]);
  const dwellDomainMax = Math.max(1, ...sessions.map((s) => s.total_duration_seconds ?? 0));

  const dwellByHour = useMemo(() => {
    const buckets: Record<number, { total: number; count: number }> = {};
    for (const s of sessions) {
      if (s.total_duration_seconds == null) continue;
      const hour = new Date(s.entry_time).getHours();
      buckets[hour] ??= { total: 0, count: 0 };
      buckets[hour].total += s.total_duration_seconds;
      buckets[hour].count += 1;
    }
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      avgDwell: buckets[h] ? Math.round(buckets[h].total / buckets[h].count) : 0,
    }));
  }, [sessions]);

  // --- Section 7: Behavioral Analytics ---
  const productBehavior = useMemo(() => {
    const attentionByProduct: Record<number, number> = {};
    for (const e of events) {
      if (e.product_id == null || e.duration_seconds == null) continue;
      attentionByProduct[e.product_id] = (attentionByProduct[e.product_id] || 0) + e.duration_seconds;
    }
    const purchasesByProduct: Record<number, number> = {};
    const pickupsByProduct: Record<number, number> = {};
    for (const i of interactions) {
      if (i.interaction_type === "purchased") {
        purchasesByProduct[i.product_id] = (purchasesByProduct[i.product_id] || 0) + 1;
      }
      if (i.interaction_type === "picked_up") {
        pickupsByProduct[i.product_id] = (pickupsByProduct[i.product_id] || 0) + 1;
      }
    }
    const productIds = new Set([
      ...Object.keys(attentionByProduct).map(Number),
      ...Object.keys(purchasesByProduct).map(Number),
      ...Object.keys(pickupsByProduct).map(Number),
    ]);
    return Array.from(productIds).map((pid) => ({
      product: productName(pid),
      attention: Math.round(attentionByProduct[pid] ?? 0),
      purchases: purchasesByProduct[pid] ?? 0,
      pickups: pickupsByProduct[pid] ?? 0,
    }));
  }, [events, interactions, products]);

  // --- Overview tab: consolidated summary metrics ---
  const totalVisitors = sessions.length;
  const totalPurchases = interactions.filter((i) => i.interaction_type === "purchased").length;
  const conversionRatePct = totalVisitors ? (totalPurchases / totalVisitors) * 100 : 0;
  const avgDwellSeconds = sessions.length
    ? sessions.reduce((sum, s) => sum + (s.total_duration_seconds ?? 0), 0) / sessions.length
    : 0;
  const avgProductPrice = products.length
    ? products.reduce((sum, p) => sum + (p.price ?? 0), 0) / products.length
    : 0;
  const estimatedSales = totalPurchases * avgProductPrice;
  const aov = totalPurchases ? estimatedSales / totalPurchases : 0;

  const sessionsWithDistance = sessions.filter((s) => s.total_distance_m != null);
  const avgDistanceM = sessionsWithDistance.length
    ? sessionsWithDistance.reduce((sum, s) => sum + (s.total_distance_m ?? 0), 0) / sessionsWithDistance.length
    : 0;
  const sessionsWithVelocity = sessions.filter((s) => s.avg_velocity_mps != null);
  const avgVelocityMps = sessionsWithVelocity.length
    ? sessionsWithVelocity.reduce((sum, s) => sum + (s.avg_velocity_mps ?? 0), 0) / sessionsWithVelocity.length
    : 0;

  const dwellDistribution = useMemo(
    () =>
      dwellBySegment.map((d) => ({
        name: d.segment,
        value: d.durations.length,
        color: SEGMENT_COLORS[Object.keys(SEGMENT_LABELS).find((k) => SEGMENT_LABELS[k] === d.segment) ?? ""] ?? "#7c8592",
      })),
    [dwellBySegment]
  );

  const zoneEngagement = useMemo(
    () =>
      shelfAttentionDurations.map((s) => ({
        name: shelfName(s.shelfId),
        total: Math.round(s.durations.reduce((sum, d) => sum + d, 0)),
      })),
    [shelfAttentionDurations, shelves]
  );

  const trafficFlow = journeySankey
    ? [
        { label: "Entrance", value: journeySankey.reachedAisleOnly + journeySankey.reachedCheckout + journeySankey.leftAtEntrance },
        { label: "In-store zones", value: journeySankey.reachedAisleOnly + journeySankey.reachedCheckout },
        { label: "Checkout", value: journeySankey.reachedCheckout },
      ]
    : [];
  const trafficFlowMax = Math.max(1, ...trafficFlow.map((t) => t.value));

  const topProductsRanking = ranking.slice().sort((a, b) => b.interaction_count - a.interaction_count).slice(0, 5);

  const topSegmentEntry = Object.entries(segmentCounts).sort(([, a], [, b]) => b - a)[0];
  const topBrandEntry = brandInterest[0];
  const aiInsights = [
    topProductsRanking[0]
      ? `${topProductsRanking[0].product_name} leads engagement with ${topProductsRanking[0].interaction_count} interactions.`
      : null,
    topSegmentEntry
      ? `${SEGMENT_LABELS[topSegmentEntry[0]] ?? topSegmentEntry[0]} is the most common shopper segment (${topSegmentEntry[1]} sessions).`
      : null,
    topBrandEntry ? `${topBrandEntry.name} draws the most product interest of any brand tracked.` : null,
    journeySankey && journeySankey.leftAtEntrance > 0
      ? `${journeySankey.leftAtEntrance} shoppers left at the entrance zone without exploring further.`
      : null,
  ].filter((s): s is string => Boolean(s));

  const keyTakeaways = [
    `Conversion rate is ${conversionRatePct.toFixed(1)}% across ${totalVisitors} tracked visits.`,
    `Average dwell time sits at ${Math.round(avgDwellSeconds)}s per session.`,
    `Average attention duration per event is ${avgDuration.toFixed(1)}s.`,
  ];

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Retail analyst dashboard</h1>
          <p className="text-xs text-text-muted font-mono">Last 30 days</p>
        </div>
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

      <SectionTabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="p-8 max-w-6xl space-y-8">
        {error && (
          <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {stores.length === 0 ? (
          <p className="text-sm text-text-muted">No stores registered yet.</p>
        ) : loading ? (
          <p className="text-sm text-text-muted font-mono">Loading…</p>
        ) : (
          <>
            {tab === "overview" && (
              <>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard label="Total visitors" value={totalVisitors.toLocaleString()} />
                  <StatCard label="Avg. attention time" value={`${avgDuration.toFixed(2)}s`} />
                  <StatCard label="Avg. dwell time" value={`${avgDwellSeconds.toFixed(1)}s`} />
                  <StatCard label="Conversion rate" value={`${conversionRatePct.toFixed(1)}%`} />
                  <StatCard label="Est. sales" value={`$${estimatedSales.toFixed(0)}`} />
                  <StatCard label="AOV" value={`$${aov.toFixed(0)}`} />
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-5">
                  <h2 className="font-display font-semibold text-sm mb-3">Journey &amp; movement</h2>
                  {sessionsWithDistance.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      No path-distance data yet - this fills in once tracked sessions close and
                      their raw camera positions are aggregated into a walked path.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="font-display text-xl font-semibold">{avgDistanceM.toFixed(1)}m</p>
                        <p className="text-[11px] text-text-muted font-mono uppercase tracking-wide">
                          Avg. distance walked
                        </p>
                      </div>
                      <div>
                        <p className="font-display text-xl font-semibold">{avgVelocityMps.toFixed(2)} m/s</p>
                        <p className="text-[11px] text-text-muted font-mono uppercase tracking-wide">
                          Avg. velocity
                        </p>
                      </div>
                      <div>
                        <p className="font-display text-xl font-semibold">{sessionsWithDistance.length}</p>
                        <p className="text-[11px] text-text-muted font-mono uppercase tracking-wide">
                          Sessions with journey data
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Consumer journey flow</h2>
                    {!journeySankey ? (
                      <p className="text-sm text-text-muted">Not enough zone/session data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <Sankey
                          data={journeySankey.data}
                          nodePadding={20}
                          link={{ stroke: "#4fd1c5", strokeOpacity: 0.3 }}
                          node={{ fill: "#8a7ef2" }}
                        >
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        </Sankey>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Attention analytics over time</h2>
                    {attentionByDay.length === 0 ? (
                      <p className="text-sm text-text-muted">No attention events yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={attentionByDay} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Line type="monotone" dataKey="avgDuration" name="Avg. seconds" stroke="#4fd1c5" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Customer segmentation</h2>
                    {segmentPieData.length === 0 ? (
                      <p className="text-sm text-text-muted">No sessions recorded yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={segmentPieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                            {segmentPieData.map((d) => (
                              <Cell key={d.name} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Shopping behaviour</h2>
                    {mostViewed.length === 0 ? (
                      <p className="text-sm text-text-muted">No interactions yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={mostViewed} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="name" tick={{ fill: "#7c8592", fontSize: 8 }} axisLine={{ stroke: "#2a313b" }} hide />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Bar dataKey="count" fill="#4f9dff" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Dwell time distribution</h2>
                    {dwellDistribution.length === 0 ? (
                      <p className="text-sm text-text-muted">No dwell data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={dwellDistribution} dataKey="value" nameKey="name" innerRadius={38} outerRadius={65} paddingAngle={2}>
                            {dwellDistribution.map((d) => (
                              <Cell key={d.name} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Zone performance by engagement</h2>
                    {zoneEngagement.length === 0 ? (
                      <p className="text-sm text-text-muted">No shelf attention data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={zoneEngagement} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis type="number" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis type="category" dataKey="name" width={70} tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Bar dataKey="total" fill="#8a7ef2" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Traffic flow</h2>
                    {trafficFlow.length === 0 ? (
                      <p className="text-sm text-text-muted">No journey data yet.</p>
                    ) : (
                      <div className="space-y-3 pt-2">
                        {trafficFlow.map((t) => (
                          <div key={t.label}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-text-muted">{t.label}</span>
                              <span className="font-mono text-text-primary">{t.value}</span>
                            </div>
                            <div className="h-3 bg-panel-raised rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-signal"
                                style={{ width: `${Math.max(6, (t.value / trafficFlowMax) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display font-semibold text-sm">Top performing products</h2>
                      <button onClick={() => setTab("shopping")} className="text-xs text-signal hover:underline">
                        View →
                      </button>
                    </div>
                    {topProductsRanking.length === 0 ? (
                      <p className="text-sm text-text-muted">No ranking data yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-text-muted font-mono text-[10px] uppercase tracking-wide">
                            <th className="pb-2 font-normal">#</th>
                            <th className="pb-2 font-normal">Product</th>
                            <th className="pb-2 font-normal text-right">Interactions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProductsRanking.map((r, idx) => (
                            <tr key={r.product_id} className="border-t border-hairline">
                              <td className="py-2 text-text-muted font-mono">{idx + 1}</td>
                              <td className="py-2 text-text-primary truncate max-w-[9rem]">{r.product_name}</td>
                              <td className="py-2 text-right font-mono text-text-primary">{r.interaction_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">AI insights</h2>
                    {aiInsights.length === 0 ? (
                      <p className="text-sm text-text-muted">Not enough data yet for insights.</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {aiInsights.map((line, i) => (
                          <li key={i} className="flex items-start gap-2.5 border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                            <Badge tone="signal">Insight</Badge>
                            <p className="text-xs text-text-primary leading-snug">{line}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Key takeaways</h2>
                    <ul className="space-y-2.5">
                      {keyTakeaways.map((line, i) => (
                        <li key={i} className="flex items-start gap-2.5 border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                          <Badge tone="ok">Takeaway</Badge>
                          <p className="text-xs text-text-primary leading-snug">{line}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {tab === "attention" && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Attention events" value={events.length} />
                  <StatCard label="Repeat attention" value={repeatEvents} />
                  <StatCard label="Avg. gaze duration" value={`${avgDuration.toFixed(1)}s`} />
                  <StatCard label="Interactions logged" value={interactions.length} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-4">Average attention duration</h2>
                    {attentionByDay.length === 0 ? (
                      <p className="text-sm text-text-muted">No attention events yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={attentionByDay} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} labelStyle={{ color: "#edeff2" }} />
                          <Line type="monotone" dataKey="avgDuration" name="Avg. seconds" stroke="#4fd1c5" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-4">Attention trend</h2>
                    {attentionByDay.length === 0 ? (
                      <p className="text-sm text-text-muted">No attention events yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={attentionByDay} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} labelStyle={{ color: "#edeff2" }} />
                          <Area type="monotone" dataKey="events" name="Events" stroke="#f2a93b" fill="#f2a93b" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Attention time distribution by shelf</h2>
                  <p className="text-xs text-text-muted mb-4">
                    Box plot of gaze duration (seconds) for the busiest shelves.
                  </p>
                  {shelfAttentionDurations.length === 0 ? (
                    <p className="text-sm text-text-muted">No shelf-linked attention events yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {shelfAttentionDurations.map((s) => (
                        <BoxPlotRow
                          key={s.shelfId}
                          label={shelfName(s.shelfId)}
                          values={s.durations}
                          domainMax={shelfDurationDomainMax}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "journey" && (
              <div className="bg-panel border border-hairline rounded-lg p-6">
                <h2 className="font-display font-semibold mb-1">Customer journey</h2>
                <p className="text-xs text-text-muted mb-4">
                  Derived from how far each session's shopper got (zones visited) - an
                  approximation, since raw per-zone paths aren't stored per session.
                </p>
                {!journeySankey ? (
                  <p className="text-sm text-text-muted">Not enough session data yet.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <Sankey
                        data={journeySankey.data}
                        nodePadding={30}
                        margin={{ top: 10, bottom: 10, left: 10, right: 100 }}
                        link={{ stroke: "#4fd1c5", strokeOpacity: 0.35 }}
                        node={{ fill: "#f2a93b" }}
                      >
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                      </Sankey>
                    </ResponsiveContainer>
                    <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-2 text-xs text-text-muted font-mono flex-wrap">
                      <span>Entrance</span>
                      <span className="text-signal">→</span>
                      <span>Aisle ({journeySankey.reachedAisleOnly + journeySankey.reachedCheckout})</span>
                      <span className="text-signal">→</span>
                      <span>Checkout ({journeySankey.reachedCheckout})</span>
                      <span className="text-text-muted/60 ml-4">
                        Left at entrance: {journeySankey.leftAtEntrance}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "segmentation" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Customer segments</h2>
                  {segmentPieData.length === 0 ? (
                    <p className="text-sm text-text-muted">No completed sessions yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={segmentPieData} dataKey="value" nameKey="name" outerRadius={90} label>
                          {segmentPieData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Segment distribution</h2>
                  {segmentPieData.length === 0 ? (
                    <p className="text-sm text-text-muted">No completed sessions yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={segmentPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                          {segmentPieData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {tab === "shopping" && (
              <>
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Overall product engagement ranking</h2>
                  {ranking.length === 0 ? (
                    <p className="text-sm text-text-muted">No product interaction data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ranking} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis dataKey="product_name" tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} />
                        <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} />
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} labelStyle={{ color: "#edeff2" }} />
                        <Bar dataKey="interaction_count" fill="#f2a93b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { title: "Most viewed products", rows: mostViewed, color: "#4fd1c5" },
                    { title: "Frequently ignored products", rows: mostIgnored, color: "#7c8592" },
                    { title: "Most compared products", rows: mostCompared, color: "#8a7ef2" },
                  ].map((col) => (
                    <div key={col.title} className="bg-panel border border-hairline rounded-lg p-6">
                      <h2 className="font-display font-semibold mb-4 text-sm">{col.title}</h2>
                      {col.rows.length === 0 ? (
                        <p className="text-xs text-text-muted">No data yet.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={col.rows} layout="vertical" margin={{ left: 10 }}>
                            <XAxis type="number" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={90}
                              tick={{ fill: "#7c8592", fontSize: 10 }}
                              axisLine={{ stroke: "#2a313b" }}
                            />
                            <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                            <Bar dataKey="count" fill={col.color} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Product category interest</h2>
                  <p className="text-xs text-text-muted mb-4">
                    Grouped by brand (used as a category proxy - no separate category catalog is
                    exposed yet), sized by total interactions.
                  </p>
                  {brandInterest.length === 0 ? (
                    <p className="text-sm text-text-muted">No product interactions yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <Treemap
                        data={brandInterest}
                        dataKey="size"
                        nameKey="name"
                        stroke="#0e1116"
                        fill="#4fd1c5"
                      >
                        {brandInterest.map((_, i) => (
                          <Cell key={i} fill={TREEMAP_COLORS[i % TREEMAP_COLORS.length]} />
                        ))}
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                      </Treemap>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            )}

            {tab === "heatmaps" && (
              <>
                <form
                  onSubmit={handleGenerateHeatmap}
                  className="bg-panel border border-hairline rounded-lg p-6 flex flex-wrap items-end gap-4"
                >
                  <Field label="Layer" hint="Foot-traffic layers use a KDE density map; shelf layers rank attention per shelf.">
                    <Select value={heatmapType} onChange={(e) => setHeatmapType(e.target.value)} className="w-56">
                      {HEATMAP_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Shopper segment" hint="Optional - narrows the layer to one segment.">
                    <Select value={heatmapSegment} onChange={(e) => setHeatmapSegment(e.target.value)} className="w-48">
                      <option value="">All segments</option>
                      <option value="explorer">Explorer</option>
                      <option value="quick_buyer">Quick buyer</option>
                      <option value="comparison_shopper">Comparison shopper</option>
                      <option value="impulse_buyer">Impulse buyer</option>
                      <option value="brand_loyal">Brand loyal</option>
                    </Select>
                  </Field>
                  <Button type="submit" disabled={busy === "heatmap"}>
                    {busy === "heatmap" ? "Generating…" : "Generate heatmap"}
                  </Button>
                </form>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-4">Generated heatmaps</h2>
                    {heatmaps.length === 0 ? (
                      <p className="text-sm text-text-muted">No heatmaps generated yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[420px] overflow-y-auto">
                        {heatmaps.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => setSelectedHeatmapId(h.id)}
                            className={`w-full text-left border rounded-md p-3 transition-colors ${
                              selectedHeatmapId === h.id
                                ? "border-signal bg-signal/10"
                                : "border-hairline hover:border-signal/40"
                            }`}
                          >
                            <Badge tone="signal">{h.heatmap_type.replace(/_/g, " ")}</Badge>
                            <p className="text-xs text-text-muted mt-2">
                              {new Date(h.period_start).toLocaleDateString()} –{" "}
                              {new Date(h.period_end).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-text-muted mt-1 font-mono">
                              Generated {new Date(h.generated_at).toLocaleString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-4">Heatmap view</h2>
                    {(() => {
                      const selected = heatmaps.find((h) => h.id === selectedHeatmapId) ?? heatmaps[0];
                      if (!selected) {
                        return <p className="text-sm text-text-muted">Generate a heatmap to see it rendered here.</p>;
                      }
                      const shelfNames = Object.fromEntries(shelves.map((s) => [s.id, s.name]));
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-4">
                            <Badge tone="signal">{selected.heatmap_type.replace(/_/g, " ")}</Badge>
                            <span className="text-xs text-text-muted font-mono">
                              {new Date(selected.period_start).toLocaleDateString()} –{" "}
                              {new Date(selected.period_end).toLocaleDateString()}
                            </span>
                          </div>
                          <HeatmapCanvas rawData={selected.data} shelfNames={shelfNames} />
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            {tab === "dwell" && (
              <>
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Dwell time distribution</h2>
                  <p className="text-xs text-text-muted mb-4">
                    Violin plot of total visit duration (seconds), by customer segment.
                  </p>
                  {dwellBySegment.length === 0 ? (
                    <p className="text-sm text-text-muted">No completed sessions yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {dwellBySegment.map((d) => (
                        <ViolinRow key={d.segment} label={d.segment} values={d.durations} domainMax={dwellDomainMax} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Average dwell time by hour</h2>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-text-muted">No sessions recorded yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={dwellByHour} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis dataKey="hour" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} interval={2} />
                        <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} labelStyle={{ color: "#edeff2" }} />
                        <Line type="monotone" dataKey="avgDwell" name="Avg. seconds" stroke="#4f9dff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            )}

            {tab === "behavioral" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Attention vs. purchases</h2>
                  <p className="text-xs text-text-muted mb-4">One point per product.</p>
                  {productBehavior.length === 0 ? (
                    <p className="text-sm text-text-muted">No product behavior data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <ScatterChart margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis
                          dataKey="attention"
                          name="Attention (s)"
                          tick={{ fill: "#7c8592", fontSize: 10 }}
                          axisLine={{ stroke: "#2a313b" }}
                        />
                        <YAxis
                          dataKey="purchases"
                          name="Purchases"
                          tick={{ fill: "#7c8592", fontSize: 10 }}
                          axisLine={{ stroke: "#2a313b" }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }}
                        />
                        <Scatter data={productBehavior} fill="#4fd1c5" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Attention vs. pickups vs. purchases</h2>
                  <p className="text-xs text-text-muted mb-4">Bubble size = purchase count.</p>
                  {productBehavior.length === 0 ? (
                    <p className="text-sm text-text-muted">No product behavior data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <ScatterChart margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis
                          dataKey="attention"
                          name="Attention (s)"
                          tick={{ fill: "#7c8592", fontSize: 10 }}
                          axisLine={{ stroke: "#2a313b" }}
                        />
                        <YAxis
                          dataKey="pickups"
                          name="Pickups"
                          tick={{ fill: "#7c8592", fontSize: 10 }}
                          axisLine={{ stroke: "#2a313b" }}
                          allowDecimals={false}
                        />
                        <ZAxis dataKey="purchases" range={[40, 400]} name="Purchases" />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }}
                        />
                        <Scatter data={productBehavior} fill="#f2a93b" fillOpacity={0.7} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {tab === "reports" && (
              <>
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Request a report</h2>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="ghost"
                      disabled={busy === "report"}
                      onClick={() => handleRequestReport("shelf_performance", "pdf")}
                    >
                      Shelf performance (PDF)
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy === "report"}
                      onClick={() => handleRequestReport("product_engagement", "excel")}
                    >
                      Product engagement (Excel)
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy === "report"}
                      onClick={() => handleRequestReport("conversion", "pdf")}
                    >
                      Conversion (PDF)
                    </Button>
                  </div>
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Generated reports</h2>
                  {reports.length === 0 ? (
                    <p className="text-sm text-text-muted">No reports requested yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-text-muted font-mono text-[11px] uppercase tracking-wide">
                          <th className="pb-2 font-normal">Type</th>
                          <th className="pb-2 font-normal">Format</th>
                          <th className="pb-2 font-normal">Status</th>
                          <th className="pb-2 font-normal"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((r) => (
                          <tr key={r.id} className="border-t border-hairline">
                            <td className="py-2.5 text-text-primary">{r.report_type.replace(/_/g, " ")}</td>
                            <td className="py-2.5 text-text-muted uppercase font-mono text-xs">
                              {r.report_format}
                            </td>
                            <td className="py-2.5">
                              <Badge tone={r.status === "ready" ? "ok" : r.status === "failed" ? "critical" : "muted"}>
                                {r.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-right">
                              {r.status === "ready" && (
                                <button
                                  onClick={() => handleDownload(r.id, r.report_type, r.report_format)}
                                  className="text-xs text-signal hover:underline"
                                >
                                  Download
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
