import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuthStore } from "../stores/useAuthStore";

type ApiResponse<T = any> = T;

interface LoginPayload {
  Identifier: string;
  Password: string;
}

export function useRegister() {
  return useMutation<ApiResponse, Error, any>({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/api/Auth/register", payload);
      return data;
    },
  });
}

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);

  return useMutation<ApiResponse, Error, LoginPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/Auth/login", payload);
      return data;
    },
    onSuccess: (data) => {
      if (data?.data) {
        setToken(data.data);
      }
    },
  });
}

/*export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      await api.post("/api/Auth/logout");
      logout();
    },
  });
}*/

export function useConfirmEmail() {
  return useMutation<ApiResponse, Error, { userId: string; token: string }>({
    mutationFn: async (params) => {
      const { data } = await api.get("/api/Auth/confirmemail", { params });
      return data;
    },
  });
}

export function useResendConfirmation() {
  return useMutation<ApiResponse, Error, { email: string }>({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await api.post("/api/Auth/resend-confirmation", payload);
      return data;
    },
  });
}