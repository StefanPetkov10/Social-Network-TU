import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { followersService } from "@frontend/services/followers-servise";
import { toast } from "sonner";

export const useInfiniteFollowers = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["followers-list", profileId],
        queryFn: ({ pageParam = null }) => {
            return followersService.getMyFollowers(pageParam as string | null, 20);
        },
        initialPageParam: null,
        getNextPageParam: (lastPage) => {
            return lastPage.meta?.nextCursor ?? undefined;
        },
        select: (data) => data.pages.flatMap((page) => page.data),
    });
}

export const useInfiniteFollowing = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["following-list", profileId],
        queryFn: ({ pageParam = null }) => {
            return followersService.getMyFollowing(pageParam as string | null, 20);
        },
        initialPageParam: null,
        getNextPageParam: (lastPage) => {
            return lastPage.meta?.nextCursor ?? undefined;
        },
        select: (data) => data.pages.flatMap((page) => page.data),
    });
}

export const useInfiniteFollowerSuggestions = () => {
    return useInfiniteQuery({
        queryKey: ["follower-suggestions"],
        queryFn: ({ pageParam = 0 }) => {
            return followersService.getFollowSuggestions(pageParam as number, 10);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            return lastPage.meta?.nextCursor ?? undefined;
        },
        select: (data) => data.pages.flatMap((page) => page.data),
    });
}

export const useFollowUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) => followersService.followUser(profileId),
        onSuccess: () => {
            toast.success("Успешно последване на потребителя!");
            queryClient.invalidateQueries({ queryKey: ["followers-list"] });
            queryClient.invalidateQueries({ queryKey: ["following-list"] });
        },
        onError: (error: any) => {
            toast.error("Грешка при последване на потребителя.", { description: error.message });
        },
    });
}

export const useRemoveFollower = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) => followersService.unfollowUser(profileId),
        onSuccess: () => {
            toast.success("Успешно премахване на последовател!");
            queryClient.invalidateQueries({ queryKey: ["followers-list"] });
            queryClient.invalidateQueries({ queryKey: ["following-list"] });
        },
        onError: (error: any) => {
            toast.error("Грешка при премахване на последовател.", { description: error.message });
        },
    });
}