import { useQuery } from "@tanstack/react-query";
import { liveDashboardApi } from "../api/dashboard";

export function useLiveDashboard(seconds = 60) {
  return useQuery({
    queryKey: ["dashboard", "live", seconds],
    queryFn: () => liveDashboardApi.live(seconds).then((r) => r.data),
    refetchInterval: 5000,
  });
}
