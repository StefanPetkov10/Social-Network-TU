import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { friendsService } from "@frontend/services/friends-service";
import { toast } from "sonner";

export const useInfiniteFriendRequests = () => {
  return useInfiniteQuery({
    queryKey: ["friend-requests-infinite"],
    queryFn: ({ pageParam = null }) => friendsService.getFriendRequests(pageParam as string | null, 10),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    refetchInterval: 5000, 
  });
};

export const useInfiniteSuggestions = () => {
  return useInfiniteQuery({
    queryKey: ["friend-suggestions-infinite"],
    queryFn: ({ pageParam = 0 }) => friendsService.getFriendSuggestions(pageParam as number, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta as { nextSkip: number; totalLoaded: number } | undefined;
      if (!lastPage.data || lastPage.data.length === 0 || (meta && meta.totalLoaded >= 100)) {
        return undefined;
      }
      return meta?.nextSkip;
    },
  });
};

export const useInfiniteFriends = (profileId: string) => {
  return useInfiniteQuery({
    queryKey: ["my-friends-infinite", profileId],
    queryFn: ({ pageParam }) => friendsService.getFriendsList(profileId, pageParam, 20),
    initialPageParam: { lastFriendId: null, lastFriendshipDate: null } as { lastFriendId: any; lastFriendshipDate: any } | null,
    
    getNextPageParam: (lastPage) => {
        const meta = lastPage.meta as any;
        
        if (!meta?.lastFriendshipDate || !meta?.lastFriendId) return undefined;
        
        return { 
            lastFriendId: meta.lastFriendId,
            lastFriendshipDate: meta.lastFriendshipDate
        };
    },
  });
};

const invalidateFriendRelatedQueries = (queryClient: any) => {
     queryClient.invalidateQueries({ queryKey: ["friend-suggestions-infinite"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests-infinite"] });
    queryClient.invalidateQueries({ queryKey: ["my-friends-infinite"] });
    
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    
    queryClient.invalidateQueries({ queryKey: ["reactors"] });

    queryClient.invalidateQueries({ queryKey: ["group-members"] });
    queryClient.invalidateQueries({ queryKey: ["group-admins"] });
    queryClient.invalidateQueries({ queryKey: ["group-friends"] });
    queryClient.invalidateQueries({ queryKey: ["group-mutual-friends"] });

    queryClient.invalidateQueries({ queryKey: ["user-profile-by-username"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] }); 
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => friendsService.sendFriendRequest(profileId),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error("Грешка", { description: response.message });
        return;
      }
      invalidateFriendRelatedQueries(queryClient);
      toast.success("Поканата е изпратена успешно!");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Възникна неочаквана грешка.";
      toast.error("Грешка", { description: msg });
    }
  });
};

export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addresseeId: string) => friendsService.cancelFriendRequest(addresseeId),
    onSuccess: () => {
      invalidateFriendRelatedQueries(queryClient);
      toast.success("Поканата е отменена.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Грешка при отмяна.";
      toast.error(msg);
    }
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pendingRequestId: string) => friendsService.acceptFriendRequest(pendingRequestId),
    onSuccess: () => {
      invalidateFriendRelatedQueries(queryClient);
      toast.success("Успешно приехте поканата!");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Грешка при приемане.";
      toast.error(msg);
    }
  });
};

export const useDeclineFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pendingRequestId: string) => friendsService.declineFriendRequest(pendingRequestId),
    onSuccess: () => {
      invalidateFriendRelatedQueries(queryClient);
      toast.success("Поканата е отхвърлена.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Грешка при отхвърляне.";
      toast.error(msg);
    }
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => friendsService.removeFriend(profileId),
    onSuccess: () => {
      invalidateFriendRelatedQueries(queryClient);
      toast.success("Приятелят е премахнат.");
    },
    onError: () => {
      toast.error("Грешка при премахване.");
    }
  });
};