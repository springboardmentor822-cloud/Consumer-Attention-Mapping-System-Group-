import { Link } from "react-router-dom";
import { AlertTriangle, Camera, Clock, Lightbulb, ListOrdered, ShieldAlert, ShoppingBag, TrendingUp, UserCheck, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import KpiCard from "../../components/ui/KpiCard";
import HeatmapGrid from "../../components/charts/HeatmapGrid";
import CameraTile, { MAX_CONCURRENT_LIVE_STREAMS } from "../../components/camera/CameraTile";
import RecommendationFeed from "../../components/RecommendationFeed";
import {
  useQueue,
  useShelfActivity,
  useStoreActivities,
  useStoreAlerts,
  useZoneHeatmaps,
  useStoreManagerCameras,
  useStoreManagerSummary,
  useVisitorsByHour,
  useVisitorsByZone,
} from "../../hooks/useStoreManagerDashboard";

const CHART_TOOLTIP_STYLE = {
  background: "#111827",
  border: "1px solid #263244",
  borderRadius: 12,
  color: "#e5e7eb",
  fontSize: 12,
};

const SNAPSHOT_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000";

interface StoreManagerDashboardPageProps {
  /** Overrides the store scope - used by the Admin side-by-side view.
   * Omitted for a real Store Manager, whose own store is resolved server-side. */
  storeId?: number;
  /** Compact mode for embedding alongside another dashboard (side-by-side view). */
  compact?: boolean;
}

export default function StoreManagerDashboardPage({ storeId, compact = false }: StoreManagerDashboardPageProps) {
  const summary = useStoreManagerSummary(storeId);
  const cameras = useStoreManagerCameras(storeId);
  const visitorsByHour = useVisitorsByHour(storeId);
  const visitorsByZone = useVisitorsByZone(storeId);
  const shelfActivity = useShelfActivity(storeId);
  const alerts = useStoreAlerts(storeId);
  const activities = useStoreActivities(storeId);
  const zoneHeatmaps = useZoneHeatmaps(storeId);
  const queue = useQueue(storeId);

  const s = summary.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={compact ? "text-lg font-bold text-white" : "text-2xl font-bold text-white"}>
          Store Overview
        </h1>
        <p className="text-sm text-slate-400">Real-time performance for your store</p>
      </div>

      {summary.isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          Couldn't load store summary. Your account may not be assigned to a store yet.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Today's Visitors" value={s?.today_visitors ?? 0} icon={Users} accent="blue" loading={summary.isLoading} />
        <KpiCard label="Current Customers" value={s?.current_customers ?? 0} icon={Users} accent="emerald" loading={summary.isLoading} />
        <KpiCard
          label="Avg Dwell Time"
          value={s ? `${(s.avg_dwell_time_seconds / 60).toFixed(1)} min` : "0.0 min"}
          icon={Clock}
          accent="violet"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Conversion Rate"
          value={s?.conversion_rate != null ? `${(s.conversion_rate * 100).toFixed(1)}%` : "N/A"}
          hint={s?.conversion_rate == null ? "No checkout zone configured" : "Zone-proximity proxy"}
          icon={TrendingUp}
          accent="amber"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Shelf Engagement"
          value={s?.shelf_engagement_proxy ?? 0}
          hint="Proxy - dwell near shelf cameras"
          icon={ShoppingBag}
          accent="rose"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Cameras Online"
          value={s ? `${s.online_cameras}/${s.total_cameras}` : "0/0"}
          icon={Camera}
          accent="blue"
          loading={summary.isLoading}
        />
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <ListOrdered size={14} className="text-blue-400" />
            {queue.isLoading
              ? "Loading queue..."
              : !queue.data?.counters.length
                ? "No checkout zone configured for queue tracking"
                : queue.data.counters.map((c) => `${c.zone_name}: ${c.current_length} in line${c.is_busy ? " (busy)" : ""}`).join(" · ")}
          </div>
          <div className="flex gap-2">
            <Link to="/employees" className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20">
              <UserCheck size={13} /> Employees
            </Link>
            <Link to="/security-alerts" className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20">
              <ShieldAlert size={13} /> Security Alerts
            </Link>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Live Camera Grid</CardTitle>
          <Link to="/camera-grid" className="text-xs text-blue-400 hover:text-blue-300">
            View full grid &rarr;
          </Link>
        </CardHeader>
        {cameras.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : !cameras.data?.cameras.length ? (
          <p className="text-sm text-slate-500">No cameras registered for this store yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cameras.data.cameras.map((cam, i) => (
              <CameraTile
                key={cam.camera_id}
                index={i + 1}
                camera={cam}
                snapshotBaseUrl={SNAPSHOT_BASE_URL}
                liveEnabled={i < MAX_CONCURRENT_LIVE_STREAMS}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store Heatmap</CardTitle>
        </CardHeader>
        {zoneHeatmaps.isLoading ? (
          <div className="aspect-video animate-pulse rounded-xl bg-white/5" />
        ) : (
          <div className="mx-auto max-w-5xl">
            <HeatmapGrid zones={zoneHeatmaps.data?.zones ?? []} transitions={zoneHeatmaps.data?.transitions ?? []} />
          </div>
        )}
      </Card>

      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={15} className="text-amber-400" /> Optimization Recommendations
            </CardTitle>
            <span className="text-xs text-slate-500">Rule-based, from real traffic/dwell/stock signals</span>
          </CardHeader>
          <RecommendationFeed storeId={storeId} />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visitors by Hour</CardTitle>
          </CardHeader>
          <div className="h-64">
            {visitorsByHour.isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-white/5" />
            ) : !visitorsByHour.data?.points.some((p) => p.visitors > 0) ? (
              <p className="grid h-full place-items-center text-center text-sm text-slate-500">
                No visitors tracked yet today.
                <br />
                <span className="text-xs text-slate-600">Counts reset at midnight and fill in as footage is processed.</span>
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitorsByHour.data?.points ?? []}>
                  <defs>
                    <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={(h) => `${h}:00 - ${(Number(h) + 1) % 24}:00`} />
                  <Area type="monotone" dataKey="visitors" stroke="#2563eb" fill="url(#visitorsGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitors by Zone</CardTitle>
          </CardHeader>
          <div className="h-64">
            {visitorsByZone.isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-white/5" />
            ) : !visitorsByZone.data?.points.length ? (
              <p className="grid h-full place-items-center text-sm text-slate-500">No zones configured yet.</p>
            ) : !visitorsByZone.data.points.some((p) => p.visitors > 0) ? (
              <p className="grid h-full place-items-center text-center text-sm text-slate-500">
                No visitors tracked yet today.
                <br />
                <span className="text-xs text-slate-600">Counts reset at midnight and fill in as footage is processed.</span>
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitorsByZone.data.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                  <XAxis dataKey="zone_name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="visitors" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          {alerts.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />)}
            </div>
          ) : !alerts.data?.alerts.length ? (
            <p className="text-sm text-slate-500">No active alerts.</p>
          ) : (
            <div className="space-y-3">
              {alerts.data.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-black/30 p-3">
                  <AlertTriangle
                    size={16}
                    className={alert.severity === "critical" ? "mt-0.5 flex-shrink-0 text-rose-400" : "mt-0.5 flex-shrink-0 text-amber-400"}
                  />
                  <p className="text-sm text-slate-300">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shelf Performance</CardTitle>
            <span className="text-xs text-slate-500">Engagement proxy</span>
          </CardHeader>
          {shelfActivity.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
          ) : !shelfActivity.data?.shelves.length ? (
            <p className="text-sm text-slate-500">No shelves configured yet.</p>
          ) : (
            <div className="space-y-3">
              {shelfActivity.data.shelves.slice(0, 6).map((shelf) => {
                const max = shelfActivity.data!.shelves[0]?.activity_proxy || 1;
                const pct = Math.round((shelf.activity_proxy / max) * 100);
                return (
                  <div key={shelf.shelf_id}>
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span className="truncate">{shelf.shelf_name}</span>
                      <span>{shelf.activity_proxy}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          {activities.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
          ) : !activities.data?.activities.length ? (
            <p className="text-sm text-slate-500">No recent activity.</p>
          ) : (
            <div className="max-h-64 space-y-3 overflow-y-auto text-sm">
              {activities.data.activities.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-slate-300">{activity.message}</p>
                    <p className="text-xs text-slate-600">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
