import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Camera, Cpu, HardDrive, MapPin, MemoryStick, Users as UsersIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import KpiCard from "../../components/ui/KpiCard";
import { useAdminOverview } from "../../hooks/useAdminOverview";
import { useAuditLogs, useSystemHealth } from "../../hooks/useAdminDashboard";

interface AdminUser {
  id: number;
  role: string;
}

interface AdminCamera {
  id: number;
  status: string;
}

const ROLE_COLORS: Record<string, string> = {
  Admin: "#2563eb",
  "Store Manager": "#10b981",
  "Retail Analyst": "#a855f7",
  "Marketing Manager": "#f59e0b",
};

function severityColor(severity: string) {
  if (severity === "critical") return "text-rose-400";
  if (severity === "warning") return "text-amber-400";
  return "text-emerald-400";
}

function HealthBar({ label, percent, hint }: { label: ReactNode; percent: number; hint: string }) {
  const barColor = percent >= 90 ? "from-rose-500 to-rose-400" : percent >= 75 ? "from-amber-500 to-amber-400" : "from-blue-500 to-violet-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{hint}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(seconds % 60)}s`;
}

interface AdminDashboardPageProps {
  /** Compact mode for embedding alongside another dashboard (side-by-side view). */
  compact?: boolean;
}

export default function AdminDashboardPage({ compact = false }: AdminDashboardPageProps = {}) {
  const { stats, users, cameras } = useAdminOverview();
  const health = useSystemHealth();
  const auditLogs = useAuditLogs(10);

  const userList = (users.data ?? []) as AdminUser[];
  const cameraList = (cameras.data ?? []) as AdminCamera[];
  const onlineCameras = cameraList.filter((c) => c.status === "Online").length;

  const roleCounts = Object.entries(
    userList.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([role, count]) => ({ role, count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={compact ? "text-lg font-bold text-white" : "text-2xl font-bold text-white"}>
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-400">System overview and infrastructure</p>
        </div>
        {!compact && (
          <Link
            to="/admin/compare"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            Compare with a store &rarr;
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Users" value={userList.length} icon={UsersIcon} accent="blue" loading={users.isLoading} />
        <KpiCard label="Total Stores" value={stats.data?.totalStores ?? 0} icon={MapPin} accent="violet" loading={stats.isLoading} />
        <KpiCard
          label="Cameras Online"
          value={cameras.isLoading ? "" : `${onlineCameras}/${cameraList.length}`}
          icon={Camera}
          accent="emerald"
          loading={cameras.isLoading}
        />
        <KpiCard label="Zones" value={stats.data?.totalZones ?? 0} icon={Activity} accent="amber" loading={stats.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <span className="text-xs text-slate-500">By role</span>
          </CardHeader>
          <div className="h-64">
            {users.isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-white/5" />
            ) : !roleCounts.length ? (
              <p className="grid h-full place-items-center text-sm text-slate-500">No users yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleCounts} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263244" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="role" stroke="#64748b" fontSize={12} width={120} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #263244", borderRadius: 12, color: "#e5e7eb" }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {roleCounts.map((entry) => (
                      <Cell key={entry.role} fill={ROLE_COLORS[entry.role] ?? "#2563eb"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            <Link to="/users" className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white">
              User Management <span className="text-slate-500">{userList.length}</span>
            </Link>
            <Link to="/stores" className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white">
              Store Management <span className="text-slate-500">{stats.data?.totalStores ?? 0}</span>
            </Link>
            <Link to="/cameras" className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white">
              Camera Management <span className="text-slate-500">{cameraList.length}</span>
            </Link>
            <Link to="/zones" className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white">
              Zone Management <span className="text-slate-500">{stats.data?.totalZones ?? 0}</span>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health & Infrastructure</CardTitle>
            <span className="text-xs text-slate-500">
              {health.data ? `uptime ${formatUptime(health.data.uptime_seconds)}` : ""}
            </span>
          </CardHeader>
          {health.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
          ) : health.isError || !health.data ? (
            <p className="text-sm text-slate-500">Couldn't load system metrics.</p>
          ) : (
            <div className="space-y-4">
              <HealthBar
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Cpu size={12} /> CPU
                  </span>
                }
                percent={health.data.cpu_percent}
                hint={`${health.data.cpu_percent.toFixed(1)}%`}
              />
              <HealthBar
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <MemoryStick size={12} /> Memory
                  </span>
                }
                percent={health.data.memory_percent}
                hint={`${(health.data.memory_used_mb / 1024).toFixed(1)} / ${(health.data.memory_total_mb / 1024).toFixed(1)} GB`}
              />
              <HealthBar
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <HardDrive size={12} /> Disk
                  </span>
                }
                percent={health.data.disk_percent}
                hint={`${health.data.disk_used_gb.toFixed(0)} / ${health.data.disk_total_gb.toFixed(0)} GB`}
              />
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <span>Processes: {health.data.process_count}</span>
                <span className="flex items-center gap-3">
                  <span className={health.data.api_status === "healthy" ? "text-emerald-400" : "text-rose-400"}>
                    API {health.data.api_status}
                  </span>
                  <span className={health.data.db_status === "connected" ? "text-emerald-400" : "text-rose-400"}>
                    DB {health.data.db_status}
                  </span>
                </span>
              </div>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit & Security Logs</CardTitle>
          </CardHeader>
          {auditLogs.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-white/5" />)}</div>
          ) : !auditLogs.data?.logs.length ? (
            <p className="text-sm text-slate-500">No audit events recorded yet.</p>
          ) : (
            <div className="max-h-64 space-y-3 overflow-y-auto text-sm">
              {auditLogs.data.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${severityColor(log.severity)}`} />
                  <div className="min-w-0">
                    <p className="truncate text-slate-300">{log.message}</p>
                    <p className="text-xs text-slate-600">
                      {new Date(log.timestamp).toLocaleTimeString()} {log.actor_role ? `· ${log.actor_role}` : ""}
                    </p>
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
