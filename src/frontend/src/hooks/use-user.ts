import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/Auth/me");
      return data;
    },
  });
}
