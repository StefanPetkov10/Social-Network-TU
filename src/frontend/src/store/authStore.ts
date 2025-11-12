import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "axios";

type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
        token: null,

        setToken: (token) => {
        set({ token });
        
         if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          try {
            sessionStorage.setItem("token", token);
          } catch {}
        } else {
          delete api.defaults.headers.common["Authorization"];
          try {
            sessionStorage.removeItem("token");
          } catch {}
        }
      },

      logout: () => {
        set({ token: null });
        delete api.defaults.headers.common["Authorization"];
        try {
          sessionStorage.removeItem("token");
        } catch {}
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);          

export const initAuthInterceptor = () => {
  const currentToken = useAuthStore.getState().token;
  if (currentToken) {
    api.defaults.headers.common["Authorization"] = `Bearer ${currentToken}`;
  }

  const unsubscribe = useAuthStore.subscribe((state) => {
    const token = state.token;
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  });

  return unsubscribe;
};