import api from "../lib/axios";
//import {  } from "@frontend/lib/types/groups";
import { PostDto } from "@frontend/lib/types/posts";
import { ApiResponse } from "@frontend/lib/types/api";

export const groupsService = {
    getGroupFeed: async (lastPostId?: string) => {
        const params = new URLSearchParams();
        if (lastPostId) params.append("lastPostId", lastPostId);
        params.append("take", "20");
        const { data } = await api.get<ApiResponse<PostDto[]>>("/api/Group/feed", { params });
        return data;
    },
}