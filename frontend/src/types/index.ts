export type Role = 'STORE_MANAGER' | 'RETAIL_ANALYST' | 'MARKETING_MANAGER' | 'ADMINISTRATOR';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  store_id: string;
}

export interface StoreOption {
  id: string;
  name: string;
}

export interface HeatmapMatrixData {
  store_id: string;
  shelf_id?: string;
  layer_type: string;
  width: number;
  height: number;
  matrix: number[][];
  legend_min: number;
  legend_max: number;
}

export interface TrajectoryPointData {
  id: number;
  x: number;
  y: number;
  smoothed_x: number;
  smoothed_y: number;
  velocity: number;
  zone_id?: string;
  timestamp?: string;
}

export interface RecommendationItem {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  store_id: string;
  sku: string;
  shelf_id: string;
  action: string;
  reason: string;
  expected_conversion_uplift: number;
}
