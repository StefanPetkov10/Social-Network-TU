import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuthStore } from "../stores/useAuthStore";
import { RegisterDto } from "@frontend/lib/types/auth";
import { ApiResponse } from "@frontend/lib/types/api"; 

interface LoginPayload {
  Identifier: string;
  Password: string;
}

export function useRegister() {
  return useMutation<ApiResponse<null>, Error, RegisterDto>({
    mutationFn: async (payload: RegisterDto) => {
      const { data } = await api.post<ApiResponse<null>>("/api/Auth/register", payload);
      return data;
    },
  });
}

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);

  return useMutation<ApiResponse<string>, Error, LoginPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<string>>("/api/Auth/login", payload);
      console.log("Login response data:", data);
      return data;
    },
    onSuccess: (response) => {
      console.log("Login response token:", response.data);
      if (response.success && response.data) {
        setToken(response.data);
      }
    },
  });
}

/*export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<null>>("/api/Auth/logout");
      logout();
      return data;
    },
  });
}*/

export function useConfirmEmail() {
  return useMutation<ApiResponse<null>, Error, { userId: string; token: string }>({
    mutationFn: async (params) => {
      const { data } = await api.get<ApiResponse<null>>("/api/Auth/confirmemail", { params });
      return data;
    },
  });
}

export function useResendConfirmation() {
  return useMutation<ApiResponse<null>, Error, { email: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<null>>("/api/Auth/resend-confirmation", payload);
      return data;
    },
  });
}
