import api from "../lib/axios";
import { FollowUser, FollowSuggestion } from "@frontend/lib/types/followers";
import { ApiResponse } from "@frontend/lib/types/api";
import { se } from "date-fns/locale";

export const followersService = {
    getUserFollowers: async (profileId: string, cursor: string | null = null, take: number = 20) => {
        const params = new URLSearchParams();
        if (cursor) params.append("lastFollowerDate", cursor);
        params.append("take", take.toString());
        
        const { data } = await api.get<ApiResponse<FollowUser[]>>(`/api/Follow/followers/${profileId}?${params.toString()}`);
        return data;
    },

    getUserFollowing: async (profileId: string, cursor: string | null = null, take: number = 20) => {
        const params = new URLSearchParams();
        if (cursor) params.append("lastFollowingDate", cursor);
        params.append("take", take.toString());
        
        const { data } = await api.get<ApiResponse<FollowUser[]>>(`/api/Follow/following/${profileId}?${params.toString()}`);
        return data;
    },

    getFollowSuggestions: async (skip: number = 0, take: number = 10) => {
        const { data } = await api.get<ApiResponse<FollowSuggestion[]>>(`/api/Follow/suggestions?skip=${skip}&take=${take}`);
        return data;
    },

    searchFollowers: async (profileId: string, query: string, take: number = 20) => {
        const params = new URLSearchParams();
        params.append("query", query);
        params.append("take", take.toString());

        const { data } = await api.get<ApiResponse<FollowUser[]>>(`/api/Follow/${profileId}/followers/search?${params.toString()}`);
        return data;
    },

    searchFollowing: async (profileId: string, query: string, take: number = 20) => {
        const params = new URLSearchParams();
        params.append("query", query);
        params.append("take", take.toString());
        const { data } = await api.get<ApiResponse<FollowUser[]>>(`/api/Follow/${profileId}/following/search?${params.toString()}`);
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

    removeFollower: async (followerId: string) => {
        const { data } = await api.delete<ApiResponse<null>>(`/api/Follow/remove-follower/${followerId}`);
        return data;
    },
};