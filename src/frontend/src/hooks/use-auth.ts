import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";

type ApiResponse<T = any> = T;

export function useRegister() {
  return useMutation<ApiResponse, Error, any>({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/api/Auth/register", payload);
      return data;
    },
  });
}

export function useLogin() {
  return useMutation<ApiResponse, Error, { Identifier: string; Password: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/Auth/login", payload);
      return data;
    },
  });
}

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