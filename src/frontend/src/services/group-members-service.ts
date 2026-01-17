import api from "../lib/axios";
import { MemberDto } from "@frontend/lib/types/groups";
import { ApiResponse } from "@frontend/lib/types/api";
import { GroupRole } from "@frontend/lib/types/enums";

export const groupMembersService = {

    getGroupMembers: async (groupId: string, lastJoinedDate?: string, lastProfileId?: string) => {
        const params = new URLSearchParams();
        params.append("take", "50");
        if (lastJoinedDate) params.append("lastJoinedDate", lastJoinedDate);

        if (lastProfileId) params.append("lastProfileId", lastProfileId); 

        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/GroupMembership/${groupId}/members`, { params });
        return data;
    },

    getFriendsInGroup: async (groupId: string, take: number = 3, skip: number = 0) => {
        const params = new URLSearchParams();
        params.append("take", take.toString());
        params.append("skip", skip.toString());

        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/GroupMembership/${groupId}/friends`, { params });
        return data;
    },

    getMutualFriendsInGroup: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/GroupMembership/${groupId}/mutual-friends`);
        return data;
    },

    getGroupAdmins: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/GroupMembership/${groupId}/admins`);
        return data;
    },

    getPendingRequests: async (groupId: string) => {
        const { data } = await api.get<ApiResponse<MemberDto[]>>(`/api/GroupMembership/${groupId}/requests`);
        return data;
    },

    joinGroup: async (groupId: string) => {
        const { data } = await api.post<ApiResponse<object>>(`/api/GroupMembership/${groupId}/join`);
        return data;
    },

    leaveGroup: async (groupId: string) => {
        const { data } = await api.delete<ApiResponse<object>>(`/api/GroupMembership/${groupId}/leave`);
        return data;
    },

    approveRequest: async (groupId: string, profileId: string) => {
        const { data } = await api.post<ApiResponse<object>>(`/api/GroupMembership/${groupId}/requests/${profileId}/approve`);
        return data;
    },

    rejectRequest: async (groupId: string, profileId: string) => {
        const { data } = await api.post<ApiResponse<object>>(`/api/GroupMembership/${groupId}/requests/${profileId}/reject`);
        return data;
    },

    removeMember: async (groupId: string, profileId: string) => {
        const { data } = await api.delete<ApiResponse<object>>(`/api/GroupMembership/${groupId}/members/${profileId}`);
        return data;
    },

    changeMemberRole: async (groupId: string, profileId: string, newRole: GroupRole) => {
        const { data } = await api.put<ApiResponse<object>>(`/api/GroupMembership/${groupId}/members/${profileId}/role`, { newRole });
        return data;
    }
};