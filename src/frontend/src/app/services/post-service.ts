import api from "../../lib/axios";
import { PostDto } from "../../lib/types/posts";
import { ApiResponse } from "@frontend/lib/types/api"; 

export const postService = {
  getUserPosts: async (profileId: string, lastPostId?: string) => {
    const params = new URLSearchParams(); //URLSearchParams: Този код автоматично сглобява адреса. Вместо да пишем ръчно: api.get("/api/Post/user-posts?profileId=" + id + "&take=10") Той го прави по-чисто и сигурно.
    params.append("profileId", profileId);
    if (lastPostId) params.append("lastPostId", lastPostId);
    params.append("take", "10");

    const { data } = await api.get<ApiResponse<PostDto[]>>(`/api/Posts/profile/${profileId}`, { params });

    return data; 
  },

  createPost: async (formData: FormData) => {
    const { data } = await api.post<ApiResponse<any>>("/api/Posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
};