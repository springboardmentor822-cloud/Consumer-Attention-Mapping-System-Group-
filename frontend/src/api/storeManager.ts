import api from "./client";

export interface StoreManagerSummary {
  store_id: number;
  today_visitors: number;
  current_customers: number;
  avg_dwell_time_seconds: number;
  conversion_rate: number | null;
  shelf_engagement_proxy: number;
  online_cameras: number;
  total_cameras: number;
}

export interface CameraStatusItem {
  camera_id: number;
  camera_name: string;
  camera_location: string;
  status: string;
  zone_id: number | null;
  zone_name: string | null;
  latest_people_count: number;
  snapshot_url: string | null;
  video_url: string | null;
  live_stream_url: string | null;
}

export interface CameraStatusResponse {
  store_id: number;
  cameras: CameraStatusItem[];
}

export interface HourlyVisitorPoint {
  hour: number;
  visitors: number;
}

export interface VisitorsByHourResponse {
  store_id: number;
  points: HourlyVisitorPoint[];
}

export interface ZoneVisitorPoint {
  zone_id: number;
  zone_name: string;
  visitors: number;
}

export interface VisitorsByZoneResponse {
  store_id: number;
  points: ZoneVisitorPoint[];
}

export interface ShelfActivityItem {
  shelf_id: number;
  shelf_name: string;
  zone: string;
  camera_id: number | null;
  activity_proxy: number;
}

export interface ShelfActivityResponse {
  store_id: number;
  shelves: ShelfActivityItem[];
}

export interface AlertItem {
  severity: string;
  message: string;
  camera_id: number | null;
  zone_id: number | null;
}

export interface AlertsResponse {
  store_id: number;
  alerts: AlertItem[];
}

export interface ActivityItem {
  timestamp: string;
  message: string;
  camera_id: number | null;
  zone_id: number | null;
}

export interface ActivitiesResponse {
  store_id: number;
  activities: ActivityItem[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  weight: number;
}

export interface HeatmapDataResponse {
  camera_id: number | null;
  zone_id: number | null;
  total_points: number;
  points: HeatmapPoint[];
}

export interface QueueCounterItem {
  zone_id: number;
  zone_name: string;
  current_length: number;
  average_wait_seconds: number;
  is_busy: boolean;
}

export interface QueueResponse {
  store_id: number;
  counters: QueueCounterItem[];
  busy_threshold: number;
  note: string;
}

const base = "/dashboard/store-manager";

function storeParams(storeId?: number) {
  return storeId ? { store_id: storeId } : {};
}

export const storeManagerApi = {
  summary: (storeId?: number) => api.get<StoreManagerSummary>(`${base}/summary`, { params: storeParams(storeId) }),
  cameras: (storeId?: number) => api.get<CameraStatusResponse>(`${base}/cameras`, { params: storeParams(storeId) }),
  visitorsByHour: (storeId?: number) =>
    api.get<VisitorsByHourResponse>(`${base}/visitors-by-hour`, { params: storeParams(storeId) }),
  visitorsByZone: (storeId?: number) =>
    api.get<VisitorsByZoneResponse>(`${base}/visitors-by-zone`, { params: storeParams(storeId) }),
  shelfActivity: (storeId?: number) =>
    api.get<ShelfActivityResponse>(`${base}/shelf-activity`, { params: storeParams(storeId) }),
  alerts: (storeId?: number) => api.get<AlertsResponse>(`${base}/alerts`, { params: storeParams(storeId) }),
  activities: (storeId?: number) => api.get<ActivitiesResponse>(`${base}/activities`, { params: storeParams(storeId) }),
  heatmap: (storeId?: number, zoneId?: number) =>
    api.get<HeatmapDataResponse>("/dashboard/heatmap-data", {
      params: { ...storeParams(storeId), ...(zoneId ? { zone_id: zoneId } : {}) },
    }),
  queue: (storeId?: number) => api.get<QueueResponse>(`${base}/queue`, { params: storeParams(storeId) }),
};
