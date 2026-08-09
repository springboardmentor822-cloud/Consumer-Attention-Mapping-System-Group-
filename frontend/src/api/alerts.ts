import api from "./client";

export interface Alert {
  id: number;
  store_id: number;
  camera_id: number | null;
  zone_id: number | null;
  alert_type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  created_by: number | null;
  resolved_by: number | null;
  created_at: string;
  resolved_at: string | null;
  status: string;
}

export const ALERT_TYPES = ["security", "inventory", "camera", "queue", "restricted_zone", "loitering", "occupancy", "other"];
export const ALERT_SEVERITIES = ["info", "warning", "critical"];

export interface AlertCreatePayload {
  store_id: number;
  alert_type: string;
  severity: string;
  message: string;
  camera_id?: number | null;
  zone_id?: number | null;
}

export interface SecurityDashboard {
  store_id: number | null;
  live_alert_count: number;
  unresolved_count: number;
  camera_status: { online: number; offline: number; total: number };
  occupancy_alert_count: number;
  recent_incidents: Alert[];
}

export const alertsApi = {
  list: (storeId?: number, isResolved?: boolean) =>
    api.get<Alert[]>("/alerts", {
      params: { ...(storeId ? { store_id: storeId } : {}), ...(isResolved !== undefined ? { is_resolved: isResolved } : {}) },
    }),
  live: (storeId?: number) => api.get<Alert[]>("/alerts/live", { params: storeId ? { store_id: storeId } : {} }),
  create: (payload: AlertCreatePayload) => api.post<Alert>("/alerts", payload),
  resolve: (id: number) => api.patch<Alert>(`/alerts/${id}/resolve`),
  security: (storeId?: number) =>
    api.get<SecurityDashboard>("/dashboard/security", { params: storeId ? { store_id: storeId } : {} }),
};
