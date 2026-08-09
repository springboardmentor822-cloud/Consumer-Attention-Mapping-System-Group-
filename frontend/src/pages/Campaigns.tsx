import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  Copy,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { storesApi, zonesApi } from "../api/resources";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  campaignsApi,
  type Campaign,
  type CampaignPayload,
  type CampaignPerformance,
} from "../api/campaigns";

interface StoreOption {
  id: number;
  store_name: string;
}
interface ZoneOption {
  id: number;
  zone_name: string;
  store_id: number;
}

function canWriteCampaigns(role?: string) {
  return role === "Admin" || role === "Marketing Manager";
}

function describeError(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { detail?: string } } };
  const status = e?.response?.status;
  const detail = e?.response?.data?.detail;
  if (status === 401) return "Session expired - please log in again.";
  if (detail) return `${detail}${status ? ` (HTTP ${status})` : ""}`;
  if (status) return `${fallback} (HTTP ${status})`;
  return `${fallback} - check your network connection.`;
}

function statusBadge(status: string) {
  switch (status) {
    case "Active":
      return "bg-emerald-500/15 text-emerald-300";
    case "Paused":
      return "bg-amber-500/15 text-amber-300";
    case "Completed":
      return "bg-blue-500/15 text-blue-300";
    case "Cancelled":
      return "bg-rose-500/15 text-rose-300";
    default:
      return "bg-slate-500/15 text-slate-300";
  }
}

const emptyForm: CampaignPayload = {
  name: "",
  campaign_type: CAMPAIGN_TYPES[0],
  status: "Draft",
  start_date: "",
  end_date: "",
  budget: 0,
  store_id: null,
  zone_id: null,
  description: "",
};

