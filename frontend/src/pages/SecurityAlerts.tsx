import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AlertTriangle, Camera as CameraIcon, CheckCircle2, Gauge, Plus, ShieldAlert, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { canWrite } from "../utils/permissions";
import { useStoreAlerts } from "../hooks/useStoreManagerDashboard";
import { ALERT_SEVERITIES, ALERT_TYPES, type Alert, type AlertCreatePayload, alertsApi } from "../api/alerts";

// Polling interval for logged/auto-generated alerts - the spec for this
// feature calls for updates without a page refresh at least every 5s.
const LIVE_ALERT_POLL_MS = 5000;
// How long a newly-arrived alert's row stays visually highlighted.
const HIGHLIGHT_DURATION_MS = 4000;

/** Short synthesized beep via the Web Audio API - no audio asset needed. */
function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
    oscillator.onended = () => ctx.close();
  } catch {
    // Audio is a nice-to-have notification, never worth crashing the page over.
  }
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

function severityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-rose-500/15 text-rose-300";
    case "warning":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-blue-500/15 text-blue-300";
  }
}

export default function SecurityAlerts() {
  const { user } = useAuth();
  const writable = canWrite(user);
  const queryClient = useQueryClient();
  const storeId = user?.store_id ?? undefined;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AlertCreatePayload>({
    store_id: storeId ?? 0,
    alert_type: ALERT_TYPES[0],
    severity: "warning",
    message: "",
  });
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");

  // Real-time camera-offline / occupancy-threshold alerts, computed live -
  // reused from the existing Store Manager dashboard endpoint rather than
  // duplicated here.
  const liveAlerts = useStoreAlerts(storeId);

  const loggedAlertsQuery = useQuery({
    queryKey: ["alerts", storeId ?? null],
    queryFn: () => alertsApi.list(storeId).then((r) => r.data),
    refetchInterval: LIVE_ALERT_POLL_MS,
    // A security page should keep catching new alerts even if the tab
    // isn't focused (a second monitor, a minimized window) - React
    // Query's default pauses interval polling in the background, which
    // would silently violate "no refresh needed" the moment a manager
    // looks away from the tab.
    refetchIntervalInBackground: true,
  });

  // Consolidated counts (camera status, occupancy alerts) for the KPI row -
  // same 5s cadence as the alerts list so every card on this page updates
  // together without a page refresh.
  const securityQuery = useQuery({
    queryKey: ["security-dashboard", storeId ?? null],
    queryFn: () => alertsApi.security(storeId).then((r) => r.data),
    refetchInterval: LIVE_ALERT_POLL_MS,
    refetchIntervalInBackground: true,
  });

  // Toast + sound + row-highlight whenever a genuinely new unresolved alert
  // shows up in a poll tick. Tracks previously-seen ids across renders so
  // this only fires for alerts that weren't there last tick, not on every
  // refetch of the same data.
  const seenAlertIds = useRef<Set<number> | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const data = loggedAlertsQuery.data;
    if (!data) return;
    const unresolvedIds = new Set(data.filter((a) => !a.is_resolved).map((a) => a.id));

    if (seenAlertIds.current === null) {
      // First load: establish the baseline without notifying for alerts
      // that already existed before this page was opened.
      seenAlertIds.current = unresolvedIds;
      return;
    }

    const newAlerts = data.filter((a) => !a.is_resolved && !seenAlertIds.current!.has(a.id));
    if (newAlerts.length > 0) {
      for (const alert of newAlerts) {
        toast[alert.severity === "critical" ? "error" : "success"](alert.message, {
          icon: alert.severity === "critical" ? "\u{1F6A8}" : "⚠️",
        });
      }
      playAlertSound();
      setHighlightedIds((prev) => new Set([...prev, ...newAlerts.map((a) => a.id)]));
      newAlerts.forEach((alert) => {
        setTimeout(() => {
          setHighlightedIds((prev) => {
            const next = new Set(prev);
            next.delete(alert.id);
            return next;
          });
        }, HIGHLIGHT_DURATION_MS);
      });
    }
    seenAlertIds.current = unresolvedIds;
  }, [loggedAlertsQuery.data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["alerts"] });

  const createMutation = useMutation({
    mutationFn: (payload: AlertCreatePayload) => alertsApi.create(payload),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm({ store_id: storeId ?? 0, alert_type: ALERT_TYPES[0], severity: "warning", message: "" });
    },
    onError: (err) => setFormError(describeError(err, "Failed to log alert")),
  });
  const resolveMutation = useMutation({
    mutationFn: (id: number) => alertsApi.resolve(id),
    onSuccess: () => {
      setListError("");
      invalidate();
    },
    onError: (err) => setListError(describeError(err, "Failed to resolve alert")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, store_id: storeId ?? 0 });
  };

  const loggedAlerts = loggedAlertsQuery.data ?? [];
  const unresolvedCount = loggedAlerts.filter((a) => !a.is_resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Monitoring</h1>
          <p className="text-sm text-slate-400">Live camera/occupancy alerts, plus manager-logged incidents</p>
        </div>
        {writable && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus size={16} /> Log Alert
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Live Alerts" value={liveAlerts.data?.alerts.length ?? 0} icon={AlertTriangle} accent="amber" loading={liveAlerts.isLoading} />
        <KpiCard label="Unresolved Logged Alerts" value={unresolvedCount} icon={ShieldAlert} accent="rose" loading={loggedAlertsQuery.isLoading} />
        <KpiCard
          label="Camera Status"
          value={securityQuery.data ? `${securityQuery.data.camera_status.online}/${securityQuery.data.camera_status.total}` : "-"}
          hint="Online / total"
          icon={CameraIcon}
          accent="blue"
          loading={securityQuery.isLoading}
        />
        <KpiCard
          label="Occupancy Alerts"
          value={securityQuery.data?.occupancy_alert_count ?? 0}
          hint="Unresolved, over threshold"
          icon={Gauge}
          accent="violet"
          loading={securityQuery.isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Alerts</CardTitle>
          <span className="text-xs text-slate-500">Camera status &amp; occupancy, computed in real time</span>
        </CardHeader>
        {liveAlerts.isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />)}</div>
        ) : !liveAlerts.data?.alerts.length ? (
          <p className="text-sm text-slate-500">No live alerts right now.</p>
        ) : (
          <div className="space-y-3">
            {liveAlerts.data.alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-black/30 p-3">
                <AlertTriangle size={16} className={alert.severity === "critical" ? "mt-0.5 flex-shrink-0 text-rose-400" : "mt-0.5 flex-shrink-0 text-amber-400"} />
                <p className="text-sm text-slate-300">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logged Incidents</CardTitle>
        </CardHeader>

        {listError && <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{listError}</p>}

        {loggedAlertsQuery.isLoading ? (
          <div className="grid h-24 place-items-center">
            <Spinner label="Loading alerts" />
          </div>
        ) : loggedAlertsQuery.isError ? (
          <p className="text-sm text-rose-400">{describeError(loggedAlertsQuery.error, "Couldn't load alerts")}</p>
        ) : !loggedAlerts.length ? (
          <p className="text-sm text-slate-500">No incidents logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Severity</th>
                  <th className="px-3 py-2 font-medium">Message</th>
                  <th className="px-3 py-2 font-medium">Logged</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  {writable && <th className="px-3 py-2 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loggedAlerts.map((alert: Alert) => (
                  <tr
                    key={alert.id}
                    className={`border-b border-white/5 text-slate-300 transition-colors duration-1000 hover:bg-white/5 ${
                      highlightedIds.has(alert.id) ? "bg-amber-500/10" : ""
                    }`}
                  >
                    <td className="px-3 py-2 capitalize">{alert.alert_type.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityBadge(alert.severity)}`}>{alert.severity}</span>
                    </td>
                    <td className="px-3 py-2">{alert.message}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{new Date(alert.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {alert.is_resolved ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 size={12} /> Resolved
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400">Open</span>
                      )}
                    </td>
                    {writable && (
                      <td className="px-3 py-2 text-right">
                        {!alert.is_resolved && (
                          <button
                            onClick={() => resolveMutation.mutate(alert.id)}
                            className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Log Alert</h2>
              <button onClick={() => setShowForm(false)} className="rounded p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Type</label>
                  <select
                    value={form.alert_type}
                    onChange={(e) => setForm({ ...form, alert_type: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    {ALERT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  >
                    {ALERT_SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>

              {formError && <p className="text-sm text-rose-400">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Logging..." : "Log Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
