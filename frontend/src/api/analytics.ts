import axios from 'axios';

const API_URL = 'http://localhost:8000/api/analytics';

// Setup axios interceptor to add auth token
const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('camst_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface KPIStats {
  total_foot_traffic: number;
  average_dwell_time_seconds: number;
  top_product: string;
  total_interactions: number;
  total_purchases: number;
  conversion_rate: number;
}

export interface HeatmapData {
  points: [number, number, number][]; // [x, y, value]
  max_val: number;
}

export interface Recommendation {
  id?: string;
  type?: string;
  recommendation_type?: string;
  title: string;
  description: string;
  reason?: string;
  supporting_metric?: string;
  expected_impact?: string;
  priority?: string;
  status?: string;
}

export interface ProductScore {
  product_id: string;
  product_name: string;
  score: number;
  metrics: {
    attention_duration: number;
    interaction_frequency: number;
    pickup_rate: number;
    conversion_rate: number;
    repeat_engagement: number;
  };
  raw_metrics: {
    attention_duration: number;
    interaction_frequency: number;
    pickup_count: number;
    purchase_count: number;
    repeat_views: number;
  };
}

export interface Segment {
  id: string;
  segment: string;
  confidence: number;
  metrics: any;
  reason: string;
}

export interface Journey {
  id: string;
  entry_point: string;
  exit_point: string;
  zones_visited: string[];
  total_dwell_time_seconds: number;
  path_length: number;
  conversion_status: boolean;
}

export const analyticsApi = {
  getKPIs: async (storeId: string): Promise<KPIStats> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/kpis`);
    return response.data;
  },

  getHeatmap: async (storeId: string, timeRangeHours: number = 24): Promise<HeatmapData> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/heatmap?time_range_hours=${timeRangeHours}`);
    return response.data;
  },

  getAttractiveness: async (storeId: string): Promise<ProductScore[]> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/attractiveness`);
    return response.data;
  },

  getRecommendations: async (storeId: string): Promise<Recommendation[]> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/recommendations`);
    return response.data;
  },

  getSegments: async (storeId: string): Promise<{ segments: Segment[], distribution: any }> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/segments`);
    return response.data;
  },

  getJourneys: async (storeId: string): Promise<{ journeys: Journey[], summary: any, transitions: any }> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/journeys`);
    return response.data;
  },

  getDwellTime: async (storeId: string): Promise<{ hourly: { hours: number[], values: number[] }, distribution: number[] }> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/dwell-time`);
    return response.data;
  },

  getTrafficFlow: async (storeId: string): Promise<{ hourly: { hours: number[], values: number[] }, daily: { days: string[], values: number[] } }> => {
    const response = await axiosInstance.get(`${API_URL}/${storeId}/traffic-flow`);
    return response.data;
  }
};
