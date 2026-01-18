import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postService } from "@frontend/services/post-service";
import { PostDto } from "@frontend/lib/types/posts";
import { ApiResponse } from "@frontend/lib/types/api";
import { useProfile } from "@frontend/hooks/use-profile";
import { MediaTypeGroup } from "@frontend/lib/types/enums";

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  const { data: userProfile } = useProfile();
  const myProfileId = userProfile?.id;

  return useMutation({
    mutationFn: (formData: FormData) => postService.createPost(formData),

    onSuccess: (response, formData) => {
      if (!response.success) {
        toast.error("Грешка при качване", {
          description: response.message || "Невалиден тип файл.",
        });
        return; 
      }
      toast.success("Успех!", { description: "Постът е публикуван успешно." });
      
      const groupId = (formData.get("GroupId") || formData.get("groupId"))?.toString();
      
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });

      if (groupId && groupId !== "undefined" && groupId !== "null") {
          queryClient.invalidateQueries({ queryKey: ["groups-feed-infinite"]});
          queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
          queryClient.invalidateQueries({ queryKey: ["group-media", groupId] });
      } else {
          if (myProfileId) {
              queryClient.invalidateQueries({ queryKey: ["posts"] }); 
              queryClient.invalidateQueries({ queryKey: ["posts", myProfileId] });
              queryClient.invalidateQueries({ queryKey: ["profile-media", myProfileId] });
          }
      }
    },
  });
};

export const useFeedPosts = () => {
  return useInfiniteQuery<ApiResponse<PostDto[]>, Error>({
    queryKey: ["posts", "feed"],
    queryFn: async ({ pageParam = undefined }) => {
      return await postService.getFeed(pageParam as string | undefined);
    },
    getNextPageParam: (lastPageResponse) => {
      return lastPageResponse.meta?.lastPostId || undefined;
    },
    
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 5,
  });
};

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

type UseMediaProps = {
    id: string;
    sourceType: "user" | "group";
    mediaType: MediaTypeGroup;
};

export const useMediaInfinite = ({ id, sourceType, mediaType }: UseMediaProps) => {
  return useInfiniteQuery({
        queryKey: [sourceType === "user" ? "profile-media" : "group-media", id, mediaType],
        queryFn: async ({ pageParam = 0 }) => {
            if (sourceType === "user") {
                return await postService.getProfileMediaPaginated(id, mediaType, pageParam as number, 20);
            } else {
                return await postService.getGroupMediaPaginated(id, mediaType, pageParam as number, 20);
            }
        },
        getNextPageParam: (lastPage, allPages) => {
            const currentDataCount = lastPage.data?.length || 0;
            if (currentDataCount < 20) {
                return undefined;
            }
            return allPages.length * 20;
        },
        initialPageParam: 0,
        enabled: !!id,
    });
};