import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuthStore } from "../stores/useAuthStore";
import { RegisterDto } from "@frontend/lib/types/auth";
import { ApiResponse } from "@frontend/lib/types/api";

interface LoginPayload {
  Identifier: string;
  Password: string;
}

interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
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
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation<ApiResponse<LoginResponseData>, Error, LoginPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<LoginResponseData>>("/api/Auth/login", payload);
      return data;
    },
    onSuccess: (response) => {
      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
      }
    },
  });
}

export function useRefreshToken() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation<ApiResponse<LoginResponseData>, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<LoginResponseData>>("/api/Auth/refresh");
      return data;
    },
    onSuccess: (response) => {
      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
      }
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<null>>("/api/Auth/logout");
      return data;
    },
    onSuccess: () => {
      logout();
    },
    onError: () => {
      logout();
    },
  });
}

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

interface RequestOtpResponse {
  sessionToken: string;
}

export function useForgotPasswordOtp() {
  return useMutation<ApiResponse<RequestOtpResponse>, Error, { email: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<RequestOtpResponse>>("/api/Auth/request-otp", payload);
      return data;
    }
  });
}

export function useVerifyForgotPasswordOTP() {
  return useMutation<ApiResponse<null>, Error, { sessionToken: string; code: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<null>>("/api/Auth/verify-otp", payload);
      return data;
    }
  });
}

export function useResendOTP() {
  return useMutation<ApiResponse<null>, Error, { sessionToken: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<null>>(
        "/api/Auth/resend-otp",
        payload
      );
      return data;
    },
  });
}

interface ResetPasswordPayload {
  sessionToken: string;
  newPassword: string;
  confirmNewPassword: string;
}

export function useResetPassword() {
  return useMutation<ApiResponse<null>, Error, ResetPasswordPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<null>>(
        "/api/Auth/reset-password",
        payload
      );
      return data;
    },
  });
}