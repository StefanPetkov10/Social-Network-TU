import { create } from "zustand";
import api from "@frontend/lib/axios";

interface AuthState {
  accessToken: string | null;
  isInitializing: boolean;
  setAccessToken: (token: string | null) => void;
  setInitializing: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isInitializing: true,

  setAccessToken: (token) => {
    set({ accessToken: token });
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  },

  setInitializing: (value) => set({ isInitializing: value }),

  logout: () => {
    set({ accessToken: null });
    delete api.defaults.headers.common["Authorization"];
  },
}));

export const initAuthInterceptor = () => () => { };