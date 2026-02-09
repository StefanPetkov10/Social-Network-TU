import api from "../lib/axios";
import { ApiResponse } from "../lib/types/api";
import { PostDto } from "../lib/types/posts";
import { SavedCollectionDto, SavePostRequest } from "../lib/types/saved-posts";

export const savedPostService = {
  toggleSavePost: async (data: SavePostRequest) => {
    const response = await api.post<ApiResponse<string>>("/api/SavedPosts", data);
    return response.data;
  },

  getCollections: async () => {
    const { data } = await api.get<ApiResponse<SavedCollectionDto[]>>("/api/SavedPosts/collections");
    return data;
  },

  getSavedPosts: async (collectionName?: string | null, skip: number = 0, take: number = 20) => {
    const params = new URLSearchParams();
    
    if (collectionName) {
        params.append("collectionName", collectionName);
    }
    
    params.append("skip", skip.toString());
    params.append("take", take.toString());

    const { data } = await api.get<ApiResponse<PostDto[]>>("/api/SavedPosts", { params });
    return data;
  },

  removeSavedPost: async (id: string) => {
    const { data } = await api.delete<ApiResponse<object>>(`/api/SavedPosts/${id}`);
    return data;
  }
};