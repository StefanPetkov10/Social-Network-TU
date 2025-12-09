import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@frontend/app/services/post-service";
import { PostDto } from "@frontend/lib/types/posts";
import { ApiResponse } from "@frontend/lib/types/api";

export const useUserPosts = (profileId: string) => {
  return useInfiniteQuery<ApiResponse<PostDto[]>, Error>({
    queryKey: ["posts", profileId],
    
    queryFn: async ({ pageParam = undefined }) => {
      return await postService.getUserPosts(profileId, pageParam as string | undefined);
    },
    getNextPageParam: (lastPageResponse) => {
      return lastPageResponse.meta?.lastPostId || undefined;
    },
    
    initialPageParam: undefined,
    enabled: !!profileId 
  });
};