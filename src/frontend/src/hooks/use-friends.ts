import { useMutation, useQueryClient, useInfiniteQuery} from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { friendsService } from "@frontend/services/friends-service";
import { FriendRequest, FriendSuggestion } from "@frontend/lib/types/friends";
import { ApiResponse } from "@frontend/lib/types/api";
import { toast } from "sonner";

export const useFriendRequests = () => {
   return useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () =>  friendsService.getFriendRequests(),
     select: (response: ApiResponse<FriendRequest[]>) => response.data,
   });
}

export const useInfiniteSuggestions = () => {
  return useInfiniteQuery({
    queryKey: ["friend-suggestions-infinite"],
    queryFn: ({ pageParam = 0 }) => friendsService.getFriendSuggestions(pageParam as number, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta as { nextSkip: number; totalLoaded: number } | undefined;
      
      if (!lastPage.data || lastPage.data.length < 20 || (meta && meta.totalLoaded >= 100)) {
        return undefined;
      }
      return meta?.nextSkip;
    },
    select: (data) => data.pages.flatMap((page) => page.data),
  });
};

  export const useSendFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (profileId: string) => friendsService.sendFriendRequest(profileId),
      onSuccess: (response) => {
        if(!response.success) {
          toast.error("Грешка при изпращане на покана", {
            description: response.message || "Опитайте отново по-късно."
          });
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["friend-suggestions-infinite"] });
        toast.success("Поканата е изпратена успешно!");
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "Възникна неочаквана грешка.";
        toast.error("Грешка при изпращане на покана", { description: msg });
      }
    });
  }