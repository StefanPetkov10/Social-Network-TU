import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { friendsService } from "@frontend/services/friends-service";
import { toast } from "sonner";

export const useInfiniteFriendRequests = () => {
  return useInfiniteQuery({
    queryKey: ["friend-requests-infinite"],
    queryFn: ({ pageParam = null }) => friendsService.getFriendRequests(pageParam as string | null, 10),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.meta?.nextCursor ?? undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data),
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
      if (!lastPage.data || lastPage.data.length < 20 || (meta && meta.totalLoaded >= 100)) {
        return undefined;
      }
      return meta?.nextSkip;
    },
    select: (data) => data.pages.flatMap((page) => page.data),
  });
};

export const useInfiniteFriends = (profileId: string) => {
  return useInfiniteQuery({
    queryKey: ["my-friends-infinite", profileId],
    queryFn: ({ pageParam = null }) => {
      return friendsService.getFriendsList(profileId, pageParam as string | null, 10);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.meta?.nextCursor ?? undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data),
  });
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
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions-infinite"] });
      toast.success("Поканата е изпратена успешно!");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Възникна неочаквана грешка.";
      toast.error("Грешка", { description: msg });
    }
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pendingRequestId: string) => friendsService.acceptFriendRequest(pendingRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["my-friends-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions-infinite"] });
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
      queryClient.invalidateQueries({ queryKey: ["friend-requests-infinite"] });
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
    mutationFn: (profileId: string) => {
      return friendsService.removeFriend(profileId);},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-friends-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions-infinite"] });
      toast.success("Приятелят е премахнат.");
    },
    onError: () => {
      toast.error("Грешка при премахване.");
    }
  });
};