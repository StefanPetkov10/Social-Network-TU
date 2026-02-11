import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["chat-history", otherUserId],
    queryFn: async () => {
        if (!otherUserId) return [];
        const response = await chatService.getHistory(otherUserId);
        return response.data || [];
    },
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