import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@frontend/services/chat-service";
import { toast } from "sonner";

export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await chatService.getConversations();
      return response.data || [];
    },
    staleTime: 1000 * 60,
  });
};

export const useChatHistory = (otherUserId: string) => {
  return useInfiniteQuery({
    queryKey: ["chat-history", otherUserId],
    queryFn: async ({ pageParam = null }) => {
      if (!otherUserId) return { data: [], nextCursor: null };
      const response = await chatService.getHistory({ lastMessageId: pageParam as string | null, otherUserId });
      return {
        data: response.data || [],
        nextCursor: response.meta?.nextCursor || null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled: !!otherUserId,
  });
};

export const useUploadChatFiles = () => {
  return useMutation({
    mutationFn: (formData: FormData) => chatService.uploadAttachments(formData),
    onError: (error) => {
      toast.error("Грешка при качване на файл");
      console.error(error);
    }
  });
}