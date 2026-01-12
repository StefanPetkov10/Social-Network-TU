import api from "../lib/axios";
import { MemberDto } from "@frontend/lib/types/groups";
import { ApiResponse } from "@frontend/lib/types/api";
import { GroupRole } from "@frontend/lib/types/enums";

export const groupMembersService = {
    getGroupMembers: async (groupId: string, lastMemberId?: string) => {
        const params = new URLSearchParams();
        if (lastMemberId) params.append("lastMemberId", lastMemberId);
        params.append("take", "20");
        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/Group/${groupId}/members`, { params });
        return data;
    },

    getFriendsInGroup: async (groupId: string, take: number = 3, skip: number = 0) => {
        const params = new URLSearchParams();
        params.append("take", take.toString());
        params.append("skip", skip.toString());

        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/groups/${groupId}/friends`, { params });
        return data;
    },

    getMutualFriendsInGroup: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/groups/${groupId}/mutual-friends`);
        return data;
    },

    getGroupAdmins: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/groups/${groupId}/admins`);
        return data;
    },

    getPendingRequests: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/groups/${groupId}/requests`);
        return data;
    },

    joinGroup: async (groupId: string) => {
        const { data } = await api.post<ApiResponse<object>>(`/api/groups/${groupId}/join`);
        return data;
    },

    leaveGroup: async (groupId: string) => {
        const { data } = await api.delete<ApiResponse<object>>(`/api/groups/${groupId}/leave`);
        return data;
    },

    approveRequest: async (groupId: string, profileId: string) => {
        const { data } = await api.post<ApiResponse<object>>(`/api/groups/${groupId}/requests/${profileId}/approve`);
        return data;
    },

    rejectRequest: async (groupId: string, profileId: string) => {
        const { data } = await api.post<ApiResponse<object>>(`/api/groups/${groupId}/requests/${profileId}/reject`);
        return data;
    },

    removeMember: async (groupId: string, profileId: string) => {
        const { data } = await api.delete<ApiResponse<object>>(`/api/groups/${groupId}/members/${profileId}`);
        return data;
    },

    changeMemberRole: async (groupId: string, profileId: string, newRole: GroupRole) => {
        const { data } = await api.put<ApiResponse<object>>(`/api/groups/${groupId}/members/${profileId}/role`, { newRole });
        return data;
    }
};