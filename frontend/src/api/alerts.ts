import axios from 'axios';

const API_URL = 'http://localhost:8000/api/alerts';

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('camst_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Alert {
  id: string;
  store_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface AlertStats {
  total: number;
  open: number;
  critical: number;
  warning: number;
  resolved: number;
}

export const alertsApi = {
  getAlerts: async (storeId?: string, status?: string): Promise<{ alerts: Alert[], stats: AlertStats }> => {
    const params: any = {};
    if (storeId) params.store_id = storeId;
    if (status) params.alert_status = status;
    
    const response = await axiosInstance.get(API_URL, { params });
    return response.data;
  },

  acknowledgeAlert: async (alertId: string): Promise<Alert> => {
    const response = await axiosInstance.post(`${API_URL}/${alertId}/acknowledge`);
    return response.data;
  }
};