export default function Campaigns() {
  const { user } = useAuth();
  const writable = canWriteCampaigns(user?.role);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<(CampaignPayload & { id?: number }) | null>(null);
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");
  const [performanceFor, setPerformanceFor] = useState<Campaign | null>(null);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list().then((r) => r.data),
  });
  const storesQuery = useQuery({
    queryKey: ["stores", "picker"],
    queryFn: () => storesApi.list().then((r) => r.data as StoreOption[]),
  });
  const zonesQuery = useQuery({
    queryKey: ["zones", "picker"],
    queryFn: () => zonesApi.list().then((r) => r.data as ZoneOption[]),
  });
  const performanceQuery = useQuery({
    queryKey: ["campaigns", "performance", performanceFor?.id],
    queryFn: () => campaignsApi.performance(performanceFor!.id).then((r) => r.data as CampaignPerformance),
    enabled: performanceFor != null,
  });

  const storeNames = useMemo(
    () => Object.fromEntries((storesQuery.data ?? []).map((s) => [s.id, s.store_name])),
    [storesQuery.data],
  );

  const campaigns = campaignsQuery.data ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return campaigns;
    const q = search.toLowerCase();
    return campaigns.filter(
      (c) => c.name.toLowerCase().includes(q) || c.campaign_type.toLowerCase().includes(q) || c.status.toLowerCase().includes(q),
    );
  }, [campaigns, search]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["campaigns"] });

  const createMutation = useMutation({
    mutationFn: (payload: CampaignPayload) => campaignsApi.create(payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to create campaign")),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CampaignPayload> }) => campaignsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to update campaign")),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.remove(id),
    onSuccess: () => {
      setListError("");
      invalidate();
    },
    onError: (err) => setListError(describeError(err, "Failed to delete campaign")),
  });
  const activateMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.activate(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to activate campaign")),
  });
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.deactivate(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to deactivate campaign")),
  });
  const duplicateMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.duplicate(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to duplicate campaign")),
  });

  const openCreate = () => {
    setFormError("");
    setListError("");
    setEditing({ ...emptyForm });
  };
  const openEdit = (c: Campaign) => {
    setFormError("");
    setListError("");
    setEditing({
      id: c.id,
      name: c.name,
      campaign_type: c.campaign_type,
      status: c.status,
      start_date: c.start_date,
      end_date: c.end_date,
      budget: Number(c.budget),
      store_id: c.store_id,
      zone_id: c.zone_id,
      description: c.description ?? "",
    });
  };
  const closeForm = () => {
    setEditing(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...rest } = editing;
    const payload: CampaignPayload = {
      ...rest,
      budget: Number(rest.budget),
      store_id: rest.store_id ? Number(rest.store_id) : null,
      zone_id: rest.zone_id ? Number(rest.zone_id) : null,
      description: rest.description || null,
    };
    if (id) {
      updateMutation.mutate({ id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (c: Campaign) => {
    if (window.confirm(`Delete campaign "${c.name}"? This can't be undone.`)) {
      deleteMutation.mutate(c.id);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const zonesForSelectedStore = (zonesQuery.data ?? []).filter(
    (z) => !editing?.store_id || z.store_id === Number(editing.store_id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-sm text-slate-400">Plan, launch, and manage marketing campaigns</p>
        </div>
        {writable && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus size={16} /> Create Campaign
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="rounded-lg border border-white/10 bg-panel py-1.5 pl-8 pr-3 text-sm text-white focus-ring"
            />
          </div>
        </CardHeader>

        {listError && <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{listError}</p>}

        {campaignsQuery.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner label="Loading campaigns" />
          </div>
        ) : campaignsQuery.isError ? (
          <p className="text-sm text-rose-400">{describeError(campaignsQuery.error, "Couldn't load campaigns")}</p>
        ) : !filtered.length ? (
          <p className="text-sm text-slate-500">
            {campaigns.length ? "No results match your search." : "No campaigns yet - create one to get started."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Schedule</th>
                  <th className="px-3 py-2 text-right font-medium">Budget</th>
                  <th className="px-3 py-2 font-medium">Store</th>
                  {writable && <th className="px-3 py-2 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 text-slate-300 hover:bg-white/5">
                    <td className="px-3 py-2 font-medium text-white">{c.name}</td>
                    <td className="px-3 py-2">{c.campaign_type}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {c.start_date} &rarr; {c.end_date}
                    </td>
                    <td className="px-3 py-2 text-right">₹{Number(c.budget).toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {c.store_id ? storeNames[c.store_id] ?? `Store ${c.store_id}` : "All Stores"}
                    </td>
                    {writable && (
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setPerformanceFor(c)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="View performance"
                          >
                            <BarChart2 size={14} />
                          </button>
                          {c.status === "Active" ? (
                            <button
                              onClick={() => deactivateMutation.mutate(c.id)}
                              className="rounded p-1.5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400"
                              title="Deactivate"
                            >
                              <Pause size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => activateMutation.mutate(c.id)}
                              className="rounded p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                              title="Activate"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => duplicateMutation.mutate(c.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closeForm}>
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editing.id ? "Edit Campaign" : "Create Campaign"}</h2>
              <button onClick={closeForm} className="rounded p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Campaign Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Type</label>
                  <select
                    value={editing.campaign_type}
                    onChange={(e) => setEditing({ ...editing, campaign_type: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    {CAMPAIGN_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Start Date</label>
                  <input
                    type="date"
                    value={editing.start_date}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                    required
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">End Date</label>
                  <input
                    type="date"
                    value={editing.end_date}
                    onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                    required
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Budget (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editing.budget}
                  onChange={(e) => setEditing({ ...editing, budget: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Store (optional)</label>
                  <select
                    value={editing.store_id ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, store_id: e.target.value ? Number(e.target.value) : null, zone_id: null })
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    <option value="">All Stores</option>
                    {(storesQuery.data ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.store_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Zone (optional)</label>
                  <select
                    value={editing.zone_id ?? ""}
                    onChange={(e) => setEditing({ ...editing, zone_id: e.target.value ? Number(e.target.value) : null })}
                    disabled={!editing.store_id}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring disabled:opacity-50"
                  >
                    <option value="">No zone</option>
                    {zonesForSelectedStore.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zone_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Description (optional)</label>
                <textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>

              {formError && <p className="text-sm text-rose-400">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing.id ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {performanceFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setPerformanceFor(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Performance - {performanceFor.name}</h2>
              <button onClick={() => setPerformanceFor(null)} className="rounded p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            {performanceQuery.isLoading ? (
              <div className="grid h-24 place-items-center">
                <Spinner label="Loading performance" />
              </div>
            ) : !performanceQuery.data?.data_available ? (
              <p className="text-sm text-slate-500">{performanceQuery.data?.note ?? "No performance data available."}</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-black/30 p-3">
                    <p className="text-xs text-slate-500">Reach</p>
                    <p className="text-xl font-bold text-white">{performanceQuery.data.reach}</p>
                  </div>
                  <div className="rounded-lg bg-black/30 p-3">
                    <p className="text-xs text-slate-500">Avg Engagement</p>
                    <p className="text-xl font-bold text-white">
                      {((performanceQuery.data.avg_engagement_seconds ?? 0) / 60).toFixed(1)} min
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-black/30 p-3">
                  <p className="text-xs text-slate-500">Campaign ROI / Revenue Generated</p>
                  <p className="text-sm text-slate-400">Not available - no sales/POS data exists in this schema.</p>
                </div>
                <p className="text-xs text-slate-600">{performanceQuery.data.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
