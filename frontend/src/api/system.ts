import axios from 'axios';

const API_URL = 'http://localhost:8000/api/system';

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('camst_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_stores: number;
  total_cameras: number;
  cameras_online: number;
  cameras_offline: number;
  open_alerts: number;
  users_by_role: Record<string, number>;
}

export const systemApi = {
  getStats: async (): Promise<SystemStats> => {
    const response = await axiosInstance.get(`${API_URL}/stats`);
    return response.data;
  }
};

export const auditApi = {
  getLogs: async (limit: number = 100): Promise<any[]> => {
    const response = await axiosInstance.get(`http://localhost:8000/api/audit-logs?limit=${limit}`);
    return response.data;
  }
};
