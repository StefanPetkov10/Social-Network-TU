import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { ProfileDto } from "@frontend/lib/types/profile";
import { ApiResponse } from "@frontend/lib/types/api"; 


export function useProfile() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/Profile/me");
      
      if (!data.success) {
        throw new Error("Failed to fetch user data");
      }
      return data.data as ProfileDto;
    },
  });
}
