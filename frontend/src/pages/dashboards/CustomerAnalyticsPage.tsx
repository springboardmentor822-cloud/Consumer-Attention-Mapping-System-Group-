import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Package, ShoppingBag, Timer, Users } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import KpiCard from "../../components/ui/KpiCard";
import { useAuth } from "../../context/AuthContext";
import { customerAnalyticsApi } from "../../api/customers";

const CHART_TOOLTIP_STYLE = {
  background: "#111827",
  border: "1px solid #263244",
  borderRadius: 12,
  color: "#e5e7eb",
  fontSize: 12,
};

// Customer analytics only change when a video is processed or a transaction
// is imported, so a slow poll is plenty - no need to add request churn.
const POLL_INTERVAL = 30000;

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export default function CustomerAnalyticsPage() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? undefined;

  const summary = useQuery({
    queryKey: ["customer-analytics", "summary", storeId ?? null],
    queryFn: () => customerAnalyticsApi.summary(storeId).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });
  const zones = useQuery({
    queryKey: ["customer-analytics", "zones", storeId ?? null],
    queryFn: () => customerAnalyticsApi.zones(storeId).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });
  const overTime = useQuery({
    queryKey: ["customer-analytics", "visits", storeId ?? null],
    queryFn: () => customerAnalyticsApi.visitsOverTime(storeId).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });
  const products = useQuery({
    queryKey: ["customer-analytics", "products", storeId ?? null],
    queryFn: () => customerAnalyticsApi.products(storeId).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });
  const purchases = useQuery({
    queryKey: ["customer-analytics", "purchases", storeId ?? null],
    queryFn: () => customerAnalyticsApi.purchases(storeId).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });

  const s = summary.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Analytics</h1>
        <p className="text-sm text-slate-400">
          Visit behaviour derived from camera tracking, with purchase data from real transactions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Visits" value={s?.total_visits ?? 0} icon={Users} accent="blue" loading={summary.isLoading} />
        <KpiCard
          label="Avg Visit Duration"
          value={s ? formatDuration(s.average_visit_seconds) : "-"}
          icon={Timer}
          accent="violet"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Identified Visits"
          value={s?.identified_visits ?? 0}
          hint={`${s?.anonymous_visits ?? 0} anonymous`}
          icon={Users}
          accent="emerald"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Total Revenue"
          value={s ? `₹${s.total_revenue}` : "-"}
          hint={s?.purchase_count ? `${s.purchase_count} purchases` : "No transactions yet"}
          icon={ShoppingBag}
          accent="amber"
          loading={summary.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Returning Customers"
          value={s?.returning_customers ?? 0}
          hint="Identified customers only"
          icon={Users}
          accent="blue"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Registered Customers"
          value={s?.registered_customers ?? 0}
          icon={Users}
          accent="emerald"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Most Visited Zone"
          value={s?.most_visited_zone ?? "-"}
          icon={Package}
          accent="violet"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Most Interacted Product"
          value={s?.most_interacted_product ?? "-"}
          hint="Proximity proxy"
          icon={Package}
          accent="amber"
          loading={summary.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Visits Over Time</CardTitle>
          </CardHeader>
          <div className="h-64">
            {overTime.isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-white/5" />
            ) : !overTime.data?.length ? (
              <p className="grid h-full place-items-center text-sm text-slate-500">No visits recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overTime.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="visits" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customers by Zone</CardTitle>
          </CardHeader>
          <div className="h-64">
            {zones.isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-white/5" />
            ) : !zones.data?.length ? (
              <p className="grid h-full place-items-center text-sm text-slate-500">No zone data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zones.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                  <XAxis dataKey="zone_name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="visits" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Dwell Time by Zone</CardTitle>
            <span className="text-xs text-slate-500">Seconds</span>
          </CardHeader>
          <div className="h-64">
            {zones.isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-white/5" />
            ) : !zones.data?.length ? (
              <p className="grid h-full place-items-center text-sm text-slate-500">No zone data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zones.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                  <XAxis dataKey="zone_name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="average_dwell_seconds" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Interacted Products</CardTitle>
            <span className="text-xs text-slate-500">Zone-proximity proxy</span>
          </CardHeader>
          <div className="h-64">
            {products.isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-white/5" />
            ) : !products.data?.length ? (
              <p className="grid h-full place-items-center text-sm text-slate-500">No interaction data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products.data} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263244" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="product_name" stroke="#64748b" fontSize={10} width={130} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="interactions" fill="#eab308" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Purchased Products</CardTitle>
          <span className="text-xs text-slate-500">From real transactions</span>
        </CardHeader>
        {purchases.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        ) : !purchases.data?.length ? (
          <p className="text-sm text-slate-500">
            No purchase data yet - transactions come from POS/CRM records, not from video.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Quantity</th>
                  <th className="px-3 py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {purchases.data.map((p) => (
                  <tr key={p.product_id ?? p.product_name} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-medium text-white">{p.product_name}</td>
                    <td className="px-3 py-2">{p.quantity}</td>
                    <td className="px-3 py-2">₹{p.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
