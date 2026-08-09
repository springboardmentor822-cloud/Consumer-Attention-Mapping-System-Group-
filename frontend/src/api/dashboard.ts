import api from "./client";

export interface DashboardStats {
  totalStores: number;
  totalCameras: number;
  totalZones: number;
  activeCustomers: number;
  todayFootfall: number;
}

export const dashboardStatsApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
};

export interface LiveCustomerPoint {
  customer_id: number;
  camera_id: number;
  zone_id: number | null;
  x: number;
  y: number;
  timestamp: string;
}

export interface LiveDashboardResponse {
  active_customers: number;
  points: LiveCustomerPoint[];
  as_of: string | null;
  is_live: boolean;
}

export const liveDashboardApi = {
  live: (seconds = 60) => api.get<LiveDashboardResponse>("/dashboard/live", { params: { seconds } }),
};
