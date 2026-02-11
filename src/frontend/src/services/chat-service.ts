import api from "../lib/axios";
import { ApiResponse } from "../lib/types/api";
import { ChatConversationDto, MessageDto, ChatAttachmentDto } from "../lib/types/chat";

export const chatService = {
  getConversations: async () => {
    const { data } = await api.get<ApiResponse<ChatConversationDto[]>>("/api/Chat/conversations");
    return data;
  },

  getHistory: async (otherUserId: string) => {
    const { data } = await api.get<ApiResponse<MessageDto[]>>(`/api/Chat/history/${otherUserId}`);
    return data;
  },

  uploadAttachments: async (formData: FormData) => {
    const { data } = await api.post<ChatAttachmentDto[]>("/api/Chat/upload-attachments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
};