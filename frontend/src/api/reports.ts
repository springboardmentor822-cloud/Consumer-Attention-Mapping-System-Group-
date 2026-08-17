import axios from 'axios';

const API_URL = 'http://localhost:8000/api/reports';

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('camst_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Report {
  id: string;
  name: string;
  report_type: string;
  format: string;
  status: string;
  created_at: string;
}

export const reportsApi = {
  getReports: async (storeId?: string): Promise<Report[]> => {
    const params = storeId ? { store_id: storeId } : {};
    const response = await axiosInstance.get(API_URL, { params });
    return response.data;
  },

  generateReport: async (reportType: string, format: string = 'pdf', storeId?: string): Promise<Report> => {
    const response = await axiosInstance.post(`${API_URL}/generate`, {
      report_type: reportType,
      format,
      store_id: storeId
    });
    return response.data;
  },

  downloadReport: async (reportId: string): Promise<void> => {
    const response = await axiosInstance.get(`${API_URL}/${reportId}/download`, {
      responseType: 'blob'
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header if possible, else generic name
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `report_${reportId}.pdf`;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2)
        fileName = fileNameMatch[1];
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
