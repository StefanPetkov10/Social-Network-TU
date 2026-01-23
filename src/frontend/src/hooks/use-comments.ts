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
        const comments = lastPage?.data;
        if (!comments || comments.length < 20) return undefined;
        return comments[comments.length - 1].id;
    },
  });
};

export const useGetReplies = (commentId: string, enabled: boolean = false) => {
    return useInfiniteQuery({
      queryKey: ["replies", commentId],
      queryFn: async ({ pageParam }) => {
         const response = await commentService.getReplies(commentId, pageParam);
         return response; 
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
          const replies = lastPage?.data;
          if (!replies || replies.length < 10) return undefined;
          return replies[replies.length - 1].id;
      },
      enabled: enabled,
    });
};

export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => commentService.createComment(postId, payload),
    onSuccess: async (_, variables) => {
      if (variables.parentCommentId) {
          await queryClient.invalidateQueries({ queryKey: ["replies", variables.parentCommentId] });
      }

      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });

      await queryClient.invalidateQueries({ queryKey: ["posts"] }); 
    },
    onError: (error: any) => {
        const msg = error?.response?.data?.errors?.[0] || "Грешка при публикуване.";
        toast.error(msg);
    }
  });
};