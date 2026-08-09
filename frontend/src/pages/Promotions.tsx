import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  Copy,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { productsApi } from "../api/resources";
import { campaignsApi, type Campaign } from "../api/campaigns";
import {
  PROMOTION_STATUSES,
  PROMOTION_TYPES,
  promotionsApi,
  type Promotion,
  type PromotionPayload,
  type PromotionPerformance,
} from "../api/promotions";

interface ProductOption {
  id: number;
  product_name: string;
  sku: string;
}

function canWritePromotions(role?: string) {
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
    case "Scheduled":
      return "bg-blue-500/15 text-blue-300";
    case "Expired":
      return "bg-slate-500/15 text-slate-400";
    case "Cancelled":
      return "bg-rose-500/15 text-rose-300";
    default:
      return "bg-slate-500/15 text-slate-300";
  }
}

const emptyForm: PromotionPayload = {
  name: "",
  promotion_type: PROMOTION_TYPES[0],
  status: "Scheduled",
  campaign_id: null,
  product_id: null,
  discount_percent: null,
  start_date: "",
  end_date: "",
};

export default function Promotions() {
  const { user } = useAuth();
  const writable = canWritePromotions(user?.role);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<(PromotionPayload & { id?: number }) | null>(null);
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");
  const [performanceFor, setPerformanceFor] = useState<Promotion | null>(null);

  const promotionsQuery = useQuery({
    queryKey: ["promotions"],
    queryFn: () => promotionsApi.list().then((r) => r.data),
  });
  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list().then((r) => r.data as Campaign[]),
  });
  const productsQuery = useQuery({
    queryKey: ["products", "picker"],
    queryFn: () => productsApi.list().then((r) => r.data as ProductOption[]),
  });
  const performanceQuery = useQuery({
    queryKey: ["promotions", "performance", performanceFor?.id],
    queryFn: () => promotionsApi.performance(performanceFor!.id).then((r) => r.data as PromotionPerformance),
    enabled: performanceFor != null,
  });

  const campaignNames = useMemo(
    () => Object.fromEntries((campaignsQuery.data ?? []).map((c) => [c.id, c.name])),
    [campaignsQuery.data],
  );
  const productNames = useMemo(
    () => Object.fromEntries((productsQuery.data ?? []).map((p) => [p.id, p.product_name])),
    [productsQuery.data],
  );

  const promotions = promotionsQuery.data ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return promotions;
    const q = search.toLowerCase();
    return promotions.filter(
      (p) => p.name.toLowerCase().includes(q) || p.promotion_type.toLowerCase().includes(q) || p.status.toLowerCase().includes(q),
    );
  }, [promotions, search]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["promotions"] });

  const createMutation = useMutation({
    mutationFn: (payload: PromotionPayload) => promotionsApi.create(payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to create promotion")),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PromotionPayload> }) => promotionsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to update promotion")),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => promotionsApi.remove(id),
    onSuccess: () => {
      setListError("");
      invalidate();
    },
    onError: (err) => setListError(describeError(err, "Failed to delete promotion")),
  });
  const activateMutation = useMutation({
    mutationFn: (id: number) => promotionsApi.activate(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to activate promotion")),
  });
  const expireMutation = useMutation({
    mutationFn: (id: number) => promotionsApi.expire(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to expire promotion")),
  });
  const duplicateMutation = useMutation({
    mutationFn: (id: number) => promotionsApi.duplicate(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to duplicate promotion")),
  });

  const openCreate = () => {
    setFormError("");
    setListError("");
    setEditing({ ...emptyForm });
  };
  const openEdit = (p: Promotion) => {
    setFormError("");
    setListError("");
    setEditing({
      id: p.id,
      name: p.name,
      promotion_type: p.promotion_type,
      status: p.status,
      campaign_id: p.campaign_id,
      product_id: p.product_id,
      discount_percent: p.discount_percent != null ? Number(p.discount_percent) : null,
      start_date: p.start_date,
      end_date: p.end_date,
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
    const payload: PromotionPayload = { ...rest };
    if (id) {
      updateMutation.mutate({ id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (p: Promotion) => {
    if (window.confirm(`Delete promotion "${p.name}"? This can't be undone.`)) {
      deleteMutation.mutate(p.id);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Promotions</h1>
          <p className="text-sm text-slate-400">Product promotions, bundle offers, festival/seasonal campaigns, flash sales, and discounts</p>
        </div>
        {writable && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus size={16} /> Create Promotion
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promotions..."
              className="rounded-lg border border-white/10 bg-panel py-1.5 pl-8 pr-3 text-sm text-white focus-ring"
            />
          </div>
        </CardHeader>

        {listError && <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{listError}</p>}

        {promotionsQuery.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner label="Loading promotions" />
          </div>
        ) : promotionsQuery.isError ? (
          <p className="text-sm text-rose-400">{describeError(promotionsQuery.error, "Couldn't load promotions")}</p>
        ) : !filtered.length ? (
          <p className="text-sm text-slate-500">
            {promotions.length ? "No results match your search." : "No promotions yet - create one to get started."}
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
                  <th className="px-3 py-2 text-right font-medium">Discount</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Campaign</th>
                  {writable && <th className="px-3 py-2 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 text-slate-300 hover:bg-white/5">
                    <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                    <td className="px-3 py-2">{p.promotion_type}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {p.start_date} &rarr; {p.end_date}
                    </td>
                    <td className="px-3 py-2 text-right">{p.discount_percent != null ? `${p.discount_percent}%` : "-"}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {p.product_id ? productNames[p.product_id] ?? `Product ${p.product_id}` : "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {p.campaign_id ? campaignNames[p.campaign_id] ?? `Campaign ${p.campaign_id}` : "-"}
                    </td>
                    {writable && (
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setPerformanceFor(p)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="View performance"
                          >
                            <BarChart2 size={14} />
                          </button>
                          {p.status !== "Active" && (
                            <button
                              onClick={() => activateMutation.mutate(p.id)}
                              className="rounded p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                              title="Activate"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          {p.status !== "Expired" && (
                            <button
                              onClick={() => expireMutation.mutate(p.id)}
                              className="rounded p-1.5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400"
                              title="Mark expired"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => duplicateMutation.mutate(p.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
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
              <h2 className="text-lg font-semibold text-white">{editing.id ? "Edit Promotion" : "Create Promotion"}</h2>
              <button onClick={closeForm} className="rounded p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Promotion Name</label>
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
                    value={editing.promotion_type}
                    onChange={(e) => setEditing({ ...editing, promotion_type: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    {PROMOTION_TYPES.map((t) => (
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
                    {PROMOTION_STATUSES.map((s) => (
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
                <label className="mb-1 block text-xs font-medium text-slate-400">Discount % (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editing.discount_percent ?? ""}
                  onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Product (optional)</label>
                  <select
                    value={editing.product_id ?? ""}
                    onChange={(e) => setEditing({ ...editing, product_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    <option value="">No product</option>
                    {(productsQuery.data ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Campaign (optional)</label>
                  <select
                    value={editing.campaign_id ?? ""}
                    onChange={(e) => setEditing({ ...editing, campaign_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    <option value="">No campaign</option>
                    {(campaignsQuery.data ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <p className="text-xs text-slate-500">Redemptions / Revenue Lift</p>
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
