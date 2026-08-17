import axios from 'axios';
import { Recommendation } from './analytics';

const API_URL = 'http://localhost:8000/api/recommendations';

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('camst_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const recommendationsApi = {
  getRecommendations: async (storeId?: string): Promise<Recommendation[]> => {
    const params = storeId ? { store_id: storeId } : {};
    const response = await axiosInstance.get(API_URL, { params });
    return response.data;
  }
};
