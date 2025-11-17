import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";
import { ApiResponse } from "@frontend/lib/types/api";
import { ChangePasswordDto } from "@frontend/lib/types/profile";

export function useChangePassword() {
  return useMutation<ApiResponse<null>, Error, ChangePasswordDto>({
    mutationFn: async (payload: ChangePasswordDto) => {
      const { data } = await api.post<ApiResponse<null>>("/api/User/change-password", payload);
      return data;
    },
  });
}