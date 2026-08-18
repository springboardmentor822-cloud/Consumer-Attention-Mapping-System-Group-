"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardSidebar from "../_components/DashboardSidebar";
import KpiCard from "../_components/KpiCard";
import {
  api,
  AdminOverview,
  AdminMonitoring,
  ApiError,
  UserAccount,
  Store,
  Camera,
  CameraHealth,
  CurrentUser,
  AdminAlert,
  AdminLogEntry,
} from "@/lib/api";

function usageColor(percent: number): string {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function UsageBar({ label, percent, detail }: { label: string; percent: number; detail: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${usageColor(percent)} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

function ServiceDot({ name, up }: { name: string; up: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
      <span className={`h-2 w-2 rounded-full ${up ? "bg-emerald-500" : "bg-red-500"}`} />
      <span className="text-sm">{name}</span>
      <span className={`ml-auto text-xs font-medium ${up ? "text-emerald-600" : "text-red-600"}`}>
        {up ? "Up" : "Down"}
      </span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function alertLabel(eventType: string): string {
  return eventType
    .replace(/^alert_/, "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function alertSeverity(alert: AdminAlert): "Critical" | "Warning" | "Attention" {
  if (alert.event_type === "alert_camera_health") return "Critical";
  if (alert.event_type === "alert_traffic_anomaly" || alert.event_type === "alert_shelf_performance") return "Warning";
  return "Attention";
}

function severityClass(severity: "Critical" | "Warning" | "Attention"): string {
  if (severity === "Critical") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "Warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function alertStatus(alert: AdminAlert): string {
  const payload = alert.event_metadata?.alert;
  if (payload && typeof payload === "object" && "status" in payload) {
    return String(payload.status);
  }
  return "Alert";
}

function alertTarget(alert: AdminAlert): string {
  const payload = alert.event_metadata?.alert;
  if (payload && typeof payload === "object") {
    if ("camera_name" in payload && payload.camera_name) return String(payload.camera_name);
    if ("shelf_id" in payload && payload.shelf_id) return `Shelf ${String(payload.shelf_id).slice(0, 8)}`;
  }
  return alert.target_type ?? "System";
}

function formatAlertTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const ROLE_OPTIONS = ["SuperAdmin", "StoreManager", "Analyst", "MarketingManager"];

export default function AdminDashboard() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [monitoring, setMonitoring] = useState<AdminMonitoring | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);

  const [stores, setStores] = useState<Store[]>([]);
  const [storesError, setStoresError] = useState<string | null>(null);

  const [cameras, setCameras] = useState<(Camera & { store_name: string })[]>([]);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  const [cameraActionError, setCameraActionError] = useState<string | null>(null);
  const [cameraHealth, setCameraHealth] = useState<CameraHealth[]>([]);
  const [securityLogs, setSecurityLogs] = useState<AdminLogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminLogEntry[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [cameraHealthError, setCameraHealthError] = useState<string | null>(null);


  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState("");
  const [alertsRefreshing, setAlertsRefreshing] = useState(false);

  const loadUsers = useCallback(() => {
    api
      .listUsers()
      .then(setUsers)
      .catch((err: unknown) =>
        setUsersError(err instanceof ApiError ? err.message : "Failed to load users.")
      );
  }, []);

  const loadCameraHealth = useCallback(() => {
    api.getCameraHealth().then(setCameraHealth).catch((err: unknown) => {
      setCameraHealthError(err instanceof ApiError ? err.message : "Failed to load camera health.");
    });
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const [security, audit] = await Promise.all([api.getSecurityLogs(100), api.getAuditLogs(100)]);
      setSecurityLogs(security);
      setAuditLogs(audit);
      setLogsError(null);
    } catch (err: unknown) {
      setLogsError(err instanceof ApiError ? err.message : "Failed to load security/audit logs.");
    }
  }, []);

  const loadCameras = useCallback((storeList: Store[]) => {
    Promise.all(
      storeList.map((s) =>
        api
          .listCameras(s.id)
          .then((cams) => cams.map((c) => ({ ...c, store_name: s.name })))
          .catch(() => [])
      )
    ).then((results) => setCameras(results.flat()));
  }, []);

  const loadAlerts = useCallback(async (filter = "") => {
    setAlertsRefreshing(true);
    try {
      const result = await api.getAdminAlerts(filter || undefined);
      setAlerts(result);
      setAlertsError(null);
    } catch (err: unknown) {
      setAlertsError(err instanceof ApiError ? err.message : "Failed to load alerts.");
    } finally {
      setAlertsLoading(false);
      setAlertsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    api
      .getAdminOverview()
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("You don't have permission to view this page (SuperAdmin only).");
        } else {
          setError("Failed to load admin overview.");
        }
      })
      .finally(() => setLoading(false));

    api
      .getAdminMonitoring()
      .then(setMonitoring)
      .catch((err: unknown) => {
        setMonitoringError(
          err instanceof ApiError ? err.message : "Failed to load platform monitoring."
        );
      });

    api.getMe().then(setMe).catch(() => setMe(null));

    loadUsers();

    loadCameraHealth();
    loadLogs();

    api
      .listStores()
      .then((storeList) => {
        setStores(storeList);
        loadCameras(storeList);
      })
      .catch((err: unknown) =>
        setStoresError(err instanceof ApiError ? err.message : "Failed to load stores.")
      );

    loadAlerts();

    const cameraHealthInterval = setInterval(() => {
      loadCameraHealth();
    }, 10_000);

    const monitoringInterval = setInterval(() => {
      api.getAdminMonitoring().then(setMonitoring).catch(() => {});
    }, 10_000);

    const alertInterval = setInterval(() => {
      loadAlerts(alertFilter);
    }, 30_000);

    const logsInterval = setInterval(loadLogs, 30_000);

    return () => {
      clearInterval(cameraHealthInterval);
      clearInterval(monitoringInterval);
      clearInterval(alertInterval);
      clearInterval(logsInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRoleChange(userId: string, role_name: string) {
    setUserActionError(null);
    try {
      await api.setUserRole(userId, role_name);
      loadUsers();
    } catch (err) {
      setUserActionError(err instanceof ApiError ? err.message : "Failed to update role.");
    }
  }

  async function handleActiveToggle(userId: string, next: boolean) {
    setUserActionError(null);
    try {
      await api.setUserActive(userId, next);
      loadUsers();
    } catch (err) {
      setUserActionError(err instanceof ApiError ? err.message : "Failed to update status.");
    }
  }

  async function handleCameraToggle(camera: Camera & { store_name: string }, next: boolean) {
    setCameraActionError(null);
    try {
      await api.setCameraActive(camera.store_id, camera.id, next);
      setCameras((prev) =>
        prev.map((c) => (c.id === camera.id ? { ...c, is_active: next } : c))
      );
    } catch (err) {
      setCameraActionError(err instanceof ApiError ? err.message : "Failed to update camera.");
    }
  }

  async function handleAlertFilterChange(value: string) {
    setAlertFilter(value);
    await loadAlerts(value);
  }

  return (
    <div className="flex">
      <DashboardSidebar
        roleLabel="Admin"
        sections={[
          { id: "overview", label: "Overview" },
          { id: "monitoring", label: "Platform Monitoring" },
          { id: "users", label: "User Management" },
          { id: "stores", label: "Store Management" },
          { id: "cameras", label: "Camera Management" },
          { id: "security-logs", label: "Security Logs" },
          { id: "audit-logs", label: "Audit Logs" },
          { id: "camera-health", label: "Camera Health" },
          { id: "alerts", label: "Alerts" },
        ]}
      />
      <main className="flex-1 p-6 flex flex-col gap-6">
        <h1 id="overview" className="text-lg font-semibold">
          Global System Administration
        </h1>

        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard value={data.total_stores} label="Total Stores" accent="blue" />
            <KpiCard value={data.total_users} label="Total Users" accent="blue" />
            <KpiCard value={data.total_cameras} label="Total Cameras" accent="blue" />
            <KpiCard
              value={data.active_cameras_flagged}
              label="Cameras Marked Active"
              accent="amber"
            />
            <KpiCard
              value={data.online_cameras}
              label="Cameras Online (heartbeat)"
              accent="green"
            />
          </div>
        )}

        <div id="monitoring" className="flex flex-col gap-4 scroll-mt-6">
          <h2 className="text-base font-semibold">Platform Monitoring</h2>

          {monitoringError && <p className="text-sm text-red-500">{monitoringError}</p>}

          {monitoring && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  value={formatUptime(monitoring.api.uptime_seconds)}
                  label="API Uptime (this process)"
                  accent="blue"
                />
                <KpiCard value={monitoring.api.total_requests} label="API Requests (since start)" accent="blue" />
                <KpiCard
                  value={monitoring.api.avg_response_time_ms !== null ? `${monitoring.api.avg_response_time_ms}ms` : "—"}
                  label={`Avg Response Time (last ${monitoring.api.avg_response_time_window})`}
                  accent="blue"
                />
                <KpiCard
                  value={`${monitoring.services_running_count}/${monitoring.services_total_count}`}
                  label="Running Services"
                  accent={monitoring.services_running_count === monitoring.services_total_count ? "green" : "red"}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-md border border-border p-4 flex flex-col gap-4">
                  <p className="text-sm font-medium">System Resources</p>
                  {monitoring.system_available && monitoring.system ? (
                    <>
                      <UsageBar
                        label="CPU"
                        percent={monitoring.system.cpu_percent}
                        detail={`${monitoring.system.cpu_percent}%`}
                      />
                      <UsageBar
                        label="RAM"
                        percent={monitoring.system.ram_percent}
                        detail={`${monitoring.system.ram_used_gb} / ${monitoring.system.ram_total_gb} GB`}
                      />
                      <UsageBar
                        label="Disk"
                        percent={monitoring.system.disk_percent}
                        detail={`${monitoring.system.disk_used_gb} / ${monitoring.system.disk_total_gb} GB`}
                      />
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      psutil isn&apos;t installed on the backend — run{" "}
                      <code className="text-foreground">pip install psutil --break-system-packages</code>{" "}
                      and restart uvicorn to enable this.
                    </p>
                  )}
                </div>

                <div className="rounded-md border border-border p-4 flex flex-col gap-4">
                  <p className="text-sm font-medium">GPU</p>
                  {monitoring.gpu && monitoring.gpu.length > 0 ? (
                    monitoring.gpu.map((g, i) => (
                      <div key={i} className="flex flex-col gap-3">
                        <p className="text-xs text-muted-foreground">{g.name}</p>
                        <UsageBar
                          label="Utilization"
                          percent={g.utilization_percent}
                          detail={`${g.utilization_percent}%`}
                        />
                        <UsageBar
                          label="VRAM"
                          percent={(g.memory_used_mb / g.memory_total_mb) * 100}
                          detail={`${Math.round(g.memory_used_mb)} / ${Math.round(g.memory_total_mb)} MB`}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No GPU detected (nvidia-smi not found, or no NVIDIA GPU on this machine).
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-border p-4 flex flex-col gap-3">
                <p className="text-sm font-medium">Services</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <ServiceDot name="Postgres" up={monitoring.services.postgres} />
                  <ServiceDot name="TimescaleDB" up={monitoring.services.timescaledb} />
                  <ServiceDot name="Redis" up={monitoring.services.redis} />
                </div>
              </div>
            </>
          )}
        </div>

        <div id="users" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-base font-semibold">User Management</h2>
          {usersError && <p className="text-sm text-red-500">{usersError}</p>}
          {userActionError && <p className="text-sm text-red-500">{userActionError}</p>}
          {users.length === 0 && !usersError ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = me?.id === u.id;
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="py-2">
                        {u.email}
                        {isSelf && <span className="text-xs text-muted-foreground"> (you)</span>}
                      </td>
                      <td className="py-2">
                        <select
                          className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                          value={u.role_name ?? ""}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <span className={u.is_active ? "text-emerald-600" : "text-red-600"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          className="text-xs underline disabled:opacity-40 disabled:no-underline"
                          disabled={isSelf}
                          onClick={() => handleActiveToggle(u.id, !u.is_active)}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="text-xs text-muted-foreground">
            You can&apos;t change your own role or deactivate your own account — prevents a
            self-lockout with no other SuperAdmin to undo it.
          </p>
        </div>

        <div id="stores" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-base font-semibold">Store Management</h2>
          {storesError && <p className="text-sm text-red-500">{storesError}</p>}
          {stores.length === 0 && !storesError ? (
            <p className="text-sm text-muted-foreground">No stores yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Location</th>
                  <th className="py-2 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-muted-foreground">{s.location ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">
                      {s.owner_id
                        ? users.find((u) => u.id === s.owner_id)?.email ?? s.owner_id
                        : "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-muted-foreground">
            Create/edit isn&apos;t built here yet — store creation already exists via POST
            /api/stores, this is a read view only.
          </p>
        </div>

        <div id="cameras" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-base font-semibold">Camera Management</h2>
          {camerasError && <p className="text-sm text-red-500">{camerasError}</p>}
          {cameraActionError && <p className="text-sm text-red-500">{cameraActionError}</p>}
          {cameras.length === 0 && !camerasError ? (
            <p className="text-sm text-muted-foreground">No cameras yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Store</th>
                  <th className="py-2 font-medium">Source</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cameras.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2 text-muted-foreground">{c.store_name}</td>
                    <td className="py-2 text-muted-foreground font-mono text-xs">{c.source_path}</td>
                    <td className="py-2">
                      <span className={c.is_active ? "text-emerald-600" : "text-red-600"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        className="text-xs underline"
                        onClick={() => handleCameraToggle(c, !c.is_active)}
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-muted-foreground">
            &quot;Active&quot; here is a DB flag only — it does not confirm the camera is actually
            streaming or reachable. The Camera Health section below uses the separate heartbeat
            mechanism.
          </p>
        </div>

        <div id="camera-health" className="flex flex-col gap-3 scroll-mt-6">
          <div>
            <h2 className="text-base font-semibold">Camera Health</h2>
            <p className="text-xs text-muted-foreground">
              Live connectivity status from the camera heartbeat mechanism.
            </p>
          </div>
          {cameraHealthError && <p className="text-sm text-red-500">{cameraHealthError}</p>}
          {cameraHealth.length === 0 && !cameraHealthError ? (
            <p className="text-sm text-muted-foreground">No camera health data available.</p>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                    <th className="px-3 py-2 font-medium">Camera</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Last Seen</th>
                    <th className="px-3 py-2 font-medium">Recording</th>
                    <th className="px-3 py-2 font-medium">Streaming</th>
                    <th className="px-3 py-2 font-medium">Network</th>
                  </tr>
                </thead>
                <tbody>
                  {cameraHealth.map((camera) => (
                    <tr key={camera.camera_id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3 font-medium">{camera.name ?? camera.camera_id}</td>
                      <td className="px-3 py-3">
                        <span className={camera.online ? "text-emerald-600" : "text-red-600"}>
                          {camera.online ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {camera.last_seen_at ? new Date(camera.last_seen_at).toLocaleString() : "Never"}
                      </td>
                      <td className="px-3 py-3">{camera.recording ? "Yes" : "No"}</td>
                      <td className="px-3 py-3">{camera.streaming ? "Yes" : "No"}</td>
                      <td className="px-3 py-3">{camera.network_quality ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="security-logs" className="flex flex-col gap-3 scroll-mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Security Logs</h2>
              <p className="text-xs text-muted-foreground">Persisted security events from the backend EventLog.</p>
            </div>
            <button className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted" onClick={loadLogs}>Refresh</button>
          </div>
          {logsError && <p className="text-sm text-red-500">{logsError}</p>}
          <div className="rounded-md border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border bg-muted/30"><th className="px-3 py-2">Time</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">IP</th></tr></thead>
              <tbody>{securityLogs.length ? securityLogs.map((log) => <tr key={log.id} className="border-b border-border last:border-0"><td className="px-3 py-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td><td className="px-3 py-2 font-medium">{log.event_type}</td><td className="px-3 py-2 text-muted-foreground">{log.description}</td><td className="px-3 py-2">{log.target_type ?? "—"}</td><td className="px-3 py-2">{log.ip_address ?? "—"}</td></tr>) : <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No security events recorded.</td></tr>}</tbody>
            </table>
          </div>
        </div>

        <div id="audit-logs" className="flex flex-col gap-3 scroll-mt-6">
          <div>
            <h2 className="text-base font-semibold">Audit Logs</h2>
            <p className="text-xs text-muted-foreground">Entity and administrative changes recorded by the backend.</p>
          </div>
          <div className="rounded-md border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border bg-muted/30"><th className="px-3 py-2">Time</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Actor</th><th className="px-3 py-2">Target</th></tr></thead>
              <tbody>{auditLogs.length ? auditLogs.map((log) => <tr key={log.id} className="border-b border-border last:border-0"><td className="px-3 py-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td><td className="px-3 py-2 font-medium">{log.event_type}</td><td className="px-3 py-2 text-muted-foreground">{log.description}</td><td className="px-3 py-2">{log.actor_user_id ?? "System"}</td><td className="px-3 py-2">{log.target_type ?? "—"}</td></tr>) : <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No audit events recorded.</td></tr>}</tbody>
            </table>
          </div>
        </div>

        <div id="alerts" className="flex flex-col gap-3 scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Alert Center</h2>
              <p className="text-xs text-muted-foreground">
                Persisted alerts from the Redis Streams alert pipeline.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                value={alertFilter}
                onChange={(e) => handleAlertFilterChange(e.target.value)}
              >
                <option value="">All alert types</option>
                <option value="camera_health">Camera Health</option>
                <option value="traffic_anomaly">Traffic Anomaly</option>
                <option value="shelf_performance">Shelf Performance</option>
                <option value="product_visibility">Product Visibility</option>
              </select>

              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                disabled={alertsRefreshing}
                onClick={() => loadAlerts(alertFilter)}
              >
                {alertsRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {alertsError && <p className="text-sm text-red-500">{alertsError}</p>}

          {alertsLoading ? (
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <div className="rounded-md border border-border p-6 text-center">
              <p className="text-sm font-medium">No alerts found</p>
              <p className="text-xs text-muted-foreground mt-1">
                No persisted alerts match the selected filter.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                    
                    <th className="px-3 py-2 font-medium">Severity</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Target</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-border last:border-0">
                      
                      <td className="px-3 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${severityClass(alertSeverity(alert))}`}>{alertSeverity(alert)}</span></td>
                      <td className="px-3 py-3">
                        <span className="font-medium">{alertLabel(alert.event_type)}</span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {alertTarget(alert)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border border-border px-2 py-1 text-xs">
                          {alertStatus(alert)}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-md text-muted-foreground">
                        {alert.description ?? "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {formatAlertTime(alert.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Alerts are read from persisted EventLog records. This dashboard does not fabricate
            alert states or treat the camera DB active flag as camera health.
          </p>
        </div>
      </main>
    </div>
  );
}
