import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { groupsService } from "@frontend/services/groups-service";
import { toast } from "sonner";
import { GroupPrivacy } from "@frontend/lib/types/enums";
import { CreateGroupDto, GroupDto, UpdateGroupDto } from "@frontend/lib/types/groups";
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "@frontend/lib/types/api";
import { useRouter } from "next/dist/client/components/navigation";

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
        onSuccess: (data: ApiResponse<GroupDto>) => {
           queryClient.invalidateQueries({ queryKey: ["groups-discover"] }); 
           queryClient.invalidateQueries({ queryKey: ["my-groups"] });
           toast.success("Групата е създадена успешно!");
        }
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
    queryFn: () => groupsService.getGroupByName(name),
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
  });
}

export const useDiscoverGroups = () => {
  return useInfiniteQuery({
    queryKey: ["groups-discover"],
    queryFn: ({ pageParam = undefined }) => {
        return groupsService.getDiscoverGroups(pageParam);
    },
    getNextPageParam: (lastPageResponse) => {
      if (lastPageResponse.data && lastPageResponse.data.length > 0) {
          return lastPageResponse.data[lastPageResponse.data.length - 1].id;
      }
      return undefined;
    },
    initialPageParam: undefined as unknown as string | undefined,
    staleTime: 1000 * 60 * 5,
  });
};

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

export const useUpdateGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, data }: { groupId: string, data: UpdateGroupDto }) => 
             groupsService.updateGroup(groupId, data),
        onSuccess: (response, variables) => {
           toast.success("Групата е обновена успешно!");
           
          // queryClient.invalidateQueries({ queryKey: ["group-by-name"] }); 
           queryClient.invalidateQueries({ queryKey: ["my-groups"] });
           queryClient.invalidateQueries({ queryKey: ["groups-discover"] });
        },
    });
}

export const useDeleteGroup = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (groupId: string) => groupsService.deleteGroup(groupId),
        onSuccess: () => {
            toast.success("Групата е изтрита", { description: "Групата и цялото ѝ съдържание бяха премахнати успешно." });
            
            queryClient.invalidateQueries({ queryKey: ["my-groups"] });
            queryClient.invalidateQueries({ queryKey: ["groups-discover"] });
            
            router.push("/groups/my-groups"); 
        },
        onError: (error: any) => {
            toast.error("Възникна грешка при изтриването на групата.");
        }
    });
};

