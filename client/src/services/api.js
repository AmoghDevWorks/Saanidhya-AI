import axios from 'axios';

/**
 * Saanidhya AI API Client
 * Centralized Axios instance configured with VITE_API_URL and interceptors.
 * Handles automatic Bearer token injection and centralized 401 session clearing.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach bearer token when available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saanidhya_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized or network dropouts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user on 401 Unauthorized
      localStorage.removeItem('saanidhya_auth_token');
      localStorage.removeItem('saanidhya_user');
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to extract human-readable error messages from FastAPI/Axios error responses
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      // Pydantic validation error array
      return detail.map((d) => d.msg || d.message).join(', ');
    }
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message === 'Network Error') {
    return 'Unable to connect to the Saanidhya AI backend server. Please make sure the FastAPI server is running at http://localhost:8000.';
  }
  return error.message || 'An unexpected error occurred. Please try again.';
};

export default api;
