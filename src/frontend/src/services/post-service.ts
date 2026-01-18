import { MediaTypeGroup } from "@frontend/lib/types/enums";
import api from "../lib/axios";
import { PostDto, PostMediaDto } from "../lib/types/posts";
import { ApiResponse } from "@frontend/lib/types/api"; 

export interface ProfileMediaResponse {
    images: PostMediaDto[];
    documents: PostMediaDto[];
}

export const postService = {
  getFeed: async (lastPostId?: string) => {
    const params = new URLSearchParams();
    if (lastPostId) params.append("lastPostId", lastPostId);
    params.append("take", "20");
    const { data } = await api.get<ApiResponse<PostDto[]>>("/api/Posts/", { params });
    return data;
  },
  
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
  },

  getProfileMedia: async (profileId: string) => {
    const { data } = await api.get<ApiResponse<ProfileMediaResponse>>(`/api/Posts/media/${profileId}`);
    return data;
  },

  getProfileMediaPaginated: async (profileId: string, type: MediaTypeGroup, skip: number, take: number = 20) => {
    const params = new URLSearchParams();
    params.append("type", type.toString());
    params.append("skip", skip.toString());
    params.append("take", take.toString());
    
    const { data } = await api.get<ApiResponse<PostMediaDto[]>>(`/api/Posts/media/profile/${profileId}/paginated`, { params });
    return data;
  },

  getGroupMediaPaginated: async (groupId: string, type: MediaTypeGroup, skip: number, take: number = 20) => {
    const params = new URLSearchParams();
    params.append("type", type.toString());
    params.append("skip", skip.toString());
    params.append("take", take.toString());

    const { data } = await api.get<ApiResponse<PostMediaDto[]>>(`/api/Posts/media/group/${groupId}/paginated`, { params });
    return data;
  }
};