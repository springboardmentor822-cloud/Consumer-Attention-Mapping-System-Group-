import { useQuery } from "@tanstack/react-query";
import { adminDashboardApi } from "../api/adminDashboard";

export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: () => adminDashboardApi.systemHealth().then((r) => r.data),
    refetchInterval: 5000,
  });
}

export function useAuditLogs(limit = 50) {
  return useQuery({
    queryKey: ["admin", "audit-logs", limit],
    queryFn: () => adminDashboardApi.auditLogs(limit).then((r) => r.data),
    refetchInterval: 15000,
  });
}
