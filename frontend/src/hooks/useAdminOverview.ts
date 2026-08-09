import { useQuery } from "@tanstack/react-query";
import { dashboardStatsApi } from "../api/dashboard";
import { authApi, camerasApi } from "../api/resources";

export function useAdminOverview() {
  const stats = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardStatsApi.stats().then((r) => r.data),
    refetchInterval: 15000,
  });
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => authApi.users().then((r) => r.data),
    refetchInterval: 30000,
  });
  const cameras = useQuery({
    queryKey: ["admin", "cameras"],
    queryFn: () => camerasApi.list().then((r) => r.data),
    refetchInterval: 15000,
  });

  return { stats, users, cameras };
}
