import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { groupsService } from "@frontend/services/groups-service";
import { toast } from "sonner";
import { GroupPrivacy } from "@frontend/lib/types/enums";
import { CreateGroupDto, GroupDto } from "@frontend/lib/types/groups";
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "@frontend/lib/types/api";

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

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ( data: CreateGroupDto ) => {
             return groupsService.createGroup(data);
        },
    });
}

export const useMyGroups = () => {
  return useQuery({
    queryKey: ["my-groups"],
    queryFn: () => groupsService.getMyGroups(),
    staleTime: 1000 * 60 * 5,
  });
}

export const useGroupByName = (name: string) => {
  return useQuery({
    queryKey: ["group-by-name", name],
    queryFn: () => groupsService.getGroupByNmae(name),
    enabled: !!name,
    staleTime: 1000 * 60 * 5,});
}

export const useGroupPosts = (groupId: string) => {
  return useInfiniteQuery({
    queryKey: ["group-posts", groupId],
    queryFn: ({ pageParam = undefined }) => {
        return groupsService.getGroupPosts(groupId, pageParam as string | undefined);
    },
    getNextPageParam: (lastPageResponse) => {
      return lastPageResponse.meta?.lastPostId || undefined;
    },
    initialPageParam: undefined,
    enabled: !!groupId, 
  });
};

