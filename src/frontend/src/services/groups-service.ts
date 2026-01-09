import api from "../lib/axios";
import { GroupDto, CreateGroupDto, UpdateGroupDto, MemberDto } from "@frontend/lib/types/groups";
import { PostDto } from "@frontend/lib/types/posts";
import { ApiResponse } from "@frontend/lib/types/api";
import { getgroups } from "process";

export const groupsService = {
    getGroupFeed: async (lastPostId?: string) => {
        const params = new URLSearchParams();
        if (lastPostId) params.append("lastPostId", lastPostId);
        params.append("take", "20");
        const { data } = await api.get<ApiResponse<PostDto[]>>("/api/Group/feed", { params });
        return data;
    },

    getMyGroups: async () => {
        const { data } = await api.get<ApiResponse<GroupDto[]>>("/api/Group/my-groups");
        return data;
    },

    getGroupById: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<GroupDto>>(`/api/Group/${groupId}`);
        return data;
    },
    
    createGroup: async (group: CreateGroupDto) => {
        const { data } = await api.post<ApiResponse<GroupDto>>("/api/Group", group);
        return data;
    },
}