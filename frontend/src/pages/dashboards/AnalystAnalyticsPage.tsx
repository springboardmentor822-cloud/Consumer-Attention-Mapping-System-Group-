import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Brain, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import HeatmapGrid from "../../components/charts/HeatmapGrid";
import { storesApi } from "../../api/resources";
import {
  useAnalystInsights,
  useJourneyFlow,
  useSegmentation,
  useStoreComparison,
} from "../../hooks/useAnalyticsDashboard";
import { useZoneHeatmaps } from "../../hooks/useStoreManagerDashboard";

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

export default function AnalystAnalyticsPage() {
  const storesQuery = useQuery({
    queryKey: ["stores", "picker"],
    queryFn: () => storesApi.list().then((r) => r.data as StoreOption[]),
  });
  const [storeId, setStoreId] = useState<number | undefined>(undefined);

  const journey = useJourneyFlow(storeId);
  const segmentation = useSegmentation(storeId);
  const storeComparison = useStoreComparison();
  const insights = useAnalystInsights(storeId);
  const zoneHeatmaps = useZoneHeatmaps(storeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400">Consumer journey and behavior insights, across all stores by default</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Flow</CardTitle>
          <span className="text-xs text-slate-500">Most common zone-to-zone movements</span>
        </CardHeader>
        {journey.isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
        ) : !journey.data?.transitions.length ? (
          <p className="text-sm text-slate-500">Not enough multi-zone tracking data yet to chart movement.</p>
        ) : (
          <div className="space-y-2">
            {journey.data.transitions.map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-medium text-white">{t.from_zone_name}</span>
                  <ArrowRight size={14} className="text-slate-500" />
                  <span className="font-medium text-white">{t.to_zone_name}</span>
                </div>
                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attention Analytics & Segmentation</CardTitle>
            <span className="text-xs text-slate-500">
              {segmentation.data ? `${segmentation.data.total_customers} customers` : ""}
            </span>
          </CardHeader>
          {segmentation.isLoading ? (
            <div className="h-56 animate-pulse rounded-xl bg-white/5" />
          ) : !segmentation.data?.total_customers ? (
            <p className="text-sm text-slate-500">No customer tracking data yet.</p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentation.data.segments} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263244" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="segment" stroke="#64748b" fontSize={11} width={140} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {segmentation.data.multi_zone_visitor_pct}% of customers visited more than one zone.
              </p>
            </>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zone / Shelf / Traffic Heatmap</CardTitle>
          </CardHeader>
          {zoneHeatmaps.isLoading ? (
            <div className="aspect-video animate-pulse rounded-xl bg-white/5" />
          ) : (
            <HeatmapGrid zones={zoneHeatmaps.data?.zones ?? []} transitions={zoneHeatmaps.data?.transitions ?? []} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dwell Time & Traffic Analysis</CardTitle>
            <span className="text-xs text-slate-500">Cross-store comparison</span>
          </CardHeader>
          {storeComparison.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-white/5" />)}</div>
          ) : !storeComparison.data?.stores.length ? (
            <p className="text-sm text-slate-500">No stores to compare yet.</p>
          ) : (
            <div className="space-y-3">
              {storeComparison.data.stores.map((s) => (
                <div key={s.store_id} className="rounded-lg bg-black/30 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{s.store_name}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users size={12} /> {s.visitors}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Avg dwell: {(s.avg_dwell_seconds / 60).toFixed(1)} min</span>
                    <span>{s.peak_hour != null ? `Peak: ${s.peak_hour}:00` : "No peak yet"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <span className="text-xs text-slate-500">Rule-based, from real tracking data</span>
          </CardHeader>
          {insights.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
          ) : (
            <div className="space-y-3">
              {insights.data?.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Brain
                    size={14}
                    className={insight.severity === "notable" ? "mt-0.5 flex-shrink-0 text-amber-400" : "mt-0.5 flex-shrink-0 text-blue-400"}
                  />
                  <p className="text-sm text-slate-300">{insight.message}</p>
                </div>
              ))}
              <p className="pt-2 text-xs text-slate-600">
                Report export (PDF/Excel/CSV) and ML-driven recommendations aren't built yet - these are
                straightforward rule-based observations from real data, not a recommendation engine.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
