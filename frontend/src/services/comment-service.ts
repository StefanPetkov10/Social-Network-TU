import api from "../lib/axios";
import { ApiResponse } from "@frontend/lib/types/api";
import { CommentDto, CreateCommentPayload } from "@frontend/lib/types/comment";

export const commentService = {
  getComments: async (postId: string, lastCommentId?: string, take: number = 20) => {
    const params = new URLSearchParams();
    if (lastCommentId) params.append("lastCommentId", lastCommentId);
    params.append("take", take.toString());

    const { data } = await api.get<ApiResponse<CommentDto[]>>(`/api/Comment/${postId}`, { params });
    return data;
  },

  getReplies: async (commentId: string, lastCommentId?: string, take: number = 10) => {
    const params = new URLSearchParams();
    if (lastCommentId) params.append("lastCommentId", lastCommentId);
    params.append("take", take.toString());

    const { data } = await api.get<ApiResponse<CommentDto[]>>(`/api/Comment/${commentId}/replies`, { params });
    return data;
  },

  // Better way to create comment with media. We use FormData to send multipart/form-data
  createComment: async (postId: string, payload: CreateCommentPayload) => {
    const formData = new FormData();
    formData.append("Content", payload.content);
    
    if (payload.parentCommentId) {
        formData.append("ParentCommentId", payload.parentCommentId);
    }

    if (payload.file) {
        formData.append("File", payload.file);
    }

    const { data } = await api.post<ApiResponse<CommentDto>>(
        `/api/Comment?postId=${postId}`, 
        formData, 
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
},

  editComment: async (commentId: string, payload: { content: string; fileToDelete?: string }) => {
     const { data } = await api.put<ApiResponse<CommentDto>>(`/api/Comment/${commentId}`, payload);
     return data;
  },

  deleteComment: async (commentId: string) => {
    const { data } = await api.delete<ApiResponse<boolean>>(`/api/Comment/${commentId}`);
    return data;
  }
};