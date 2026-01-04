import api from "../lib/axios";
import { FollowUser, FollowSuggestion } from "@frontend/lib/types/followers";
import { ApiResponse } from "@frontend/lib/types/api";

export const followersService = {
    getMyFollowers: async (cursor: string | null = null, take: number = 20) => {
        const params = new URLSearchParams();
        if (cursor) params.append("lastFollowerDate", cursor);
        params.append("take", take.toString());
        const { data } = await api.get<ApiResponse<FollowUser[]>>(`/api/Follow/my-followers?${params.toString()}`);
        return data;
    },

    getMyFollowing: async (cursor: string | null = null, take: number = 20) => {
        const params = new URLSearchParams();
        if (cursor) params.append("lastFollowingDate", cursor);
        params.append("take", take.toString());
        const { data } = await api.get<ApiResponse<FollowUser[]>>(`/api/Follow/following?${params.toString()}`);
        return data;
    },

    getFollowSuggestions: async (skip: number = 0, take: number = 10) => {
        const { data } = await api.get<ApiResponse<FollowSuggestion[]>>(`/api/Follow/suggestions?skip=${skip}&take=${take}`);
        return data;
    },

    followUser: async (profileId: string) => {
        const { data } = await api.post<ApiResponse<null>>(`/api/Follow/follow/${profileId}`);
        return data;
    },

    unfollowUser: async (profileId: string) => {
        const { data } = await api.delete<ApiResponse<null>>(`/api/Follow/unfollow/${profileId}`);
        return data;
    },
};

