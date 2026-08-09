import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Clock, Megaphone, Sparkles, Tag, Target, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import KpiCard from "../../components/ui/KpiCard";
import RecommendationFeed from "../../components/RecommendationFeed";
import { storesApi } from "../../api/resources";
import { campaignsApi } from "../../api/campaigns";
import { useAttractiveness, useConversionFunnel } from "../../hooks/useAnalyticsDashboard";

const CHART_TOOLTIP_STYLE = {
  background: "#111827",
  border: "1px solid #263244",
  borderRadius: 12,
  color: "#e5e7eb",
  fontSize: 12,
};

interface StoreOption {
  id: number;
  store_name: string;
}

export default function MarketingDashboardPage() {
  const storesQuery = useQuery({
    queryKey: ["stores", "picker"],
    queryFn: () => storesApi.list().then((r) => r.data as StoreOption[]),
  });
  const [storeId, setStoreId] = useState<number | undefined>(undefined);

  const attractiveness = useAttractiveness(storeId);
  const funnel = useConversionFunnel(storeId);
  const summary = useQuery({
    queryKey: ["marketing", "campaign-summary"],
    queryFn: () => campaignsApi.summary().then((r) => r.data),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing Dashboard</h1>
          <p className="text-sm text-slate-400">Campaign performance and product visibility</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Store:</label>
          <select
            value={storeId ?? ""}
            onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-white focus-ring"
          >
            <option value="">All Stores</option>
            {storesQuery.data?.map((store) => (
              <option key={store.id} value={store.id}>
                {store.store_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Campaigns"
          value={summary.data?.total_campaigns ?? 0}
          icon={Megaphone}
          accent="blue"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Active Campaigns"
          value={summary.data?.active_campaigns ?? 0}
          icon={TrendingUp}
          accent="emerald"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Active Promotions"
          value={summary.data?.active_promotions ?? 0}
          hint={summary.data ? `${summary.data.total_promotions} total` : undefined}
          icon={Tag}
          accent="violet"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Total Campaign Budget"
          value={summary.data ? `₹${summary.data.total_budget.toLocaleString()}` : "₹0"}
          hint="Sum of entered budgets - not actual spend"
          icon={Wallet}
          accent="amber"
          loading={summary.isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock size={14} className="text-blue-400" />
          Avg attention time across all stores: {summary.data ? (summary.data.avg_attention_seconds / 60).toFixed(1) : "0"} min
        </div>
        <div className="flex gap-2">
          <Link to="/marketing/campaigns" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
            Manage Campaigns
          </Link>
          <Link to="/marketing/promotions" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20">
            Manage Promotions
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Attractiveness</CardTitle>
            <span className="text-xs text-slate-500">Traffic + dwell + interaction, minus stockouts</span>
          </CardHeader>
          {attractiveness.isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
          ) : !attractiveness.data?.shelves.length ? (
            <p className="text-sm text-slate-500">No shelves with an assigned camera yet.</p>
          ) : (
            <div className="space-y-3">
              {attractiveness.data.shelves.slice(0, 8).map((shelf) => (
                <div key={shelf.shelf_id}>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-600">#{shelf.rank}</span> {shelf.shelf_name}{" "}
                      <span className="text-slate-600">({shelf.store_name})</span>
                    </span>
                    <span>{shelf.has_behavior_data ? shelf.score.toFixed(1) : "—"}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                      style={{ width: `${shelf.has_behavior_data ? shelf.score : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Lift & Funnel</CardTitle>
            <span className="text-xs text-slate-500">Checkout-zone proximity proxy</span>
          </CardHeader>
          {funnel.isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-white/5" />
          ) : !funnel.data?.stages.some((s) => s.count > 0) ? (
            <p className="text-sm text-slate-500">No visitor data yet.</p>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel.data.stages} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263244" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="stage" stroke="#64748b" fontSize={11} width={130} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <KpiCard
                label="Conversion Rate"
                value={funnel.data.conversion_rate != null ? `${(funnel.data.conversion_rate * 100).toFixed(1)}%` : "N/A"}
                hint={funnel.data.conversion_rate == null ? "No checkout zone configured" : "Zone-proximity proxy, not literal sales"}
                icon={Target}
                accent="amber"
              />
            </>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" /> Optimization Recommendations
            </CardTitle>
            <span className="text-xs text-slate-500">Rule-based, from real traffic/dwell/stock signals</span>
          </CardHeader>
          <RecommendationFeed storeId={storeId} />
        </Card>
      </div>
    </div>
  );
}
