import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // When accessed from another device (via IP or custom domain)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const protocol = window.location.protocol;
      const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
      if (envUrl) {
        try {
          const parsed = new URL(envUrl);
          parsed.hostname = hostname;
          parsed.protocol = protocol;
          return parsed.toString().replace(/\/$/, '');
        } catch (_) {}
      }
      return `${protocol}//${hostname}:8000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      // Keep baseURL in sync with current accessed host if needed
      const currentDynamicUrl = getApiBaseUrl();
      if (config.baseURL !== currentDynamicUrl) {
        config.baseURL = currentDynamicUrl;
      }

      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (config.headers && !config.headers['Accept']) {
      config.headers['Accept'] = 'application/json';
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        if (typeof (config.headers as any).delete === 'function') {
          (config.headers as any).delete('Content-Type');
          (config.headers as any).delete('content-type');
        } else {
          delete (config.headers as any)['Content-Type'];
          delete (config.headers as any)['content-type'];
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${getApiBaseUrl()}/auth/refresh`, { refreshToken });
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);

        processQueue(null, data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
