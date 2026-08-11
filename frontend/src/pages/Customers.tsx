import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, ShieldQuestion, ShoppingBag, Timer, Users, Video, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { type CustomerListItem, customersApi } from "../api/customers";
import { zonesApi } from "../api/resources";

// Deliberately unhurried: this data only changes when a video is processed or
// a transaction is imported, so a slow poll keeps it fresh without churn.
const POLL_INTERVAL = 30000;
// How many product lines a table cell shows before collapsing to "+N more".
const MAX_PRODUCTS_IN_CELL = 2;

interface ZoneOption {
  id: number;
  zone_name: string;
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

function CustomerDetailModal({ row, onClose }: { row: CustomerListItem; onClose: () => void }) {
  const profile = useQuery({
    queryKey: ["customer-profile", row.customer_id, row.tracking_id],
    queryFn: () => customersApi.profile(row.customer_id, row.tracking_id).then((r) => r.data),
  });

  const p = profile.data;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Customer Details</h2>
            <p className="text-xs text-slate-400">
              {row.is_identified ? "Registered customer record" : "Anonymous visitor - video tracking only"}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {profile.isLoading ? (
          <div className="grid h-40 place-items-center">
            <Spinner label="Loading customer profile" />
          </div>
        ) : profile.isError || !p ? (
          <p className="text-sm text-rose-400">{describeError(profile.error, "Couldn't load customer profile")}</p>
        ) : (
          <>
            {/* ---------------- profile ---------------- */}
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer Profile</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-sm font-medium text-white">{p.display_name}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">{p.is_identified ? "Customer ID" : "Tracking ID"}</p>
                <p className="text-sm font-medium text-white">{p.customer_code ?? p.tracking_id ?? "-"}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm font-medium text-white">{p.phone}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-white">{p.email ?? "Not Available"}</p>
              </div>
            </div>

            {!p.is_identified && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <ShieldQuestion size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  Cameras produce an anonymous tracking ID only - a name or phone is never derived from video.
                  Link a visit to a registered customer to see their profile and purchases.
                </span>
              </p>
            )}

            {/* ---------------- visit summary ---------------- */}
            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Visit Summary</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Total Visits</p>
                <p className="text-lg font-semibold text-white">{p.total_visits}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Avg Visit Duration</p>
                <p className="text-lg font-semibold text-white">{formatDuration(p.average_visit_seconds)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">First Visit</p>
                <p className="text-xs font-semibold text-white">{formatDateTime(p.first_visit)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Last Visit</p>
                <p className="text-xs font-semibold text-white">{formatDateTime(p.last_visit)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Total Dwell</p>
                <p className="text-lg font-semibold text-white">{formatDuration(p.total_dwell_seconds)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Total Spending</p>
                <p className="text-lg font-semibold text-white">
                  {p.purchase_count ? `₹${p.total_spend}` : "No purchase recorded"}
                </p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Avg Purchase Value</p>
                <p className="text-lg font-semibold text-white">
                  {p.average_purchase_value ? `₹${p.average_purchase_value}` : "-"}
                </p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Purchases</p>
                <p className="text-lg font-semibold text-white">{p.purchase_count}</p>
              </div>
            </div>

            {/* ---------------- journey ---------------- */}
            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Customer Journey
            </h3>
            {!p.journey.length ? (
              <p className="text-xs text-slate-500">No zone path recorded for this visitor.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {p.journey.map((zone, i) => (
                    <span key={`${zone.zone_name}-${i}`} className="flex items-center gap-1.5">
                      <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-300">
                        {zone.zone_name}
                      </span>
                      {i < p.journey.length - 1 && <ArrowRight size={12} className="text-slate-600" />}
                    </span>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-1.5 font-medium">Zone</th>
                        <th className="px-2 py-1.5 font-medium">Time Spent</th>
                        <th className="px-2 py-1.5 font-medium">Visits</th>
                        <th className="px-2 py-1.5 font-medium">Interactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.journey.map((zone) => (
                        <tr key={zone.zone_id ?? zone.zone_name} className="border-b border-white/5 text-slate-300">
                          <td className="px-2 py-1.5 font-medium text-white">{zone.zone_name}</td>
                          <td className="px-2 py-1.5">{formatDuration(zone.seconds)}</td>
                          <td className="px-2 py-1.5">{zone.visits}</td>
                          <td className="px-2 py-1.5">{zone.interactions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ---------------- purchase history ---------------- */}
            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Purchase History
            </h3>
            {!p.purchases.length ? (
              <p className="text-xs text-slate-500">
                No purchase recorded.
                {!p.is_identified && " Purchases come from POS records, which need a registered customer."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-1.5 font-medium">Date</th>
                      <th className="px-2 py-1.5 font-medium">Product</th>
                      <th className="px-2 py-1.5 font-medium">Category</th>
                      <th className="px-2 py-1.5 font-medium">Qty</th>
                      <th className="px-2 py-1.5 font-medium">Unit Price</th>
                      <th className="px-2 py-1.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.purchases.flatMap((purchase) =>
                      purchase.items.map((item, idx) => (
                        <tr key={`${purchase.id}-${idx}`} className="border-b border-white/5 text-slate-300">
                          <td className="px-2 py-1.5">{formatDateTime(purchase.purchase_time)}</td>
                          <td className="px-2 py-1.5 font-medium text-white">{item.product_name}</td>
                          <td className="px-2 py-1.5">{item.category ?? "-"}</td>
                          <td className="px-2 py-1.5">{item.quantity}</td>
                          <td className="px-2 py-1.5">₹{item.unit_price}</td>
                          <td className="px-2 py-1.5">₹{item.total_price}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="text-slate-200">
                      <td colSpan={5} className="px-2 py-2 text-right font-medium">
                        Total Purchase
                      </td>
                      <td className="px-2 py-2 font-semibold text-white">₹{p.total_spend}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ---------------- product interactions ---------------- */}
            <h3 className="mb-2 mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product Interactions
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] normal-case tracking-normal text-slate-400">
                zone-proximity proxy, not observed handling
              </span>
            </h3>
            {!p.interactions.length ? (
              <p className="text-xs text-slate-500">No product interactions recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-1.5 font-medium">Product</th>
                      <th className="px-2 py-1.5 font-medium">Zone</th>
                      <th className="px-2 py-1.5 font-medium">Interactions</th>
                      <th className="px-2 py-1.5 font-medium">Dwell Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.interactions.slice(0, 15).map((item, idx) => (
                      <tr key={`${item.product_id}-${idx}`} className="border-b border-white/5 text-slate-300">
                        <td className="px-2 py-1.5 font-medium text-white">{item.product_name}</td>
                        <td className="px-2 py-1.5">{item.zone_name ?? "-"}</td>
                        <td className="px-2 py-1.5">{item.interaction_count}</td>
                        <td className="px-2 py-1.5">{formatDuration(item.total_seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---------------- video / tracking ---------------- */}
            <h3 className="mb-2 mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Video size={13} /> Video / Tracking Information
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Tracking ID</p>
                <p className="text-sm font-medium text-white">{p.tracking.tracking_ids.join(", ") || "-"}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Camera</p>
                <p className="text-sm font-medium text-white">{p.tracking.cameras.join(", ") || "-"}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Tracking Duration</p>
                <p className="text-sm font-medium text-white">
                  {formatDuration(p.tracking.total_tracking_seconds)}
                </p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">First Detected</p>
                <p className="text-xs font-medium text-white">{formatDateTime(p.tracking.first_detected)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Last Detected</p>
                <p className="text-xs font-medium text-white">{formatDateTime(p.tracking.last_detected)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <p className="text-xs text-slate-500">Zones Visited</p>
                <p className="text-xs font-medium text-white">{p.tracking.zones.join(", ") || "-"}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? undefined;
  const [search, setSearch] = useState("");
  const [zoneId, setZoneId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<CustomerListItem | null>(null);

  const zones = useQuery({
    queryKey: ["zones", "customer-filter"],
    queryFn: () => zonesApi.list().then((r) => r.data as ZoneOption[]),
  });

  const overview = useQuery({
    queryKey: ["customers", "overview", storeId ?? null, search, zoneId, dateFrom, dateTo],
    queryFn: () =>
      customersApi
        .overview({
          storeId,
          search: search || undefined,
          zoneId: zoneId ? Number(zoneId) : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        .then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });

  const summary = useQuery({
    queryKey: ["customers", "summary", storeId ?? null],
    queryFn: () => customersApi.summary(storeId).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });

  const rows = overview.data?.items ?? [];
  const s = summary.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-sm text-slate-400">
          Visitor sessions from camera tracking, plus registered customer records and purchases
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Today's Customers" value={s?.todays_customers ?? 0} icon={Users} accent="blue" loading={summary.isLoading} />
        <KpiCard
          label="Returning Customers"
          value={s?.returning_customers ?? 0}
          hint="Registered only"
          icon={Users}
          accent="emerald"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Avg Dwell Time"
          value={s ? formatDuration(s.average_dwell_seconds) : "-"}
          icon={Timer}
          accent="violet"
          loading={summary.isLoading}
        />
        <KpiCard label="Total Purchases" value={s?.total_purchases ?? 0} icon={ShoppingBag} accent="amber" loading={summary.isLoading} />
        <KpiCard
          label="Total Revenue"
          value={s ? `₹${s.total_revenue}` : "-"}
          icon={ShoppingBag}
          accent="emerald"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Avg Purchase Value"
          value={s?.average_purchase_value ? `₹${s.average_purchase_value}` : "-"}
          icon={ShoppingBag}
          accent="blue"
          loading={summary.isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer / Visitor List</CardTitle>
        </CardHeader>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, phone, ID, or product"
              className="w-60 rounded-lg border border-white/10 bg-black/30 py-1.5 pl-8 pr-3 text-sm text-white focus-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Zone</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white focus-ring"
            >
              <option value="">All zones</option>
              {zones.data?.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zone_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white focus-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white focus-ring"
            />
          </div>
          {(search || zoneId || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch("");
                setZoneId("");
                setDateFrom("");
                setDateTo("");
              }}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {overview.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner label="Loading customers" />
          </div>
        ) : overview.isError ? (
          <p className="text-sm text-rose-400">{describeError(overview.error, "Couldn't load customers")}</p>
        ) : !rows.length ? (
          <p className="text-sm text-slate-500">
            No visitor sessions match these filters - process a video to generate customer tracking data.
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
                  <th className="px-3 py-2 font-medium">Products Purchased</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.customer_id ? `c-${row.customer_id}` : `t-${row.tracking_id}`}
                    className="border-b border-white/5 text-slate-300 hover:bg-white/5"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">{row.display_name}</div>
                      <div className="text-xs text-slate-500">
                        {row.is_identified
                          ? `Customer ID: ${row.customer_code ?? "-"}`
                          : `Tracking ID: ${row.tracking_id}`}
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2 text-xs">{formatDateTime(row.last_visit)}</td>
                    <td className="px-3 py-2">{row.total_visits}</td>
                    <td className="px-3 py-2">{formatDuration(row.total_dwell_seconds)}</td>
                    <td className="px-3 py-2">
                      {!row.products.length ? (
                        <span className="text-xs text-slate-500">No purchase recorded</span>
                      ) : (
                        <div className="space-y-0.5">
                          {row.products.slice(0, MAX_PRODUCTS_IN_CELL).map((product) => (
                            <div key={product.product_id ?? product.name} className="text-xs">
                              {product.name} <span className="text-slate-500">× {product.quantity}</span>
                            </div>
                          ))}
                          {row.products.length > MAX_PRODUCTS_IN_CELL && (
                            <div className="text-xs text-blue-400">
                              +{row.products.length - MAX_PRODUCTS_IN_CELL} more
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.products.length ? `₹${row.total_spend}` : "₹0"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setSelected(row)}
                        className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                      >
                        View Details
                      </button>
                    </td>
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
