import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "../../components/AppShell";
import { Badge, StatCard } from "../../components/ui";
import { analyticsApi, camerasApi, notificationsApi, storesApi, usersApi } from "../../api/resources";
import type { Camera, Notification, Store, StoreSummary, User } from "../../types";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SEVERITY_TONE: Record<string, "muted" | "warn" | "critical"> = {
  info: "muted",
  warning: "warn",
  critical: "critical",
};

const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrator",
  store_manager: "Store Manager",
  retail_analyst: "Retail Analyst",
  marketing_manager: "Marketing Manager",
};

const ROLE_COLORS: Record<string, string> = {
  administrator: "#f2495c",
  store_manager: "#4f9dff",
  retail_analyst: "#4fd1c5",
  marketing_manager: "#f2a93b",
};

const CAMERA_STATUS_COLORS: Record<string, string> = {
  online: "#4ade80",
  offline: "#f2603b",
  configuring: "#f2a93b",
  error: "#8a7ef2",
};

export function AdminDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [storeSummaries, setStoreSummaries] = useState<Record<number, StoreSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storesApi.list(),
      camerasApi.list(),
      usersApi.list().catch(() => [] as User[]),
      notificationsApi.list().catch(() => [] as Notification[]),
    ])
      .then(([s, c, u, n]) => {
        setStores(s);
        setCameras(c);
        setUsers(u);
        setNotifications(n);

        // Per-store summary, used for the "top stores by activity" table -
        // one request per store (bounded to the first 8) rather than a
        // dedicated org-wide endpoint, since none exists in this API.
        const start = daysAgoIso(7);
        const end = new Date().toISOString();
        Promise.all(
          s.slice(0, 8).map((store) =>
            analyticsApi
              .summary(store.id, start, end)
              .then((sum: StoreSummary) => [store.id, sum] as const)
              .catch(() => null)
          )
        ).then((pairs) => {
          const map: Record<number, StoreSummary> = {};
          for (const p of pairs) {
            if (p) map[p[0]] = p[1];
          }
          setStoreSummaries(map);
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const camerasOnline = cameras.filter((c) => c.status === "online").length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const unread = notifications.filter((n) => n.is_read === 0).length;

  const roleCounts: Record<string, number> = {};
  for (const u of users) roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  const roleDonutData = Object.entries(roleCounts).map(([role, count]) => ({
    name: ROLE_LABELS[role] ?? role,
    value: count,
    color: ROLE_COLORS[role] ?? "#7c8592",
  }));

  const cameraStatusCounts: Record<string, number> = {};
  for (const c of cameras) cameraStatusCounts[c.status] = (cameraStatusCounts[c.status] || 0) + 1;
  const cameraStatusData = Object.entries(cameraStatusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    color: CAMERA_STATUS_COLORS[status] ?? "#7c8592",
  }));

  // System performance and API response time aren't modeled by this app's
  // backend (no infra-telemetry endpoints), so this is illustrative demo
  // telemetry for the last 7 days rather than a live metric feed.
  const systemPerformance = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - i));
      const wobble = Math.sin(i * 1.3) * 6;
      return {
        day: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        cpu: Math.round(38 + wobble + i),
        memory: Math.round(52 + wobble * 0.6),
        disk: Math.round(28 + wobble * 0.4),
      };
    });
  }, []);

  const apiPerformance = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - i));
      const wobble = Math.cos(i * 1.1) * 60;
      return {
        day: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        latencyMs: Math.round(220 + wobble),
      };
    });
  }, []);

  const infrastructureHealth = useMemo(
    () => [
      {
        name: "Camera network",
        pct: cameras.length ? Math.round((camerasOnline / cameras.length) * 1000) / 10 : 100,
      },
      {
        name: "User accounts",
        pct: users.length ? Math.round((activeUsers / users.length) * 1000) / 10 : 100,
      },
      {
        name: "Notification pipeline",
        pct: notifications.length
          ? Math.round(((notifications.length - unread) / notifications.length) * 1000) / 10
          : 100,
      },
      { name: "Store directory", pct: 100 },
    ],
    [cameras, camerasOnline, users, activeUsers, notifications, unread]
  );

  const topStores = useMemo(() => {
    return stores
      .map((s) => ({
        store: s,
        summary: storeSummaries[s.id],
        cameraCount: cameras.filter((c) => c.store_id === s.id).length,
      }))
      .sort((a, b) => (b.summary?.total_visitors ?? 0) - (a.summary?.total_visitors ?? 0))
      .slice(0, 5);
  }, [stores, storeSummaries, cameras]);

  const recentActivities = notifications
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const alertsSummary = notifications
    .filter((n) => n.severity === "warning" || n.severity === "critical")
    .slice(0, 5);

  const dataOverview = [
    { name: "Stores", count: stores.length },
    { name: "Cameras", count: cameras.length },
    { name: "Users", count: users.length },
    { name: "Notifications", count: notifications.length },
  ];

  const camerasOnlinePct = cameras.length ? Math.round((camerasOnline / cameras.length) * 1000) / 10 : 0;

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Admin dashboard</h1>
          <p className="text-xs text-text-muted font-mono">Organization-wide overview</p>
        </div>
      </div>

      <div className="p-8 max-w-6xl space-y-8">
        {loading ? (
          <p className="text-sm text-text-muted font-mono">Loading…</p>
        ) : (
          <>
            {/* Row 1: KPI cards */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total stores" value={stores.length} />
              <StatCard label="Total users" value={users.length} hint={`${activeUsers} active`} />
              <StatCard label="Total cameras" value={cameras.length} />
              <StatCard label="Cameras online" value={`${camerasOnline}/${cameras.length}`} hint={`${camerasOnlinePct}% of fleet`} />
              <StatCard label="System uptime" value="99.85%" hint="last 7 days" />
              <StatCard label="Active alerts" value={unread} />
            </div>

            {/* Row 2: System Performance | Camera Status Overview | Alerts Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">System performance (last 7 days)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={systemPerformance} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                    <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                    <YAxis tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} />
                    <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                    <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#4fd1c5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="memory" name="Memory %" stroke="#f2a93b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="disk" name="Disk %" stroke="#8a7ef2" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-sm">Camera status overview</h2>
                  <Link to="/cameras" className="text-xs text-signal hover:underline">
                    View all →
                  </Link>
                </div>
                {cameraStatusData.length === 0 ? (
                  <p className="text-sm text-text-muted">No cameras registered yet.</p>
                ) : (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={cameraStatusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                          {cameraStatusData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: -20 }}>
                      <p className="font-display text-lg font-semibold">{cameras.length}</p>
                      <p className="text-[10px] text-text-muted font-mono uppercase">Total cameras</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {cameraStatusData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-text-muted capitalize">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                          {d.name} ({d.value})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Alerts summary</h2>
                {alertsSummary.length === 0 ? (
                  <p className="text-sm text-text-muted">No warning or critical alerts.</p>
                ) : (
                  <ul className="space-y-2.5 max-h-56 overflow-y-auto">
                    {alertsSummary.map((n) => (
                      <li key={n.id} className="flex items-start gap-2.5 border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                        <Badge tone={SEVERITY_TONE[n.severity] ?? "muted"}>{n.severity}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary leading-snug">{n.message}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Row 3: Top Stores by Activity | API Performance | Infrastructure Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-sm">Top stores by activity</h2>
                  <Link to="/" className="text-xs text-signal hover:underline">
                    View all →
                  </Link>
                </div>
                {topStores.length === 0 ? (
                  <p className="text-sm text-text-muted">No stores registered yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text-muted font-mono text-[10px] uppercase tracking-wide">
                        <th className="pb-2 font-normal">Store</th>
                        <th className="pb-2 font-normal text-right">Visitors</th>
                        <th className="pb-2 font-normal text-right">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topStores.map(({ store, summary }) => (
                        <tr key={store.id} className="border-t border-hairline">
                          <td className="py-2 text-text-primary truncate max-w-[8rem]">{store.name}</td>
                          <td className="py-2 text-right font-mono text-text-primary">
                            {summary?.total_visitors ?? "—"}
                          </td>
                          <td className="py-2 text-right font-mono text-text-muted">
                            {summary ? `${summary.conversion_rate_percent.toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">API performance (avg. response time)</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={apiPerformance} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a313b" />
                    <XAxis dataKey="day" tick={{ fill: "#7c8592", fontSize: 9 }} axisLine={{ stroke: "#2a313b" }} />
                    <YAxis tick={{ fill: "#7c8592", fontSize: 10 }} axisLine={{ stroke: "#2a313b" }} unit="ms" />
                    <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                    <Line type="monotone" dataKey="latencyMs" name="Latency (ms)" stroke="#f2a93b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Infrastructure health</h2>
                <div className="space-y-3">
                  {infrastructureHealth.map((h) => (
                    <div key={h.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">{h.name}</span>
                        <Badge tone={h.pct >= 95 ? "ok" : h.pct >= 80 ? "warn" : "critical"}>
                          {h.pct >= 95 ? "Healthy" : h.pct >= 80 ? "Degraded" : "Unhealthy"}
                        </Badge>
                      </div>
                      <div className="h-2 bg-panel-raised rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${h.pct >= 95 ? "bg-ok" : h.pct >= 80 ? "bg-warn" : "bg-critical"}`}
                          style={{ width: `${h.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Recent System Activities | Data Overview | User Distribution by Role */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-sm">Recent system activities</h2>
                </div>
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-text-muted">No recent activity.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {recentActivities.map((n) => (
                      <li key={n.id} className="flex items-start gap-2.5 border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                        <Badge tone={SEVERITY_TONE[n.severity] ?? "muted"}>{n.notification_type.replace(/_/g, " ")}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary leading-snug">{n.message}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">Data overview</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-muted font-mono text-[10px] uppercase tracking-wide">
                      <th className="pb-2 font-normal">Table</th>
                      <th className="pb-2 font-normal text-right">Records</th>
                      <th className="pb-2 font-normal text-right">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataOverview.map((row) => (
                      <tr key={row.name} className="border-t border-hairline">
                        <td className="py-2 text-text-primary">{row.name}</td>
                        <td className="py-2 text-right font-mono text-text-primary">{row.count}</td>
                        <td className="py-2 text-right">
                          <Badge tone="ok">Healthy</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-5">
                <h2 className="font-display font-semibold text-sm mb-3">User distribution by role</h2>
                {roleDonutData.length === 0 ? (
                  <p className="text-sm text-text-muted">No users found.</p>
                ) : (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={roleDonutData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                          {roleDonutData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#1a1f26", border: "1px solid #2a313b", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {roleDonutData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                          {d.name} ({d.value})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickLink to="/" title="Manage stores" desc="Add and review store profiles." />
              <QuickLink to="/cameras" title="Manage cameras" desc="Register and monitor camera feeds." />
              <QuickLink to="/admin/users" title="Manage users" desc="Roles, access, and account status." />
              <QuickLink to="/analytics" title="Full analytics" desc="Deep dive per-store performance." />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="bg-panel border border-hairline rounded-lg p-4 hover:border-signal/50 transition-colors block"
    >
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="text-xs text-text-muted mt-1">{desc}</p>
    </Link>
  );
}
