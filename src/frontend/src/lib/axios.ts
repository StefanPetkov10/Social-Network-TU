import axios, { AxiosError } from "axios";
import { useAuthStore } from "@frontend/stores/useAuthStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  pendingQueue = [];
}

export const refreshAuthToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post<{ success: boolean; data: { accessToken: string } }>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Auth/refresh`,
        {},
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );

      if (data.success && data.data?.accessToken) {
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        resolve(newToken);
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error) {
      processQueue(error, null);
      useAuthStore.getState().logout();
      const isOnAuthPage = typeof window !== "undefined" && window.location.pathname.startsWith("/auth");
      if (!isOnAuthPage && typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      reject(error);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/api/Auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers!.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAuthToken();
      if (newToken) {
        originalRequest.headers!.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }

    return Promise.reject(error);
  }
);

export default api;