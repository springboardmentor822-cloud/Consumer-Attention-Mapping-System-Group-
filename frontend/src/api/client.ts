import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  getSystemStatus: () => apiClient.get('/system/status').then(r => r.data),
  
  // Auth & User Management
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }).then(r => r.data),
  getMe: () => apiClient.get('/auth/me').then(r => r.data),
  getUsers: () => apiClient.get('/auth/users').then(r => r.data),
  deleteUser: (userId: string) => apiClient.delete(`/auth/users/${userId}`).then(r => r.data),
  purgeUnauthorizedUsers: () => apiClient.post('/auth/users/purge-unauthorized').then(r => r.data),

  // Ingestion & Sessions
  getSessions: (storeId: string) => 
    apiClient.get(`/sessions?store_id=${storeId}`).then(r => r.data),
  ingestSession: (payload: any) => 
    apiClient.post('/sessions/ingestion/session', payload).then(r => r.data),

  // Analytics & Trajectories
  getTrajectoryPoints: (sessionId: string) => 
    apiClient.get(`/analytics/trajectory?session_id=${sessionId}`).then(r => r.data),
  getSegmentAnalytics: (storeId: string) => 
    apiClient.get(`/analytics/segments?store_id=${storeId}`).then(r => r.data),
  getProductAttractiveness: (storeId: string, category?: string) => 
    apiClient.get(`/analytics/attractiveness?store_id=${storeId}${category ? `&category=${category}` : ''}`).then(r => r.data),

  // Heatmaps
  getStoreHeatmap: (storeId: string, layer: string = 'TRAFFIC', segment?: string) => 
    apiClient.get(`/heatmaps/store?store_id=${storeId}&layer=${layer}${segment ? `&segment=${segment}` : ''}`).then(r => r.data),
  getShelfHeatmap: (shelfId: string) => 
    apiClient.get(`/heatmaps/shelf?shelf_id=${shelfId}`).then(r => r.data),
  submitCalibration: (camera_id: string, source_points: number[][], destination_points: number[][]) =>
    apiClient.post('/heatmaps/calibration', { camera_id, source_points, destination_points }).then(r => r.data),

  // Recommendations & Products
  getRecommendations: (storeId: string) => 
    apiClient.get(`/recommendations?store_id=${storeId}`).then(r => r.data),
  getProducts: () => apiClient.get('/products').then(r => r.data),
  createProduct: (product: any) => apiClient.post('/products', product).then(r => r.data),
  getCampaigns: (storeId: string) => apiClient.get(`/campaigns?store_id=${storeId}`).then(r => r.data),

  // Role-Specific Dashboards
  getStoreManagerDashboard: (storeId: string) => 
    apiClient.get(`/dashboard/store?store_id=${storeId}`).then(r => r.data),
  getAnalystDashboard: (storeId: string) => 
    apiClient.get(`/dashboard/analyst?store_id=${storeId}`).then(r => r.data),
  getMarketingDashboard: (storeId: string) => 
    apiClient.get(`/dashboard/marketing?store_id=${storeId}`).then(r => r.data),
  getAdminDashboard: (storeId: string) => 
    apiClient.get(`/dashboard/admin?store_id=${storeId}`).then(r => r.data),

  // Notification & Alert Engine
  getAlerts: (storeId: string = 'STORE-812', type?: string, level?: string) => 
    apiClient.get(`/alerts?store_id=${storeId}${type ? `&type=${type}` : ''}${level ? `&level=${level}` : ''}`).then(r => r.data),
  triggerAlert: (payload: any) => 
    apiClient.post('/alerts/trigger', payload).then(r => r.data),
  acknowledgeAlert: (alertId: string) => 
    apiClient.post(`/alerts/${alertId}/acknowledge`).then(r => r.data),

  // Reports & Export System
  exportReport: (storeId: string = 'STORE-812', reportType: string = 'daily', format: string = 'csv', startDate?: string, endDate?: string, zoneId?: string) =>
    apiClient.get(`/reports/export?store_id=${storeId}&report_type=${reportType}&format=${format}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}${zoneId ? `&zone_id=${zoneId}` : ''}`, {
      responseType: format === 'csv' ? 'blob' : 'json'
    }).then(r => r.data),
};

