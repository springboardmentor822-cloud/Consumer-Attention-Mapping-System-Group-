import { Building2, Clock, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { useStoreComparison } from "../../hooks/useAnalyticsDashboard";

const CHART_TOOLTIP_STYLE = {
  background: "#111827",
  border: "1px solid #263244",
  borderRadius: 12,
  color: "#e5e7eb",
  fontSize: 12,
};

export default function StoreReportsPage() {
  const storeComparison = useStoreComparison();
  const stores = storeComparison.data?.stores ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Store Reports</h1>
        <p className="text-sm text-slate-400">Cross-store traffic comparison, from real camera tracking data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitors by Store</CardTitle>
          <Users size={16} className="text-blue-400" />
        </CardHeader>
        {storeComparison.isLoading ? (
          <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        ) : !stores.length ? (
          <p className="text-sm text-slate-500">No stores to compare yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stores} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263244" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="store_name" stroke="#64748b" fontSize={12} width={110} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="visitors" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store Detail</CardTitle>
          <Building2 size={16} className="text-violet-400" />
        </CardHeader>
        {storeComparison.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : !stores.length ? (
          <p className="text-sm text-slate-500">No stores to compare yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <div key={s.store_id} className="rounded-xl bg-black/30 p-4">
                <p className="text-base font-semibold text-white">{s.store_name}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} /> Visitors
                    </span>
                    <span className="font-medium text-slate-200">{s.visitors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> Avg Dwell
                    </span>
                    <span className="font-medium text-slate-200">{(s.avg_dwell_seconds / 60).toFixed(1)} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp size={13} /> Peak Hour
                    </span>
                    <span className="font-medium text-slate-200">{s.peak_hour != null ? `${s.peak_hour}:00` : "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-600">
        Sales, revenue, and conversion figures aren't shown here - no POS/transaction data exists in this schema, only
        camera-derived traffic and dwell metrics.
      </p>
    </div>
  );
}
