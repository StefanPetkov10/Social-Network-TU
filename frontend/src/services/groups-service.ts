import api from "../lib/axios";
import { GroupDto, CreateGroupDto, UpdateGroupDto } from "@frontend/lib/types/groups";
import { PostDto } from "@frontend/lib/types/posts";
import { ApiResponse } from "@frontend/lib/types/api";
import { get } from "http";

export const groupsService = {
    getGroupFeed: async (lastPostId?: string) => {
        const params = new URLSearchParams();
        if (lastPostId) params.append("lastPostId", lastPostId);
        params.append("take", "20");
        const { data } = await api.get<ApiResponse<PostDto[]>>("/api/Group/feed", { params });
        return data;
    },

    getGroupPosts: async (groupId: string, lastPostId?: string) => {
        const params = new URLSearchParams();
        if (lastPostId) params.append("lastPostId", lastPostId);
        params.append("take", "10");
        const { data } = await api.get<ApiResponse<PostDto[]>>(`/api/Group/${groupId}/posts`, { params });
        return data;
    },
    
    getMyGroups: async () => {
        const { data } = await api.get<ApiResponse<GroupDto[]>>("/api/Group/my-groups");
        return data;
    },

    getGroupByName: async (name: string) => {
        const encodedName = encodeURIComponent(name);

        const { data } = await api.get<ApiResponse<GroupDto>>(`/api/Group/${encodedName}`);
        return data;
    },

    getGroupById: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<GroupDto>>(`/api/Group/id/${groupId}`);
        return data;
    },

    getDiscoverGroups: async (lastGroupId?: string) => {
        const params = new URLSearchParams();
        if (lastGroupId) params.append("lastGroupId", lastGroupId);
        params.append("take", "20");
        
        const { data } = await api.get<ApiResponse<GroupDto[]>>("/api/Group/discover", { params });
        return data;
    },
    
    createGroup: async (group: CreateGroupDto) => {
        const { data } = await api.post<ApiResponse<GroupDto>>("/api/Group", group);
        return data;
    },

    updateGroup: async (groupId: string, group: UpdateGroupDto) => {
        const { data } = await api.put<ApiResponse<GroupDto>>(`/api/Group/${groupId}`, group);
        return data;
    },

    deleteGroup: async (groupId: string) => {
        const { data } = await api.delete<ApiResponse<object>>(`/api/Group/${groupId}`);
        return data;
    },
}
