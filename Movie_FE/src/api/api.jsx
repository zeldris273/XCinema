import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5116',
  withCredentials: true, 
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.warn('No access token for:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('Error from:', error.config?.url, 'status:', error.response?.status, 'data:', error.response?.data);
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          console.log('Attempting to refresh token for:', error.config.url);
          const response = await api.post('/api/auth/refresh-token', {}, {
            withCredentials: true
          });
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          onRefreshed(accessToken);
          console.log('Token refreshed:', accessToken.substring(0, 20) + '...');
        } catch (refreshError) {
          console.error('Refresh failed:', error.config.url, refreshError.response?.data || refreshError.message);
          localStorage.removeItem('accessToken');
          window.location.href = '/auth';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;