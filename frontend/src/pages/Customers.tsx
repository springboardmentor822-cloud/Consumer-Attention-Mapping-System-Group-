import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, ShieldQuestion, ShoppingBag, Timer, Users, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import {
  type CustomerListItem,
  type VisitDetail,
  customerAnalyticsApi,
  customersApi,
} from "../api/customers";

// Deliberately unhurried: this data only changes when a video is processed,
// so a slow poll keeps the page fresh without adding request churn.
const POLL_INTERVAL = 30000;

function describeError(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { detail?: string } } };
  const status = e?.response?.status;
  const detail = e?.response?.data?.detail;
  if (status === 401) return "Session expired - please log in again.";
  if (detail) return `${detail}${status ? ` (HTTP ${status})` : ""}`;
  if (status) return `${fallback} (HTTP ${status})`;
  return `${fallback} - check your network connection.`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

/** Detail panel for one row. An identified customer loads their full record;
 * an anonymous row shows only what the video genuinely produced. */
function CustomerDetailModal({ row, onClose }: { row: CustomerListItem; onClose: () => void }) {
  const { user } = useAuth();
  const storeId = user?.store_id ?? undefined;

  const detail = useQuery({
    queryKey: ["customer-detail", row.customer_id],
    queryFn: () => customersApi.detail(row.customer_id as number).then((r) => r.data),
    enabled: row.customer_id != null,
  });

  const visits = useQuery({
    queryKey: ["customer-visits-anon", row.tracking_id, storeId ?? null],
    queryFn: () => customersApi.visits(storeId, row.tracking_id as string).then((r) => r.data),
    enabled: row.customer_id == null && !!row.tracking_id,
  });

  const firstVisitId = row.customer_id != null ? detail.data?.recent_visits[0]?.id : visits.data?.[0]?.id;
  const journey = useQuery({
    queryKey: ["customer-journey", firstVisitId],
    queryFn: () => customersApi.visitDetail(firstVisitId as number).then((r) => r.data),
    enabled: !!firstVisitId,
  });

  const recentVisits = row.customer_id != null ? detail.data?.recent_visits ?? [] : visits.data ?? [];
  const loading = detail.isLoading || visits.isLoading;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Customer Details</h2>
            <p className="text-xs text-slate-400">
              {row.is_identified ? "Mapped to a registered customer record" : "Anonymous visitor - video tracking only"}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-slate-500">Name</p>
            <p className="text-sm font-medium text-white">{row.display_name}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-slate-500">Phone</p>
            <p className="text-sm font-medium text-white">{row.phone}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-slate-500">Customer ID</p>
            <p className="text-sm font-medium text-white">
              {row.is_identified ? detail.data?.customer.customer_code ?? "-" : row.tracking_id}
            </p>
          </div>
        </div>

        {!row.is_identified && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <ShieldQuestion size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              No name or phone is available for this visitor. Cameras produce an anonymous tracking ID only -
              identity is never derived from video. Link this visit to a registered customer to see their details.
            </span>
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-slate-500">Visits</p>
            <p className="text-lg font-semibold text-white">{row.total_visits}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-slate-500">Total Dwell</p>
            <p className="text-lg font-semibold text-white">{formatDuration(row.total_dwell_seconds)}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-slate-500">Last Visit</p>
            <p className="text-sm font-semibold text-white">{formatDateTime(row.last_visit)}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-slate-500">Total Spend</p>
            <p className="text-lg font-semibold text-white">
              {row.is_identified ? `₹${row.total_spend}` : "-"}
            </p>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-white">Customer Journey</h3>
        {journey.isLoading ? (
          <div className="mt-2 h-8 animate-pulse rounded-lg bg-white/5" />
        ) : journey.data && journey.data.journey.length ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {journey.data.journey.map((zone, i) => (
              <span key={`${zone}-${i}`} className="flex items-center gap-1.5">
                <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-300">
                  {zone}
                </span>
                {i < (journey.data as VisitDetail).journey.length - 1 && (
                  <ArrowRight size={12} className="text-slate-600" />
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            No multi-zone path recorded for the most recent visit.
          </p>
        )}

        <h3 className="mt-6 text-sm font-semibold text-white">Recent Visits</h3>
        {loading ? (
          <div className="mt-2 h-16 animate-pulse rounded-lg bg-white/5" />
        ) : !recentVisits.length ? (
          <p className="mt-2 text-xs text-slate-500">No visits recorded.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-1.5 font-medium">Entry</th>
                  <th className="px-2 py-1.5 font-medium">Exit</th>
                  <th className="px-2 py-1.5 font-medium">Duration</th>
                  <th className="px-2 py-1.5 font-medium">Zones</th>
                  <th className="px-2 py-1.5 font-medium">Camera</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.slice(0, 10).map((v) => (
                  <tr key={v.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-2 py-1.5">{formatDateTime(v.entry_time)}</td>
                    <td className="px-2 py-1.5">{formatDateTime(v.exit_time)}</td>
                    <td className="px-2 py-1.5">{formatDuration(v.total_dwell_seconds)}</td>
                    <td className="px-2 py-1.5">{v.total_zones_visited}</td>
                    <td className="px-2 py-1.5">{v.camera_name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 className="mt-6 text-sm font-semibold text-white">Purchase History</h3>
        {!row.is_identified ? (
          <p className="mt-2 text-xs text-slate-500">
            Purchases can only be shown for a registered customer - a camera cannot observe a payment.
          </p>
        ) : !detail.data?.purchases.length ? (
          <p className="mt-2 text-xs text-slate-500">No purchases recorded for this customer.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-1.5 font-medium">Product</th>
                  <th className="px-2 py-1.5 font-medium">Qty</th>
                  <th className="px-2 py-1.5 font-medium">Price</th>
                  <th className="px-2 py-1.5 font-medium">Date</th>
                  <th className="px-2 py-1.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {detail.data.purchases.flatMap((p) =>
                  p.items.map((item, idx) => (
                    <tr key={`${p.id}-${idx}`} className="border-b border-white/5 text-slate-300">
                      <td className="px-2 py-1.5">{item.product_name ?? "-"}</td>
                      <td className="px-2 py-1.5">{item.quantity}</td>
                      <td className="px-2 py-1.5">₹{item.unit_price}</td>
                      <td className="px-2 py-1.5">{formatDateTime(p.purchase_time)}</td>
                      <td className="px-2 py-1.5">₹{item.total_price}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? undefined;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerListItem | null>(null);

  const overview = useQuery({
    queryKey: ["customers", "overview", storeId ?? null, search],
    queryFn: () => customersApi.overview({ storeId, search: search || undefined }).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });

  const analytics = useQuery({
    queryKey: ["customer-analytics", "summary", storeId ?? null],
    queryFn: () => customerAnalyticsApi.summary(storeId).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });

  const rows = overview.data?.items ?? [];
  const a = analytics.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-sm text-slate-400">
          Visitor sessions from camera tracking, plus registered customer records and purchases
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Visits" value={a?.total_visits ?? 0} icon={Users} accent="blue" loading={analytics.isLoading} />
        <KpiCard
          label="Avg Visit Duration"
          value={a ? formatDuration(a.average_visit_seconds) : "-"}
          icon={Timer}
          accent="violet"
          loading={analytics.isLoading}
        />
        <KpiCard
          label="Registered Customers"
          value={a?.registered_customers ?? 0}
          hint="From CRM/POS records"
          icon={Users}
          accent="emerald"
          loading={analytics.isLoading}
        />
        <KpiCard
          label="Total Revenue"
          value={a ? `₹${a.total_revenue}` : "-"}
          hint="Real transactions only"
          icon={ShoppingBag}
          accent="amber"
          loading={analytics.isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer / Visitor List</CardTitle>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, or ID"
              className="w-56 rounded-lg border border-white/10 bg-black/30 py-1.5 pl-8 pr-3 text-sm text-white focus-ring"
            />
          </div>
        </CardHeader>

        {overview.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner label="Loading customers" />
          </div>
        ) : overview.isError ? (
          <p className="text-sm text-rose-400">{describeError(overview.error, "Couldn't load customers")}</p>
        ) : !rows.length ? (
          <p className="text-sm text-slate-500">
            No visitor sessions yet - process a video to generate customer tracking data.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Last Visit</th>
                  <th className="px-3 py-2 font-medium">Visits</th>
                  <th className="px-3 py-2 font-medium">Dwell Time</th>
                  <th className="px-3 py-2 font-medium">Products</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.customer_id ? `c-${row.customer_id}` : `t-${row.tracking_id}`}
                    onClick={() => setSelected(row)}
                    className="cursor-pointer border-b border-white/5 text-slate-300 hover:bg-white/5"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">{row.display_name}</div>
                      <div className="text-xs text-slate-500">{row.tracking_id ?? "Registered customer"}</div>
                    </td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2 text-xs">{formatDateTime(row.last_visit)}</td>
                    <td className="px-3 py-2">{row.total_visits}</td>
                    <td className="px-3 py-2">{formatDuration(row.total_dwell_seconds)}</td>
                    <td className="px-3 py-2">{row.interaction_count}</td>
                    <td className="px-3 py-2">{row.is_identified ? `₹${row.total_spend}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && <CustomerDetailModal row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
