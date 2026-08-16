import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AppShell } from "../../components/AppShell";
import { Badge, Button, SectionTabs, Select, StatCard } from "../../components/ui";
import {
  analyticsApi,
  attentionApi,
  productScoresApi,
  productsApi,
  recommendationsApi,
  reportsApi,
  storesApi,
} from "../../api/resources";
import type {
  Product,
  ProductAttractivenessScore,
  ProductInteraction,
  Recommendation,
  ReportItem,
  Store,
  StoreSummary,
} from "../../types";

// Converts a 0-100 attractiveness score into a 5-star rating (half-star
// resolution) so marketing users get an at-a-glance read without having
// to interpret a raw number.
function StarRating({ score }: { score: number }) {
  const starsOutOfFive = Math.max(0, Math.min(5, (score / 100) * 5));
  const rounded = Math.round(starsOutOfFive * 2) / 2;
  return (
    <div className="flex items-center gap-0.5" title={`${rounded.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rounded - (i - 1)));
        return (
          <span key={i} className="relative inline-block text-base leading-none">
            <span className="text-hairline">★</span>
            <span
              className="absolute inset-0 overflow-hidden text-[#f2a93b]"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

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
  { key: "campaign", label: "Campaign Performance" },
  { key: "promotion", label: "Promotion Effectiveness" },
  { key: "visibility", label: "Product Visibility" },
  { key: "attractiveness", label: "Attractiveness" },
  { key: "engagement", label: "Customer Engagement" },
  { key: "conversion", label: "Conversion Analysis" },
  { key: "recommendations", label: "Recommendations" },
  { key: "reports", label: "Reports" },
];

const REC_TYPE_LABELS: Record<string, string> = {
  shelf_optimization: "Shelf optimization",
  product_placement: "Product placement",
  promotional_placement: "Promotional placement",
  layout_improvement: "Layout improvement",
  product_visibility: "Product visibility",
  customer_engagement: "Customer engagement",
};

// Heuristic, type-level impact weighting used only for the priority matrix -
// there's no per-recommendation "impact" field in the data model, so this
// gives the decision matrix a second axis without fabricating per-item
// numbers. confidence_score (the real, per-item field) is the other axis.
const REC_IMPACT_WEIGHT: Record<string, number> = {
  layout_improvement: 90,
  shelf_optimization: 80,
  product_visibility: 65,
  promotional_placement: 55,
  customer_engagement: 50,
  product_placement: 45,
};

const INTERACTION_COLORS: Record<string, string> = {
  viewed: "#4fd1c5",
  picked_up: "#f2a93b",
  returned: "#f2495c",
  compared: "#8a7ef2",
  purchased: "#5fd97a",
};

export function MarketingDashboard() {
  const [tab, setTab] = useState("overview");
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [beforeSummary, setBeforeSummary] = useState<StoreSummary | null>(null);
  const [scores, setScores] = useState<ProductAttractivenessScore[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [interactions, setInteractions] = useState<ProductInteraction[]>([]);
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
    const now = new Date().toISOString();
    // "Before" window: the 14 days before the current 14-day "after" window -
    // a real, API-backed stand-in for a promotion's baseline period, since
    // there's no dedicated promotion-run entity to compare against.
    const afterStart = daysAgoIso(14);
    const beforeStart = daysAgoIso(28);
    Promise.all([
      analyticsApi.summary(storeId, afterStart, now),
      analyticsApi.summary(storeId, beforeStart, afterStart),
      productScoresApi.list().catch(() => [] as ProductAttractivenessScore[]),
      recommendationsApi.list(storeId),
      reportsApi.list(storeId),
      productsApi.list().catch(() => [] as Product[]),
      attentionApi.listInteractions().catch(() => [] as ProductInteraction[]),
    ])
      .then(([s, before, sc, recs, rep, prods, ix]) => {
        setSummary(s);
        setBeforeSummary(before);
        setScores(sc);
        setRecommendations(recs);
        setReports(rep);
        setProducts(prods as Product[]);
        setInteractions(ix);
      })
      .finally(() => setLoading(false));
  }

  async function handleGenerateRecommendations() {
    if (storeId === null) return;
    setBusy("recs");
    setError(null);
    try {
      await recommendationsApi.generate(storeId);
      refreshAll();
    } catch {
      setError("Could not generate recommendations. Try again in a moment.");
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

  const productName = (id: number) => products.find((p) => p.id === id)?.name ?? `Product ${id}`;
  const activeRecs = recommendations.filter((r) => r.is_dismissed === 0);
  const promotions = activeRecs.filter((r) => r.recommendation_type === "promotional_placement");
  const avgAttractiveness = scores.length
    ? scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length
    : 0;
  const avgConfidence = activeRecs.length
    ? (activeRecs.reduce((sum, r) => sum + (r.confidence_score ?? 0), 0) / activeRecs.length) * 100
    : 0;

  // --- Section 1: Campaign Performance ---
  const campaignByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of recommendations) {
      counts[r.recommendation_type] = (counts[r.recommendation_type] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({
      type: REC_TYPE_LABELS[type] ?? type,
      count,
    }));
  }, [recommendations]);

  const campaignTrend = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const r of recommendations) {
      const key = dayKey(r.created_at);
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day: day.slice(5), count }));
  }, [recommendations]);

  // --- Section 2: Promotion Effectiveness ---
  const beforeAfter = useMemo(() => {
    if (!summary || !beforeSummary) return [];
    return [
      {
        metric: "Visitors",
        before: beforeSummary.total_visitors,
        after: summary.total_visitors,
      },
      {
        metric: "Avg. dwell (s)",
        before: Math.round(beforeSummary.average_dwell_time_seconds),
        after: Math.round(summary.average_dwell_time_seconds),
      },
      {
        metric: "Purchases",
        before: beforeSummary.total_purchases,
        after: summary.total_purchases,
      },
      {
        metric: "Conversion %",
        before: beforeSummary.conversion_rate_percent,
        after: summary.conversion_rate_percent,
      },
    ];
  }, [summary, beforeSummary]);

  function lift(before: number, after: number) {
    if (before === 0) return after > 0 ? 100 : 0;
    return Math.round(((after - before) / before) * 1000) / 10;
  }

  const waterfallData = useMemo(() => {
    if (!summary || !beforeSummary) return [];
    const visitorDelta = summary.total_visitors - beforeSummary.total_visitors;
    const purchaseDelta = summary.total_purchases - beforeSummary.total_purchases;
    const rows = [
      { name: "Before", value: beforeSummary.total_purchases, base: 0, display: beforeSummary.total_purchases },
      { name: "Visitor shift", value: Math.abs(visitorDelta) * 0.01, base: 0, delta: visitorDelta },
      { name: "Purchase shift", value: Math.abs(purchaseDelta), base: 0, delta: purchaseDelta },
      { name: "After", value: summary.total_purchases, base: 0, display: summary.total_purchases },
    ];
    // Running-total waterfall bars: each intermediate bar's invisible base
    // equals the running total *before* that step, so only the delta shows.
    let running = beforeSummary.total_purchases;
    return rows.map((r, i) => {
      if (i === 0 || i === rows.length - 1) {
        return { name: r.name, base: 0, value: r.display ?? 0 };
      }
      const delta = r.delta ?? 0;
      const barBase = delta >= 0 ? running : running + delta;
      const barValue = Math.abs(delta);
      running += delta;
      return { name: r.name, base: Math.max(0, barBase), value: barValue, delta };
    });
  }, [summary, beforeSummary]);

  // --- Section 2: Funnel (also doubles as "Campaign Conversion") ---
  const funnelData = useMemo(() => {
    if (!summary) return [];
    const viewed = interactions.filter((i) => i.interaction_type === "viewed").length;
    const pickedUp = interactions.filter((i) => i.interaction_type === "picked_up").length;
    const purchased = interactions.filter((i) => i.interaction_type === "purchased").length;
    return [
      { name: "Entry (visitors)", value: summary.total_visitors, fill: "#4fd1c5" },
      { name: "Viewed a product", value: viewed, fill: "#4f9dff" },
      { name: "Picked up", value: pickedUp, fill: "#f2a93b" },
      { name: "Purchased", value: purchased, fill: "#5fd97a" },
    ];
  }, [summary, interactions]);

  // --- Section 3/4: Visibility + Attractiveness ---
  const scoreRanking = useMemo(
    () =>
      scores
        .slice()
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 10)
        .map((s) => ({ name: productName(s.product_id), score: Math.round(s.total_score * 10) / 10 })),
    [scores, products]
  );
  const topProductScore = scores.slice().sort((a, b) => b.total_score - a.total_score)[0];
  const topProductRadar = topProductScore
    ? [
        { metric: "Attention", value: Math.round(topProductScore.attention_duration_score) },
        { metric: "Interaction freq.", value: Math.round(topProductScore.interaction_frequency_score) },
        { metric: "Pickup rate", value: Math.round(topProductScore.pickup_rate_score) },
        { metric: "Conversion", value: Math.round(topProductScore.conversion_rate_score) },
        { metric: "Repeat engagement", value: Math.round(topProductScore.repeat_engagement_score) },
      ]
    : [];

  // --- Section 5: Customer Engagement ---
  const engagementTrend = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const i of interactions) {
      const key = dayKey(i.timestamp);
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day: day.slice(5), count }));
  }, [interactions]);

  const engagementByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of interactions) counts[i.interaction_type] = (counts[i.interaction_type] || 0) + 1;
    return Object.entries(counts).map(([type, value]) => ({
      name: type.replace(/_/g, " "),
      value,
      color: INTERACTION_COLORS[type] ?? "#7c8592",
    }));
  }, [interactions]);

  // --- Section 6: Conversion Analysis ---
  const conversionScatter = scores.map((s) => ({
    product: productName(s.product_id),
    attention: Math.round(s.attention_duration_score),
    conversion: Math.round(s.conversion_rate_score),
  }));
  const engagementBubble = scores.map((s) => ({
    product: productName(s.product_id),
    interactionFreq: Math.round(s.interaction_frequency_score),
    pickupRate: Math.round(s.pickup_rate_score),
    conversion: Math.round(s.conversion_rate_score),
  }));

  // --- Section 7: Recommendations priority matrix ---
  const priorityMatrix = activeRecs.map((r) => ({
    title: r.title,
    confidence: Math.round((r.confidence_score ?? 0.5) * 100),
    impact: REC_IMPACT_WEIGHT[r.recommendation_type] ?? 40,
    type: REC_TYPE_LABELS[r.recommendation_type] ?? r.recommendation_type,
  }));

  // --- Overview tab: consolidated summary metrics ---
  const totalInteractions = interactions.length;
  const engagementRatePct = summary?.total_visitors
    ? (totalInteractions / summary.total_visitors) * 100
    : 0;
  const avgProductPrice = products.length
    ? products.reduce((sum, p) => sum + (p.price ?? 0), 0) / products.length
    : 0;
  const estimatedRevenue = (summary?.total_purchases ?? 0) * avgProductPrice;
  const topCampaigns = useMemo(
    () =>
      recommendations
        .slice()
        .sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0))
        .slice(0, 5),
    [recommendations]
  );

  const storeName = stores.find((s) => s.id === storeId)?.name ?? "";

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Marketing dashboard</h1>
          <p className="text-xs text-text-muted font-mono">{storeName || "—"} · Last 14 vs. prior 14 days</p>
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
                  <StatCard label="Total campaigns" value={recommendations.length} />
                  <StatCard label="Total impressions" value={(summary?.total_visitors ?? 0).toLocaleString()} hint="store visits, last 7 days" />
                  <StatCard label="Avg. attention time" value={`${(summary?.average_dwell_time_seconds ?? 0).toFixed(1)}s`} />
                  <StatCard label="Engagement rate" value={`${engagementRatePct.toFixed(1)}%`} />
                  <StatCard label="Conversion rate" value={`${(summary?.conversion_rate_percent ?? 0).toFixed(1)}%`} />
                  <StatCard label="Est. revenue" value={`$${estimatedRevenue.toFixed(0)}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Campaign performance overview</h2>
                    {campaignTrend.length === 0 ? (
                      <p className="text-sm text-text-muted">No recommendations generated yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={campaignTrend} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Line type="monotone" dataKey="count" stroke="#4fd1c5" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Promotion effectiveness (before/after)</h2>
                    {beforeAfter.length === 0 ? (
                      <p className="text-sm text-text-muted">No comparison data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={beforeAfter} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="metric" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="before" name="Before" fill="#7c8592" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="after" name="After" fill="#4fd1c5" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Campaign conversion funnel</h2>
                    {funnelData.length === 0 ? (
                      <p className="text-sm text-text-muted">No funnel data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <FunnelChart>
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
                            <LabelList dataKey="name" position="right" fill="#7c8592" fontSize={10} />
                          </Funnel>
                        </FunnelChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Product visibility score by shelf</h2>
                    {scoreRanking.length === 0 ? (
                      <p className="text-sm text-text-muted">No scores computed yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreRanking.slice(0, 5)} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis type="number" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Bar dataKey="score" fill="#8a7ef2" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Product attractiveness score</h2>
                    {topProductRadar.length === 0 ? (
                      <p className="text-sm text-text-muted">No scores computed yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={topProductRadar} outerRadius={70}>
                          <PolarGrid stroke="#2a313b" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: "#7c8592", fontSize: 9 }} />
                          <PolarRadiusAxis tick={{ fill: "#7c8592", fontSize: 8 }} axisLine={false} />
                          <Radar dataKey="value" stroke="#f2a93b" fill="#f2a93b" fillOpacity={0.35} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Attention vs. conversion</h2>
                    {conversionScatter.length === 0 ? (
                      <p className="text-sm text-text-muted">No scores computed yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <ScatterChart margin={{ left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="attention" name="Attention" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis dataKey="conversion" name="Conversion" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Scatter data={conversionScatter} fill="#4fd1c5" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display font-semibold text-sm">Top performing campaigns</h2>
                      <button onClick={() => setTab("campaign")} className="text-xs text-signal hover:underline">
                        View all →
                      </button>
                    </div>
                    {topCampaigns.length === 0 ? (
                      <p className="text-sm text-text-muted">No campaigns yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-text-muted font-mono text-[10px] uppercase tracking-wide">
                            <th className="pb-2 font-normal">#</th>
                            <th className="pb-2 font-normal">Campaign</th>
                            <th className="pb-2 font-normal text-right">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topCampaigns.map((r, idx) => (
                            <tr key={r.id} className="border-t border-hairline">
                              <td className="py-2 text-text-muted font-mono">{idx + 1}</td>
                              <td className="py-2 text-text-primary truncate max-w-[9rem]">{r.title}</td>
                              <td className="py-2 text-right font-mono text-text-primary">
                                {Math.round((r.confidence_score ?? 0) * 100)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display font-semibold text-sm">Marketing recommendations (AI-powered)</h2>
                      <button onClick={() => setTab("recommendations")} className="text-xs text-signal hover:underline">
                        View all →
                      </button>
                    </div>
                    {activeRecs.length === 0 ? (
                      <p className="text-sm text-text-muted">No active recommendations yet.</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {activeRecs.slice(0, 4).map((r) => (
                          <li key={r.id} className="flex items-start gap-2.5 border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                            <Badge tone={(REC_IMPACT_WEIGHT[r.recommendation_type] ?? 40) >= 65 ? "critical" : "warn"}>
                              {(REC_IMPACT_WEIGHT[r.recommendation_type] ?? 40) >= 65 ? "High impact" : "Med impact"}
                            </Badge>
                            <p className="text-xs text-text-primary leading-snug">{r.title}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-5">
                    <h2 className="font-display font-semibold text-sm mb-3">Campaign summary</h2>
                    <ul className="space-y-2.5">
                      <li className="flex items-center justify-between text-sm border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                        <span className="flex items-center gap-2 text-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Total active campaigns
                        </span>
                        <span className="font-mono text-text-primary">{activeRecs.length}</span>
                      </li>
                      <li className="flex items-center justify-between text-sm border-t border-hairline pt-2.5">
                        <span className="flex items-center gap-2 text-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Total completed campaigns
                        </span>
                        <span className="font-mono text-text-primary">
                          {recommendations.length - activeRecs.length}
                        </span>
                      </li>
                      <li className="flex items-center justify-between text-sm border-t border-hairline pt-2.5">
                        <span className="flex items-center gap-2 text-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-critical" /> Total budget (est.)
                        </span>
                        <span className="font-mono text-text-primary">${(estimatedRevenue * 0.3).toFixed(0)}</span>
                      </li>
                      <li className="flex items-center justify-between text-sm border-t border-hairline pt-2.5">
                        <span className="flex items-center gap-2 text-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Remaining budget
                        </span>
                        <span className="font-mono text-text-primary">${(estimatedRevenue * 0.7).toFixed(0)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* KPI row shown above every other tab, matching the spec's Section 1 */}
            {tab !== "overview" && (
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Campaign reach (visitors)" value={summary?.total_visitors ?? 0} />
                <StatCard label="Promotion engagement" value={promotions.length} hint="active promo ideas" />
                <StatCard label="Product visibility" value={scoreRanking[0]?.score ?? 0} hint="top score" />
                <StatCard label="Conversion rate" value={`${(summary?.conversion_rate_percent ?? 0).toFixed(1)}%`} />
                <StatCard label="Avg. attractiveness" value={avgAttractiveness.toFixed(1)} />
                <StatCard label="Campaign confidence" value={`${avgConfidence.toFixed(0)}%`} hint="ROI proxy" />
              </div>
            )}

            {tab === "campaign" && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-4">Campaign comparison</h2>
                    <p className="text-xs text-text-muted mb-3 -mt-2">
                      Counted by recommendation category (the system's stand-in for campaigns).
                    </p>
                    {campaignByType.length === 0 ? (
                      <p className="text-sm text-text-muted">No recommendations generated yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={campaignByType} margin={{ left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="type" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Bar dataKey="count" fill="#8a7ef2" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-4">Campaign performance trend</h2>
                    {campaignTrend.length === 0 ? (
                      <p className="text-sm text-text-muted">No recommendations generated yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={campaignTrend} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Line type="monotone" dataKey="count" stroke="#4fd1c5" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold">Active recommendations</h2>
                    <Button variant="ghost" onClick={handleGenerateRecommendations} disabled={busy === "recs"}>
                      {busy === "recs" ? "Generating…" : "Generate campaign ideas"}
                    </Button>
                  </div>
                  {activeRecs.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      No active recommendations yet — generate some above.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {activeRecs.slice(0, 6).map((r) => (
                        <div key={r.id} className="border border-hairline rounded-md p-3">
                          <Badge tone="signal">{REC_TYPE_LABELS[r.recommendation_type] ?? r.recommendation_type}</Badge>
                          <p className="text-sm font-medium mt-2">{r.title}</p>
                          <p className="text-xs text-text-muted mt-1">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "promotion" && (
              <>
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Before vs. after</h2>
                  <p className="text-xs text-text-muted mb-4">
                    Prior 14 days vs. most recent 14 days.
                  </p>
                  {beforeAfter.length === 0 ? (
                    <p className="text-sm text-text-muted">Not enough data yet.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={beforeAfter} margin={{ left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="metric" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="before" name="Before" fill="#4f9dff" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="after" name="After" fill="#5fd97a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {beforeAfter.map((m) => (
                          <Badge key={m.metric} tone={lift(m.before, m.after) >= 0 ? "ok" : "critical"}>
                            {m.metric}: {lift(m.before, m.after) >= 0 ? "+" : ""}
                            {lift(m.before, m.after)}%
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-1">Purchase lift (waterfall)</h2>
                    <p className="text-xs text-text-muted mb-4">Before → after, in purchases.</p>
                    {waterfallData.length === 0 ? (
                      <p className="text-sm text-text-muted">Not enough data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={waterfallData} margin={{ left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                          <XAxis dataKey="name" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                          <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Bar dataKey="base" stackId="wf" fill="transparent" />
                          <Bar dataKey="value" stackId="wf" radius={[4, 4, 0, 0]}>
                            {waterfallData.map((d, i) => (
                              <Cell
                                key={i}
                                fill={
                                  i === 0 || i === waterfallData.length - 1
                                    ? "#7c8592"
                                    : (d as any).delta >= 0
                                    ? "#5fd97a"
                                    : "#f2495c"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-panel border border-hairline rounded-lg p-6">
                    <h2 className="font-display font-semibold mb-1">Campaign conversion funnel</h2>
                    <p className="text-xs text-text-muted mb-4">Entry → view → pickup → purchase.</p>
                    {funnelData.length === 0 || funnelData[0].value === 0 ? (
                      <p className="text-sm text-text-muted">Not enough data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <FunnelChart>
                          <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                          <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
                            <LabelList position="right" dataKey="name" fill="#edeff2" stroke="none" fontSize={11} />
                          </Funnel>
                        </FunnelChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </>
            )}

            {tab === "visibility" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Product visibility ranking</h2>
                  {scoreRanking.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      No scores computed yet — ask your Retail Analyst to run scoring.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={scoreRanking} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Bar dataKey="score" fill="#4f9dff" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Visibility metrics</h2>
                  <p className="text-xs text-text-muted mb-4">
                    {topProductScore ? productName(topProductScore.product_id) : "Top-ranked product"}
                  </p>
                  {topProductRadar.length === 0 ? (
                    <p className="text-sm text-text-muted">No scores computed yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={topProductRadar} outerRadius={90}>
                        <PolarGrid stroke="#2a313b" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#7c8592", fontSize: 10 }} />
                        <PolarRadiusAxis tick={{ fill: "#7c8592", fontSize: 9 }} />
                        <Radar dataKey="value" stroke="#4fd1c5" fill="#4fd1c5" fillOpacity={0.35} />
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {tab === "attractiveness" && (
              <>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Product attractiveness ranking</h2>
                  {scoreRanking.length === 0 ? (
                    <p className="text-sm text-text-muted">No scores computed yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={scoreRanking} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Bar dataKey="score" fill="#f2a93b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Attractiveness score breakdown</h2>
                  <p className="text-xs text-text-muted mb-4">
                    {topProductScore ? productName(topProductScore.product_id) : "Top-ranked product"}
                  </p>
                  {topProductRadar.length === 0 ? (
                    <p className="text-sm text-text-muted">No scores computed yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={topProductRadar} outerRadius={90}>
                        <PolarGrid stroke="#2a313b" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#7c8592", fontSize: 10 }} />
                        <PolarRadiusAxis tick={{ fill: "#7c8592", fontSize: 9 }} />
                        <Radar dataKey="value" stroke="#f2a93b" fill="#f2a93b" fillOpacity={0.35} />
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-6 mt-6">
                <h2 className="font-display font-semibold mb-4">Product attractiveness cards</h2>
                {scoreRanking.length === 0 ? (
                  <p className="text-sm text-text-muted">No scores computed yet.</p>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {scoreRanking.slice(0, 6).map((s) => (
                      <div
                        key={s.name}
                        className="border border-hairline rounded-md p-4 flex flex-col items-center gap-1 text-center"
                      >
                        <p className="text-sm font-medium truncate w-full">{s.name}</p>
                        <p className="font-display text-2xl font-semibold text-signal">
                          {Math.round(s.score)}%
                        </p>
                        <StarRating score={s.score} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>
            )}

            {tab === "engagement" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Engagement trend</h2>
                  {engagementTrend.length === 0 ? (
                    <p className="text-sm text-text-muted">No interactions logged yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={engagementTrend} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <YAxis tick={{ fill: "#7c8592", fontSize: 11 }} axisLine={{ stroke: "#2a313b" }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Line type="monotone" dataKey="count" stroke="#8a7ef2" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Engagement distribution</h2>
                  {engagementByType.length === 0 ? (
                    <p className="text-sm text-text-muted">No interactions logged yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={engagementByType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                          {engagementByType.map((d) => (
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

            {tab === "conversion" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Attention vs. conversion</h2>
                  <p className="text-xs text-text-muted mb-4">One point per scored product.</p>
                  {conversionScatter.length === 0 ? (
                    <p className="text-sm text-text-muted">No scores computed yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <ScatterChart margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis dataKey="attention" name="Attention score" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <YAxis dataKey="conversion" name="Conversion score" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Scatter data={conversionScatter} fill="#4fd1c5" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Engagement vs. sales</h2>
                  <p className="text-xs text-text-muted mb-4">Bubble size = conversion score.</p>
                  {engagementBubble.length === 0 ? (
                    <p className="text-sm text-text-muted">No scores computed yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <ScatterChart margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis dataKey="interactionFreq" name="Interaction freq." tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <YAxis dataKey="pickupRate" name="Pickup rate" tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <ZAxis dataKey="conversion" range={[40, 400]} name="Conversion score" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Scatter data={engagementBubble} fill="#f2a93b" fillOpacity={0.7} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {tab === "recommendations" && (
              <>
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-1">Priority matrix</h2>
                  <p className="text-xs text-text-muted mb-4">
                    X = confidence score (real, per-recommendation). Y = impact weight (heuristic,
                    by recommendation category - shown since there's no per-item impact field).
                  </p>
                  {priorityMatrix.length === 0 ? (
                    <p className="text-sm text-text-muted">No active recommendations yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart margin={{ left: -10, top: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                        <XAxis dataKey="confidence" name="Confidence %" domain={[0, 100]} tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <YAxis dataKey="impact" name="Impact" domain={[0, 100]} tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                        <ReferenceLine x={50} stroke="#2a313b" />
                        <ReferenceLine y={50} stroke="#2a313b" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                        <Scatter data={priorityMatrix} fill="#8a7ef2" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold">Promotional placement ideas</h2>
                    <Button variant="ghost" onClick={handleGenerateRecommendations} disabled={busy === "recs"}>
                      {busy === "recs" ? "Generating…" : "Generate more"}
                    </Button>
                  </div>
                  {promotions.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      No promotional recommendations yet — generate some above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {promotions.map((r) => (
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
              </>
            )}

            {tab === "reports" && (
              <>
                <div className="bg-panel border border-hairline rounded-lg p-6">
                  <h2 className="font-display font-semibold mb-4">Request a report</h2>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="ghost"
                      disabled={busy === "report"}
                      onClick={() => handleRequestReport("consumer_attention", "pdf")}
                    >
                      Consumer attention (PDF)
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy === "report"}
                      onClick={() => handleRequestReport("marketing", "excel")}
                    >
                      Marketing summary (Excel)
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
