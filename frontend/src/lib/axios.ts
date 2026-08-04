import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attention_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Authentication failures / JWT refreshes
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Automatically intercept 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Perform token clean up if auth fails or expires
      localStorage.removeItem('attention_token');
      localStorage.removeItem('attention_user');
      
      // Redirect to login page in clean way
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
