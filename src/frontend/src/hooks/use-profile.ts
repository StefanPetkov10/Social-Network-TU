import { useQuery } from "@tanstack/react-query";
import { ProfileDto } from "@frontend/lib/types/profile";
import { profileService } from "@frontend/services/profile-service";


export function useProfile() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await profileService.getMyProfile();
      return data;
    },
  });
}

export const useProfileById = (userId: string) => {
    return useQuery({
        queryKey: ["user-profile-by-id", userId],
        queryFn: () => profileService.getProfileById(userId),
        // Хукът се активира само ако имаме ID
        enabled: !!userId && userId !== "", 
        // Запазваме данните свежи за малко, за да не правим излишни заявки при бързо връщане
        staleTime: 1000 * 60 * 5, // 5 минути
    });
};