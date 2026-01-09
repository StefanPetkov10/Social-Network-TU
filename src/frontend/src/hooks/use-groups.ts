import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { groupsService } from "@frontend/services/groups-service";
import { toast } from "sonner";

export const useFeedGroups = () => {
  return useInfiniteQuery({
    queryKey: ["groups-feed-infinite"],
    queryFn: ({ pageParam = undefined }) => {
        return groupsService.getGroupFeed(pageParam as string | undefined);
    },
    getNextPageParam: (lastPageResponse) => {
      return lastPageResponse.meta?.lastPostId || undefined;
    },
    
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 5,
  });
}