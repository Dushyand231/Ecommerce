import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong. Please try again.';
    if (err.response?.status === 401) {
      const isAuthCall = err.config?.url?.includes('/auth/') || err.config?.url === '/auth/me';
      if (!isAuthCall) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    err.userMessage = message;
    return Promise.reject(err);
  }
);

export const isImageUrl = (src) => /^(https?:)?\/\//.test(src || '');
export default api;