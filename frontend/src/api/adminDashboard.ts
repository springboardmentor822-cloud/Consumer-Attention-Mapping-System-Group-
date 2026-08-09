import api from "./client";

export interface SystemHealthResponse {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  process_count: number;
  uptime_seconds: number;
  api_status: string;
  db_status: string;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource: string | null;
  resource_id: number | null;
  severity: string;
  message: string;
}

export interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
}

const base = "/dashboard/admin";

export const adminDashboardApi = {
  systemHealth: () => api.get<SystemHealthResponse>(`${base}/system-health`),
  auditLogs: (limit = 50) => api.get<AuditLogsResponse>(`${base}/audit-logs`, { params: { limit } }),
};
