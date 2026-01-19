import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { commentService } from "@frontend/services/comment-service";
import { CreateCommentPayload } from "@frontend/lib/types/comment";
import { toast } from "sonner";

export const useGetComments = (postId: string) => {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: async ({ pageParam }) => {
       const response = await commentService.getComments(postId, pageParam);
       return response; 
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
        if (lastPage.data && lastPage.data.length > 0) {
            return lastPage.data[lastPage.data.length - 1].id;
        }
        return undefined;
    },
  });
};

export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => commentService.createComment(postId, payload),
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] }); 
    },
  });
};