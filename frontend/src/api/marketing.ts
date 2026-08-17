import axios from 'axios';

const API_URL = 'http://localhost:8000/api/marketing';

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('camst_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Campaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  metrics: any;
}

export interface Promotion {
  id: string;
  name: string;
  promotion_type: string;
  discount_percent: number;
  is_active: boolean;
  views: number;
  interactions: number;
  conversions: number;
  start_date: string;
  end_date: string | null;
}

export const marketingApi = {
  getCampaigns: async (storeId?: string): Promise<Campaign[]> => {
    const params = storeId ? { store_id: storeId } : {};
    const response = await axiosInstance.get(`${API_URL}/campaigns`, { params });
    return response.data;
  },

  getPromotions: async (storeId?: string): Promise<Promotion[]> => {
    const params = storeId ? { store_id: storeId } : {};
    const response = await axiosInstance.get(`${API_URL}/promotions`, { params });
    return response.data;
  },

  getEngagement: async (storeId?: string): Promise<{ total_sessions: number, sessions_with_interaction: number, engagement_rate: number, repeat_rate: number }> => {
    const params = storeId ? { store_id: storeId } : {};
    const response = await axiosInstance.get(`${API_URL}/engagement`, { params });
    return response.data;
  }
};
