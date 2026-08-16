export type Role =
  | "administrator"
  | "store_manager"
  | "retail_analyst"
  | "marketing_manager";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Store {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone: string;
  floor_width_m?: number | null;
  floor_height_m?: number | null;
  max_capacity?: number | null;
  manager_id?: number | null;
  created_at: string;
}

export type CameraType = "cctv" | "webcam" | "ip_camera" | "rtsp" | "uploaded_video";
export type CameraStatus = "online" | "offline" | "error" | "configuring";

export interface Camera {
  id: number;
  store_id: number;
  zone_id?: number | null;
  name: string;
  camera_type: CameraType;
  status: CameraStatus;
  stream_url?: string | null;
  resolution_width?: number | null;
  resolution_height?: number | null;
  fps?: number | null;
  last_heartbeat_at?: string | null;
  created_at: string;
}

export type LiveCameraStatus = "connecting" | "online" | "offline";

export interface LiveCamera {
  id: string;
  name: string;
  status: LiveCameraStatus;
  person_count: number;
  last_update_ts: number;
  last_error?: string | null;
}

export type ShelfLevel = "bottom" | "middle" | "eye_level" | "top";

export interface Shelf {
  id: number;
  store_id: number;
  camera_id?: number | null;
  category_id?: number | null;
  name: string;
  aisle?: string | null;
  position_coordinates?: string | null;
  frame_bounding_box?: string | null;
  shelf_width_m?: number | null;
  shelf_height_m?: number | null;
  shelf_level: ShelfLevel;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  brand?: string | null;
  price?: number | null;
  category_id?: number | null;
  shelf_id?: number | null;
  image_url?: string | null;
  created_at: string;
}

export interface ShelfDwell {
  shelf_id: number;
  total_dwell_seconds: number;
  avg_dwell_seconds: number;
  view_count: number;
}

export interface StoreSummary {
  store_id: number;
  total_visitors: number;
  average_dwell_time_seconds: number;
  total_purchases: number;
  conversion_rate_percent: number;
  peak_hour: number | null;
  frequent_entry_zones: Record<string, number>;
  average_walking_distance_m: number;
  popular_zone_id: number | null;
  popular_zone_name: string | null;
}

export interface ProductRankingRow {
  product_id: number;
  product_name: string;
  interaction_count: number;
}

export interface Recommendation {
  id: number;
  store_id: number;
  shelf_id?: number | null;
  product_id?: number | null;
  recommendation_type: string;
  title: string;
  description: string;
  confidence_score?: number | null;
  is_dismissed: number;
  created_at: string;
}

export interface Notification {
  id: number;
  store_id?: number | null;
  notification_type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  is_read: number;
  created_at: string;
}

export type HeatmapType =
  | "traffic"
  | "shelf"
  | "product_attention"
  | "engagement_hotspot"
  | "movement"
  | "occupancy";

export interface Zone {
  id: number;
  store_id: number;
  name: string;
  description?: string | null;
  polygon_coordinates?: string | null;
  created_at: string;
}

export interface LiveTrackingPoint {
  session_id: string;
  camera_id: string;
  zone_id: string;
  track_id: string;
  floor_x: string;
  floor_y: string;
  norm_x: string;
  norm_y: string;
  norm_w?: string;
  norm_h?: string;
  zone_index: number;
  detection_confidence: string;
  timestamp: string;
}

export interface OccupancySnapshot {
  store_id: number;
  total: number;
  by_zone_index: Record<string, number>;
}

export interface Heatmap {
  id: number;
  store_id: number;
  camera_id?: number | null;
  heatmap_type: HeatmapType;
  period_start: string;
  period_end: string;
  data: string;
  generated_at: string;
}

export type ReportType =
  | "consumer_attention"
  | "product_engagement"
  | "shelf_performance"
  | "conversion"
  | "marketing";

export type ReportFormat = "pdf" | "excel";

export interface ReportItem {
  id: number;
  store_id: number;
  requested_by_id: number;
  report_type: ReportType;
  report_format: ReportFormat;
  period_start: string;
  period_end: string;
  file_path?: string | null;
  status: string;
  created_at: string;
  completed_at?: string | null;
}

export interface AttentionEvent {
  id: number;
  session_id: number;
  shelf_id?: number | null;
  product_id?: number | null;
  camera_id: number;
  start_time: string;
  end_time?: string | null;
  duration_seconds?: number | null;
  is_repeat_attention: number;
}

export interface ProductInteraction {
  id: number;
  session_id: number;
  product_id: number;
  attention_event_id?: number | null;
  interaction_type: "viewed" | "picked_up" | "returned" | "compared" | "purchased";
  timestamp: string;
}

export interface ProductAttractivenessScore {
  id: number;
  product_id: number;
  period_start: string;
  period_end: string;
  attention_duration_score: number;
  interaction_frequency_score: number;
  pickup_rate_score: number;
  conversion_rate_score: number;
  repeat_engagement_score: number;
  total_score: number;
  computed_at: string;
}

export interface ShopperSessionSummary {
  id: number;
  store_id: number;
  shopper_uid: string;
  entry_time: string;
  exit_time?: string | null;
  total_duration_seconds?: number | null;
  entry_zone_id?: number | null;
  exit_zone_id?: number | null;
  zones_visited_count: number;
  total_distance_m?: number | null;
  avg_velocity_mps?: number | null;
  segment: string;
}
