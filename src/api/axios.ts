import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use relative URL when in browser, or environment variable if set
const getBaseURL = () => {
  // In production, you can set VITE_API_BASE_URL in .env
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  // Use relative URL which will be proxied by Vite dev server
  return '/api'
}

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
});

// Request interceptor to attach Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

