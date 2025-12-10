// src/hooks/use-create-post.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { toast } from "sonner";
import { ApiResponse } from "@frontend/lib/types/api";

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<ApiResponse<any>>("/api/Posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (response) => {
      if (!response.success) {
        toast.error("Грешка при качване", {
          description: response.message || "Невалиден тип файл.",
        });
        return; 
      }
      toast.success("Успех!", { description: "Постът е публикуван успешно." });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Възникна неочаквана грешка.";
      toast.error("Грешка", { description: msg });
    },
  });
}