"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../_components/DashboardSidebar";
import KpiCard from "../_components/KpiCard";
import CompletionAnalyticsPanel from "../_components/CompletionAnalyticsPanel";
import {
  api,
  ApiError,
  getApiBaseUrl,
  getAuthToken,
  Campaign,
  CampaignAnalytics,
  AttractivenessEntry,
  Store,
  Camera,
  TrafficPoint,
  ZoneTraffic,
} from "@/lib/api";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "campaign-performance", label: "Campaign Performance" },
  { id: "promotion-effectiveness", label: "Promotion Effectiveness" },
  { id: "product-visibility", label: "Product Visibility" },
  { id: "product-attractiveness", label: "Product Attractiveness" },
  { id: "customer-engagement", label: "Customer Engagement" },
  { id: "conversion-analysis", label: "Conversion Analysis" },
  { id: "attention-insights", label: "Attention Insights" },
  { id: "traffic-insights", label: "Traffic Insights" },
  { id: "marketing-recommendations", label: "Marketing Recommendations" },
  { id: "action-center", label: "Action Center" },
  { id: "campaign-reports", label: "Campaign Reports" },
  { id: "export-reports", label: "Export Reports" },
  { id: "settings", label: "Settings" },
  { id: "completion", label: "Completion Analytics" },
];

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "â€”";
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "â€”";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function signedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)} pts`;
}

function statusClass(status: string): string {
  if (status === "active") return "text-emerald-600";
  if (status === "completed") return "text-blue-600";
  return "text-amber-600";
}

function Bar({
  value,
  label,
  right,
}: {
  value: number;
  label: string;
  right?: string;
}) {
  const width = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-sm">
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground">{right ?? formatPercent(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function MarketingManagerPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<
    Record<string, CampaignAnalytics>
  >({});
  const [stores, setStores] = useState<Store[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [shelves, setShelves] = useState<Array<{ id: string; store_id: string; shelf_name: string }>>([]);
  const [attractiveness, setAttractiveness] = useState<
    Array<AttractivenessEntry & { storeName: string; cameraName: string }>
  >([]);
  const [traffic, setTraffic] = useState<TrafficPoint[]>([]);
  const [zoneTraffic, setZoneTraffic] = useState<ZoneTraffic[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    store_id: "",
    shelf_id: "",
    start_date: "",
    end_date: "",
  });
  const [campaignActionLoading, setCampaignActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaignRequest = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = await response.json();
        message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      } catch {}
      throw new Error(message);
    }
    return response.status === 204 ? null : response.json();
  }, []);

  const openCreateCampaign = () => {
    setEditingCampaignId(null);
    setCampaignForm({
      name: "",
      store_id: selectedStoreId || stores[0]?.id || "",
      shelf_id: "",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
    });
    setShowCampaignForm(true);
  };

  const openEditCampaign = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setCampaignForm({
      name: campaign.name,
      store_id: campaign.store_id,
      shelf_id: campaign.shelf_id,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
    });
    setShowCampaignForm(true);
  };

  const saveCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.store_id || !campaignForm.shelf_id) {
      setError("Campaign name, store and shelf are required.");
      return;
    }
    if (!campaignForm.start_date || !campaignForm.end_date) {
      setError("Campaign start and end dates are required.");
      return;
    }
    if (campaignForm.end_date < campaignForm.start_date) {
      setError("Campaign end date cannot be before the start date.");
      return;
    }
    setCampaignActionLoading(true);
    try {
      if (editingCampaignId) {
        await campaignRequest(`/api/campaigns/${editingCampaignId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: campaignForm.name.trim(),
            shelf_id: campaignForm.shelf_id,
            start_date: campaignForm.start_date,
            end_date: campaignForm.end_date,
          }),
        });
      } else {
        await campaignRequest("/api/campaigns", {
          method: "POST",
          body: JSON.stringify(campaignForm),
        });
      }
      setShowCampaignForm(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Campaign save failed.");
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const removeCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    setCampaignActionLoading(true);
    try {
      await campaignRequest(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      if (selectedCampaignId === campaign.id) setSelectedCampaignId("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Campaign deletion failed.");
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const exportCampaign = async (format: "pdf" | "excel") => {
    if (!selectedCampaignId) return;
    setCampaignActionLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${getApiBaseUrl()}/api/campaigns/${selectedCampaignId}/export?format=${format}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!response.ok) throw new Error("Campaign export failed.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedCampaign?.name || "campaign"}_report.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Campaign export failed.");
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [campaignList, storeList] = await Promise.all([
        api.listCampaigns(),
        api.listStores(),
      ]);

      setCampaigns(campaignList);
      setStores(storeList);

      const shelfGroups = await Promise.all(
        storeList.map(async (store) => {
          try { return await api.listShelves(store.id); } catch { return []; }
        })
      );
      setShelves(shelfGroups.flat());

      const storeId = selectedStoreId || storeList[0]?.id || "";
      setSelectedStoreId(storeId);

      if (campaignList.length) {
        const current = selectedCampaignId || campaignList[0].id;
        setSelectedCampaignId(
          campaignList.some((c) => c.id === current) ? current : campaignList[0].id
        );
      } else {
        setSelectedCampaignId("");
      }

      const cameraGroups = await Promise.all(
        storeList.map(async (store) => {
          try {
            return await api.listCameras(store.id);
          } catch {
            return [];
          }
        })
      );
      const allCameras = cameraGroups.flat();
      setCameras(allCameras);

      const attractivenessGroups = await Promise.all(
        allCameras.map(async (camera) => {
          try {
            const rows = await api.getAttractiveness(camera.store_id, camera.id);
            const store = storeList.find((s) => s.id === camera.store_id);
            return rows.map((row) => ({
              ...row,
              storeName: store?.name ?? "Unknown store",
              cameraName: camera.name,
            }));
          } catch {
            return [];
          }
        })
      );
      setAttractiveness(attractivenessGroups.flat());

      if (storeId) {
        const trafficResults = await Promise.allSettled(
          allCameras
            .filter((camera) => camera.store_id === storeId)
            .map((camera) => api.getTrafficOverTime(storeId, camera.id))
        );
        setTraffic(
          trafficResults
            .filter(
              (result): result is PromiseFulfilledResult<TrafficPoint[]> =>
                result.status === "fulfilled"
            )
            .flatMap((result) => result.value)
        );

        try {
          setZoneTraffic(await api.getZoneTraffic(storeId));
        } catch {
          setZoneTraffic([]);
        }
      } else {
        setTraffic([]);
        setZoneTraffic([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!campaigns.length) {
      setCampaignAnalytics({});
      return;
    }

    let cancelled = false;
    setAnalyticsLoading(true);

    Promise.all(
      campaigns.map(async (campaign) => {
        try {
          return [campaign.id, await api.getCampaignAnalytics(campaign.id)] as const;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, CampaignAnalytics> = {};
      results.forEach((result) => {
        if (result) next[result[0]] = result[1];
      });
      setCampaignAnalytics(next);
    }).finally(() => {
      if (!cancelled) setAnalyticsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [campaigns]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) ?? null;
  const selectedCampaignAnalytics = selectedCampaign
    ? campaignAnalytics[selectedCampaign.id]
    : undefined;

  const campaignComparisons = useMemo(
    () =>
      campaigns
        .map((campaign) => ({
          campaign,
          analytics: campaignAnalytics[campaign.id],
        }))
        .filter(
          (
            item
          ): item is { campaign: Campaign; analytics: CampaignAnalytics } =>
            Boolean(item.analytics?.has_data && item.analytics.summary)
        ),
    [campaigns, campaignAnalytics]
  );

  const campaignScopedRows = useMemo(() => {
    if (!selectedCampaign || !selectedCampaignAnalytics?.has_data) return [];
    const trend = selectedCampaignAnalytics.trend ?? [];
    return trend.map((point) => ({
      shelf_id: selectedCampaign.shelf_id,
      shelf_name: selectedCampaignAnalytics.campaign.shelf_name,
      camera_id: "campaign",
      store_id: selectedCampaign.store_id,
      final_score: point.final_score,
      attention_score: point.attention_score,
      interaction_score: point.interaction_score,
      pickup_score: point.pickup_score,
      purchase_score: point.purchase_score,
      repeat_score: point.repeat_score,
      mock_metrics: selectedCampaignAnalytics.mock_metrics ?? [],
      computed_at: point.computed_at,
      storeName: stores.find((store) => store.id === selectedCampaign.store_id)?.name ?? "Unknown store",
      cameraName: "Campaign window",
    }));
  }, [selectedCampaign, selectedCampaignAnalytics, stores]);

  const currentRowsByShelf = useMemo(() => {
    const map = new Map<string, AttractivenessEntry & { storeName: string; cameraName: string }>();
    attractiveness.forEach((row) => {
      const key = `${row.store_id}-${row.shelf_id}`;
      if (!map.has(key)) {
        map.set(key, row);
      }
    });
    return [...map.values()];
  }, [attractiveness]);

  const attractivenessByShelf = useMemo(() => {
    if (campaignScopedRows.length) {
      const row = campaignScopedRows.reduce((latest, current) =>
        new Date(current.computed_at).getTime() > new Date(latest.computed_at).getTime() ? current : latest
      );
      return [row];
    }
    return currentRowsByShelf.sort((a, b) => b.final_score - a.final_score);
  }, [campaignScopedRows, currentRowsByShelf]);

  const averages = useMemo(() => {
    if (!attractivenessByShelf.length) {
      return { final: 0, attention: 0, pickup: 0, purchase: 0 };
    }
    const total = campaignScopedRows.length ? campaignScopedRows.length : attractivenessByShelf.length;
    const rows = campaignScopedRows.length ? campaignScopedRows : attractivenessByShelf;
    return {
      final: rows.reduce((sum, row) => sum + row.final_score, 0) / total,
      attention: rows.reduce((sum, row) => sum + row.attention_score, 0) / total,
      pickup: rows.reduce((sum, row) => sum + row.pickup_score, 0) / total,
      purchase: rows.reduce((sum, row) => sum + row.purchase_score, 0) / total,
    };
  }, [attractivenessByShelf, campaignScopedRows]);

  const latestTraffic = useMemo(
    () => [...traffic].sort(
      (a, b) => b.bucket_start_seconds - a.bucket_start_seconds
    )[0],
    [traffic]
  );

  const totalTraffic = useMemo(
    () => traffic.reduce((sum, point) => sum + (point.event_count ?? 0), 0),
    [traffic]
  );

  const campaignSummary = selectedCampaignAnalytics?.summary ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <DashboardSidebar roleLabel="Marketing Manager" sections={SECTIONS} />

      <main className="min-w-0 flex-1 p-6 md:p-8 flex flex-col gap-10">
        <section id="overview" className="scroll-mt-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Marketing</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Marketing Manager Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Campaign performance, product visibility, attention, traffic and actionable marketing insights.
              </p>
            </div>
            <button
              onClick={loadAll}
              disabled={loading || analyticsLoading}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {loading || analyticsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard value={campaigns.length} label="Total Campaigns" accent="blue" />
            <KpiCard value={campaigns.filter((c) => c.status === "active").length} label="Active Campaigns" accent="green" />
            <KpiCard value={formatPercent(averages.attention)} label="Avg Attention Score" accent="blue" />
            <KpiCard value={formatPercent(averages.final)} label="Avg Attractiveness Score" accent="amber" />
          </div>
        </section>

        <section id="campaign-performance" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Campaign Performance"
            description="Campaign-level performance using the existing Campaign Analytics endpoint."
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateCampaign}
              disabled={campaignActionLoading}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Create Campaign
            </button>
            {selectedCampaign && (
              <>
                <button
                  type="button"
                  onClick={() => openEditCampaign(selectedCampaign)}
                  disabled={campaignActionLoading}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  Edit Campaign
                </button>
                <button
                  type="button"
                  onClick={() => removeCampaign(selectedCampaign)}
                  disabled={campaignActionLoading}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete Campaign
                </button>
              </>
            )}
          </div>

          {showCampaignForm && (
            <div className="rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{editingCampaignId ? "Edit Campaign" : "Create Campaign"}</h3>
                <button type="button" onClick={() => setShowCampaignForm(false)} className="text-sm text-muted-foreground">
                  Cancel
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Campaign name"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <select
                  value={campaignForm.store_id}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, store_id: e.target.value, shelf_id: "" }))}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select store</option>
                  {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
                <select
                  value={campaignForm.shelf_id}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, shelf_id: e.target.value }))}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select shelf</option>
                  {shelves.filter((s) => s.store_id === campaignForm.store_id).map((shelf) => (
                    <option key={shelf.id} value={shelf.id}>{shelf.shelf_name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={saveCampaign}
                disabled={campaignActionLoading}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {campaignActionLoading ? "Saving..." : editingCampaignId ? "Save Changes" : "Create Campaign"}
              </button>
            </div>
          )}

          {campaigns.length === 0 ? (
            <EmptyState>No campaigns exist yet.</EmptyState>
          ) : (
            <>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full md:w-auto rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              {campaignSummary && selectedCampaign ? (
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-5">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{selectedCampaign.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(selectedCampaign.start_date)} â€“ {formatDate(selectedCampaign.end_date)}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${statusClass(selectedCampaign.status)}`}>
                        {selectedCampaign.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-5">
                      <div>
                        <p className="text-xs text-muted-foreground">Average attractiveness score</p>
                        <p className="text-2xl font-semibold">{formatPercent(campaignSummary.average_final_score)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Average attention score</p>
                        <p className="text-2xl font-semibold">{formatPercent(campaignSummary.average_attention_score)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Before â†’ after score</p>
                        <p className="text-lg font-semibold">
                          {formatPercent(campaignSummary.before_final_score)} â†’ {formatPercent(campaignSummary.after_final_score)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Change</p>
                        <p className="text-lg font-semibold">{signedPercent(campaignSummary.final_score_change)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-5 space-y-4">
                    <h3 className="font-semibold">Campaign Comparison</h3>
                    {campaignComparisons.length === 0 ? (
                      <EmptyState>No campaign has usable analytics data.</EmptyState>
                    ) : (
                      campaignComparisons.map(({ campaign, analytics }) => (
                        <button
                          key={campaign.id}
                          onClick={() => setSelectedCampaignId(campaign.id)}
                          className="block w-full text-left"
                        >
                          <Bar
                            label={campaign.name}
                            value={analytics.summary!.average_final_score}
                            right={formatPercent(analytics.summary!.average_final_score)}
                          />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState>
                  This campaign has no score snapshots in its configured date range yet.
                </EmptyState>
              )}

              {selectedCampaignAnalytics?.trend?.length ? (
                <div className="rounded-lg border border-border p-5">
                  <h3 className="font-semibold">Campaign Score Trend</h3>
                  <div className="mt-4 overflow-x-auto">
                    <div className="flex items-end gap-1 min-w-[620px] h-48">
                      {selectedCampaignAnalytics.trend.map((point, index) => (
                        <div
                          key={`${point.computed_at}-${index}`}
                          title={`${new Date(point.computed_at).toLocaleString()} â€” ${formatPercent(point.final_score)}`}
                          className="flex-1 min-w-[3px] rounded-t bg-primary/70 hover:bg-primary"
                          style={{ height: `${Math.max(4, point.final_score * 100)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Each bar is a stored attractiveness-score snapshot inside the selected campaign window. Attention score is real; other attractiveness components may be mocked.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section id="promotion-effectiveness" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Promotion Effectiveness"
            description="Before/after campaign impact from the available campaign analytics."
          />
          {campaignSummary ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Attractiveness lift</p>
                <p className="text-2xl font-semibold mt-1">{signedPercent(campaignSummary.final_score_change)}</p>
              </div>
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Attention lift</p>
                <p className="text-2xl font-semibold mt-1">{signedPercent(campaignSummary.attention_score_change)}</p>
              </div>
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Samples</p>
                <p className="text-2xl font-semibold mt-1">{formatNumber(campaignSummary.sample_count)}</p>
              </div>
            </div>
          ) : (
            <EmptyState>Promotion lift is available only when the selected campaign has score data.</EmptyState>
          )}
          <p className="text-xs text-amber-700">
            Sales revenue, footfall lift and conversion uplift are not claimed because those signals are not currently stored against Campaign.
          </p>
        </section>

        <section id="product-visibility" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Product Visibility"
            description={selectedCampaignAnalytics?.has_data ? `Campaign-window attention and attractiveness for ${selectedCampaign?.name}.` : "Current shelf-level attention and attractiveness proxy across available cameras."}
          />
          {attractivenessByShelf.length ? (
            <>
            <p className="text-xs text-muted-foreground">
              {selectedCampaignAnalytics?.has_data
                ? `Showing the selected campaign window: ${formatDate(selectedCampaign!.start_date)} â€“ ${formatDate(selectedCampaign!.end_date)}.`
                : "Showing the latest available shelf snapshots."}
            </p>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-4 py-3">Shelf</th>
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Attention score</th>
                    <th className="px-4 py-3">Attractiveness score</th>
                    <th className="px-4 py-3">Data quality</th>
                  </tr>
                </thead>
                <tbody>
                  {attractivenessByShelf.map((row) => (
                    <tr key={`${row.store_id}-${row.shelf_id}`} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.shelf_name}</td>
                      <td className="px-4 py-3">{row.storeName}</td>
                      <td className="px-4 py-3">{formatPercent(row.attention_score)}</td>
                      <td className="px-4 py-3">{formatPercent(row.final_score)}</td>
                      <td className="px-4 py-3 text-xs">
                        {row.mock_metrics?.length ? `Partial: ${row.mock_metrics.join(", ")}` : "Real"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <EmptyState>No attractiveness snapshots are available.</EmptyState>
          )}
        </section>

        <section id="product-attractiveness" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Product Attractiveness"
            description={selectedCampaignAnalytics?.has_data ? "Campaign-window attractiveness for the selected shelf." : "Current shelf ranking and component breakdown from the existing attractiveness pipeline."}
          />
          {attractivenessByShelf.length ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-lg border p-5 space-y-4">
                {attractivenessByShelf.slice(0, 8).map((row, index) => (
                  <div key={`${row.store_id}-${row.shelf_id}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>#{index + 1} {row.shelf_name}</span>
                      <span className="font-medium">{formatPercent(row.final_score)}</span>
                    </div>
                    <Bar label="" value={row.final_score} />
                  </div>
                ))}
              </div>
              <div className="rounded-lg border p-5 space-y-4">
                <h3 className="font-semibold">Average component scores</h3>
                <Bar label="Attention" value={averages.attention} />
                <Bar label="Pickup" value={averages.pickup} />
                <Bar label="Purchase" value={averages.purchase} />
                <p className="text-xs text-amber-700">
                  Pickup and purchase are provider-backed proxies. Attention score is the real signal.
                </p>
              </div>
            </div>
          ) : (
            <EmptyState>No attractiveness data available.</EmptyState>
          )}
        </section>

        <section id="customer-engagement" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Customer Engagement"
            description={selectedCampaignAnalytics?.has_data ? "Campaign-window engagement proxies for the selected campaign shelf." : "Engagement proxies from the available interaction/attention scoring data."}
          />
          {attractivenessByShelf.length ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Average attention score</p>
                <p className="text-2xl font-semibold">{formatPercent(averages.attention)}</p>
              </div>
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Average pickup proxy</p>
                <p className="text-2xl font-semibold">{formatPercent(averages.pickup)}</p>
              </div>
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Average purchase proxy</p>
                <p className="text-2xl font-semibold">{formatPercent(averages.purchase)}</p>
              </div>
            </div>
          ) : (
            <EmptyState>No engagement-related scoring data available.</EmptyState>
          )}
        </section>

        <section id="conversion-analysis" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Conversion Analysis"
            description={selectedCampaignAnalytics?.has_data ? "Campaign-window attention score versus purchase proxy for the selected campaign shelf." : "Attention score versus purchase proxy at shelf level."}
          />
          {attractivenessByShelf.length ? (
            <div className="rounded-lg border p-5">
              <div className="grid md:grid-cols-2 gap-4">
                {attractivenessByShelf.slice(0, 10).map((row) => (
                  <div key={`${row.store_id}-${row.shelf_id}`} className="rounded-md bg-muted/30 p-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{row.shelf_name}</span>
                      <span className="text-xs text-muted-foreground">{row.storeName}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Attention score</p>
                        <p className="font-semibold">{formatPercent(row.attention_score)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase proxy</p>
                        <p className="font-semibold">{formatPercent(row.purchase_score)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-700 mt-4">
                Purchase is mocked in the current attractiveness provider. This is a proxy comparison, not observed conversion.
              </p>
            </div>
          ) : (
            <EmptyState>No conversion proxy data available.</EmptyState>
          )}
        </section>

        <section id="attention-insights" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Attention Insights"
            description="Real attention signal and its campaign-level change."
          />
          {campaignSummary ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Average attention score</p>
                <p className="text-2xl font-semibold">{formatPercent(campaignSummary.average_attention_score)}</p>
              </div>
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Latest attention score</p>
                <p className="text-2xl font-semibold">{formatPercent(campaignSummary.latest_attention_score)}</p>
              </div>
              <div className="rounded-lg border p-5">
                <p className="text-xs text-muted-foreground">Before â†’ after score</p>
                <p className="text-lg font-semibold">
                  {formatPercent(campaignSummary.before_attention_score)} â†’ {formatPercent(campaignSummary.after_attention_score)}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState>Select a campaign with analytics data to see attention insights.</EmptyState>
          )}
        </section>

        <section id="traffic-insights" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Traffic Insights"
            description="Current store traffic observations from camera analytics. Campaign-level traffic attribution is not available yet."
          />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-5">
              <p className="text-xs text-muted-foreground">Traffic observations</p>
              <p className="text-2xl font-semibold">{formatNumber(traffic.length)}</p>
            </div>
            <div className="rounded-lg border p-5">
              <p className="text-xs text-muted-foreground">Aggregate traffic value</p>
              <p className="text-2xl font-semibold">{formatNumber(totalTraffic)}</p>
            </div>
            <div className="rounded-lg border p-5">
              <p className="text-xs text-muted-foreground">Latest observation</p>
              <p className="text-sm font-medium mt-2">
                {latestTraffic ? formatNumber(latestTraffic.event_count) : "â€”"}
              </p>
            </div>
          </div>

          {zoneTraffic.length ? (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-4 py-3">Zone</th>
                    <th className="px-4 py-3">Traffic</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneTraffic.map((zone, index) => (
                    <tr key={`${zone.zone_name}-${index}`} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{zone.zone_name}</td>
                      <td className="px-4 py-3">{formatNumber(zone.event_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No zone traffic data is available for the selected store.</EmptyState>
          )}
        </section>

        <section id="marketing-recommendations" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Marketing Recommendations"
            description="Recommendations derived from observable attention and attractiveness patterns."
          />
          {attractivenessByShelf.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {attractivenessByShelf.slice(0, 4).map((row) => {
                const gap = row.attention_score - row.pickup_score;
                const highAttentionLowPickup = gap > 0.15;
                return (
                  <div key={`${row.store_id}-${row.shelf_id}`} className="rounded-lg border p-5">
                    <p className="text-xs text-muted-foreground">{row.storeName}</p>
                    <h3 className="font-semibold mt-1">{row.shelf_name}</h3>
                    <p className="text-sm text-muted-foreground mt-3">
                      {highAttentionLowPickup
                        ? "Attention score is materially higher than the pickup proxy. Review product placement, offer visibility, or shelf messaging."
                        : row.final_score >= 0.7
                          ? "Strong attractiveness. Preserve placement and consider using this shelf as a benchmark."
                          : "Attractiveness is below the strongest shelf. Review placement and attention drivers before changing the campaign."}
                    </p>
                    <div className="mt-4">
                      <Bar label="Attention" value={row.attention_score} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState>No data-backed recommendations can be generated yet.</EmptyState>
          )}
        </section>

        <section id="action-center" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Action Center"
            description="Concrete actions surfaced from current data quality and performance."
          />
          <div className="rounded-lg border p-5 space-y-3 text-sm">
            {selectedCampaignAnalytics?.mock_metrics?.length ? (
              <div className="rounded-md bg-amber-50 p-3 text-amber-800">
                <strong>Data quality action:</strong> real providers are still needed for{" "}
                {selectedCampaignAnalytics.mock_metrics.join(", ")}.
              </div>
            ) : null}
            {attractivenessByShelf[0] ? (
              <div className="rounded-md bg-muted/40 p-3">
                <strong>Benchmark action:</strong> use{" "}
                {attractivenessByShelf[0].shelf_name} as the current top shelf benchmark.
              </div>
            ) : null}
            {campaigns.some((c) => c.status === "upcoming") ? (
              <div className="rounded-md bg-muted/40 p-3">
                <strong>Campaign action:</strong> review upcoming campaign dates and confirm that score collection will run during the campaign window.
              </div>
            ) : null}
            {!attractivenessByShelf.length && !campaigns.length && (
              <p className="text-muted-foreground">No actions can be generated until campaigns or analytics data exist.</p>
            )}
          </div>
        </section>

        <section id="campaign-reports" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Campaign Reports"
            description="Report-ready campaign summaries from the current analytics data."
          />
          {selectedCampaign && (
            <div className="flex gap-2">
              <button type="button" onClick={() => exportCampaign("pdf")} disabled={campaignActionLoading}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
                Export PDF
              </button>
              <button type="button" onClick={() => exportCampaign("excel")} disabled={campaignActionLoading}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
                Export Excel
              </button>
            </div>
          )}
          {campaignComparisons.length ? (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Samples</th>
                    <th className="px-4 py-3">Avg Score</th>
                    <th className="px-4 py-3">Avg Attention</th>
                    <th className="px-4 py-3">Score Change</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignComparisons.map(({ campaign, analytics }) => (
                    <tr key={campaign.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{campaign.name}</td>
                      <td className="px-4 py-3">{analytics.summary!.sample_count}</td>
                      <td className="px-4 py-3">{formatPercent(analytics.summary!.average_final_score)}</td>
                      <td className="px-4 py-3">{formatPercent(analytics.summary!.average_attention_score)}</td>
                      <td className="px-4 py-3">{signedPercent(analytics.summary!.final_score_change)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No campaign report data is available yet.</EmptyState>
          )}
        </section>

        <section id="export-reports" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Export Reports"
            description="Exports will use the campaign report data currently available to the Marketing Manager."
          />
          <div className="rounded-lg border p-5">
            {selectedCampaign ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground mr-auto">
                  Export the selected campaign with its analytics, trend and data-quality disclosures.
                </p>
                <button type="button" onClick={() => exportCampaign("pdf")} disabled={campaignActionLoading}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
                  PDF
                </button>
                <button type="button" onClick={() => exportCampaign("excel")} disabled={campaignActionLoading}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
                  Excel
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a campaign to export its report.</p>
            )}
          </div>
        </section>

        <section id="completion" className="scroll-mt-6 space-y-5">
          <SectionTitle
            title="Completion Analytics"
            description="Real interaction/POS-backed completion signals and explicit data-quality boundaries."
          />
          {selectedStoreId ? (
            <CompletionAnalyticsPanel storeId={selectedStoreId} cameraId={cameras[0]?.id} compact />
          ) : (
            <EmptyState>Select an analytics store.</EmptyState>
          )}
        </section>

        <section id="settings" className="scroll-mt-6 space-y-5 pb-12">
          <SectionTitle
            title="Settings"
            description="Marketing Manager configuration."
          />
          <div className="rounded-lg border p-5 space-y-4">
            <label className="block text-sm">
              <span className="font-medium">Analytics store</span>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {stores.length === 0 ? (
                  <option value="">No stores available</option>
                ) : (
                  stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-md bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Stores</p>
                <p className="font-semibold mt-1">{stores.length}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Cameras</p>
                <p className="font-semibold mt-1">{cameras.length}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Tracked shelves</p>
                <p className="font-semibold mt-1">{attractivenessByShelf.length}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


