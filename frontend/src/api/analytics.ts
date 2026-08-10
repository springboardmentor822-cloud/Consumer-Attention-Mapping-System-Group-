import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1/analytics';

export interface KPIStats {
  total_foot_traffic: number;
  average_dwell_time_seconds: number;
  top_product: string;
}

export interface HeatmapData {
  points: [number, number, number][]; // [x, y, value]
  max_val: number;
}

export interface Recommendation {
  type: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
}

export const analyticsApi = {
  getKPIs: async (storeId: string): Promise<KPIStats> => {
    const response = await axios.get(`${API_URL}/${storeId}/kpis`);
    return response.data;
  },

  getHeatmap: async (storeId: string, timeRangeHours: number = 24): Promise<HeatmapData> => {
    const response = await axios.get(`${API_URL}/${storeId}/heatmap?time_range_hours=${timeRangeHours}`);
    return response.data;
  },

  getRecommendations: async (storeId: string): Promise<Recommendation[]> => {
    const response = await axios.get(`${API_URL}/${storeId}/recommendations`);
    return response.data;
  }
};
