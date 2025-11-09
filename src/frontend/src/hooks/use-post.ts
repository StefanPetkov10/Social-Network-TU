import api from "../lib/axios";

import { useQuery } from "@tanstack/react-query";

export function useMyPost() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/Posts");
      console.log("usePost data:", data);
      return data;
    },
  });
}
