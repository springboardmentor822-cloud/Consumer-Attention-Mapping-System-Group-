import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Award, CheckCircle2, LayoutGrid, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import KpiCard from "../../components/ui/KpiCard";
import { storesApi } from "../../api/resources";
import { useAttractiveness, useShelfAnalysis } from "../../hooks/useAnalyticsDashboard";
import type { ShelfAnalysisItem } from "../../api/analyticsDashboard";

interface StoreOption {
  id: number;
  store_name: string;
}

function statusBadge(status: string) {
  if (status === "Empty") return "bg-rose-500/15 text-rose-300";
  if (status === "Full") return "bg-emerald-500/15 text-emerald-300";
  return "bg-blue-500/15 text-blue-300";
}

function ShelfCard({ item, accent }: { item: ShelfAnalysisItem | null; accent: string }) {
  if (!item) return <p className="text-sm text-slate-500">Not enough data yet.</p>;
  return (
    <div className="rounded-lg bg-black/30 p-4">
      <p className="text-base font-semibold text-white">{item.shelf_name}</p>
      <p className="text-xs text-slate-500">
        {item.store_name} - {item.zone}
      </p>
      <p className={`mt-2 text-sm font-medium ${accent}`}>{item.visit_count} visits</p>
    </div>
  );
}

export default function ShelfAnalysisPage() {
  const storesQuery = useQuery({
    queryKey: ["stores", "picker"],
    queryFn: () => storesApi.list().then((r) => r.data as StoreOption[]),
  });
  const [storeId, setStoreId] = useState<number | undefined>(undefined);
  const analysis = useShelfAnalysis(storeId);
  const attractiveness = useAttractiveness(storeId);
  const loading = analysis.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shelf Analysis</h1>
          <p className="text-sm text-slate-400">Occupancy from real product counts, visits from real camera tracking</p>
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
        <KpiCard label="Total Shelves" value={analysis.data?.shelves.length ?? 0} icon={LayoutGrid} accent="blue" loading={loading} />
        <KpiCard label="Empty Shelves" value={analysis.data?.empty_count ?? 0} icon={XCircle} accent="rose" loading={loading} />
        <KpiCard label="Full Shelves" value={analysis.data?.full_count ?? 0} icon={CheckCircle2} accent="emerald" loading={loading} />
        <KpiCard
          label="Needs Restocking"
          value={analysis.data?.shelves.filter((s) => s.restocking_needed).length ?? 0}
          hint="Camera sees far fewer products than the database expects"
          icon={AlertTriangle}
          accent="amber"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award size={15} className="text-amber-400" /> Attractiveness Ranking
          </CardTitle>
          <span className="text-xs text-slate-500">Traffic + dwell + interaction, minus stockouts - relative to this store's own shelves</span>
        </CardHeader>
        {attractiveness.isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
        ) : !attractiveness.data?.shelves.length ? (
          <p className="text-sm text-slate-500">No shelves with an assigned camera yet.</p>
        ) : (
          <div className="space-y-3">
            {attractiveness.data.shelves.map((shelf) => (
              <div key={shelf.shelf_id}>
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-600">#{shelf.rank}</span> {shelf.shelf_name}{" "}
                    <span className="text-slate-600">({shelf.store_name} - {shelf.zone})</span>
                  </span>
                  <span title={`traffic ${shelf.traffic_score} · dwell ${shelf.dwell_score} · interaction ${shelf.interaction_score} · stockout penalty ${shelf.stockout_penalty}`}>
                    {shelf.has_behavior_data ? shelf.score.toFixed(1) : "No camera data yet"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: `${shelf.has_behavior_data ? shelf.score : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Visited Shelf</CardTitle>
          </CardHeader>
          {loading ? <div className="h-24 animate-pulse rounded-xl bg-white/5" /> : <ShelfCard item={analysis.data?.most_visited ?? null} accent="text-emerald-400" />}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Least Visited Shelf</CardTitle>
          </CardHeader>
          {loading ? <div className="h-24 animate-pulse rounded-xl bg-white/5" /> : <ShelfCard item={analysis.data?.least_visited ?? null} accent="text-slate-400" />}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shelves</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        ) : !analysis.data?.shelves.length ? (
          <p className="text-sm text-slate-500">No shelves yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Shelf</th>
                  <th className="px-3 py-2 font-medium">Store</th>
                  <th className="px-3 py-2 font-medium">Zone</th>
                  <th className="px-3 py-2 text-right font-medium" title="Products on record in the database for this shelf">
                    On record
                  </th>
                  <th className="px-3 py-2 text-right font-medium" title="Products the camera actually detected in its most recent processed frame">
                    Detected
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Visits</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {analysis.data.shelves.map((s) => (
                  <tr key={s.shelf_id} className="border-b border-white/5 text-slate-300 hover:bg-white/5">
                    <td className="px-3 py-2 font-medium text-white">{s.shelf_name}</td>
                    <td className="px-3 py-2">{s.store_name}</td>
                    <td className="px-3 py-2">{s.zone}</td>
                    <td className="px-3 py-2 text-right">{s.product_count}</td>
                    <td className="px-3 py-2 text-right">
                      {s.detected_product_count == null ? (
                        <span className="text-slate-600" title="This shelf's camera hasn't processed a video yet, so there's nothing to compare against">
                          &mdash;
                        </span>
                      ) : (
                        <span className={s.restocking_needed ? "font-semibold text-amber-400" : ""}>
                          {s.detected_product_count}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{s.visit_count}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(s.status)}`}>{s.status}</span>
                        {s.restocking_needed && (
                          <span
                            className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300"
                            title="The camera is seeing far fewer products than the database expects on this shelf"
                          >
                            <AlertTriangle size={11} /> Restock
                          </span>
                        )}
                      </div>
                    </td>
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
